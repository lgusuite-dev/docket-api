const express = require('express');
const cors = require('cors');
// OCR
const schedule = require('node-schedule');
const axios = require('axios');
const convertapi = require('convertapi')('fXky3cUmSbSHa1HK');
const tesseract = require('tesseract.js');

const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const userRouter = require('./routes/GENERAL/user.routes');
const authRouter = require('./routes/GENERAL/auth.routes');
const teamRouter = require('./routes/GENERAL/team.routes');
const roleRouter = require('./routes/GENERAL/role.routes');
const taskRouter = require('./routes/GENERAL/task.routes');
const eventRouter = require('./routes/GENERAL/event.routes');
const calendarRouter = require('./routes/GENERAL/calendar.routes');
const documentRouter = require('./routes/GENERAL/document.routes');
const zoomRouter = require('./routes/ZOOM/zoom.routes');
const myDocumentsRouter = require('./routes/GENERAL/my-documents.routes');
const bookRouter = require('./routes/GENERAL/book.routes');
const boxRouter = require('./routes/GENERAL/box.routes');
const scannedDocumentRouter = require('./routes/GENERAL/scanned_document.routes');

const errorController = require('./controllers/GENERAL/error.controller');

const Document = require('./models/GENERAL/document.model');
const File = require('./models/GENERAL/file.model');
const ScannedDocument = require('./models/GENERAL/scanned_document.model');

const AppError = require('./utils/errors/AppError');
const { origin, whitelist } = require('./utils/security');

const app = express();

app.use(
  cors({
    origin,
    methods: ['POST', 'PATCH', 'PUT', 'DELETE', 'GET', 'OPTIONS', 'HEAD'],
    credentials: true,
  })
);

app.use(helmet());

app.use(express.json());

app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist }));

app.use('/api/v1/tenants', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/teams', teamRouter);
app.use('/api/v1/roles', roleRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/events', eventRouter);
app.use('/api/v1/zoom', zoomRouter);
app.use('/api/v1/calendar', calendarRouter);
app.use('/api/v1/documents', documentRouter);
app.use('/api/v1/my-documents', myDocumentsRouter);
app.use('/api/v1/books', bookRouter);
app.use('/api/v1/box', boxRouter);
app.use('/api/v1/scanned-documents', scannedDocumentRouter);

app.get('/api/v1/health', (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'Up and Running!',
  });
});

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

const pdfConvertAPI = async (imageLink) => {
  try {
    const result = await convertapi.convert('png', { File: imageLink }, 'pdf');
    const converted = result.files.map((file) => file.fileInfo.Url);
    const promises = converted.map(async (img) => await extractTesseract(img));
    const extractedText = await Promise.all(promises);

    return extractedText;
  } catch (err) {
    console.error(err.message);
  }
};

const extractTesseract = async (imagePath) => {
  try {
    const extractedText = await tesseract
      .recognize(imagePath)
      .progress((p) => console.log(p));

    return extractedText.text;
  } catch (err) {
    console.error(err.message);
  }
};

schedule.scheduleJob('*/10 * * * * *', async () => {
  // const documents = await Document.find({
  //   ocrStatus: 'No',
  //   confidentialityLevel: { $ne: null },
  //   controlNumber: { $ne: null },
  //   isMyDocuments: false,
  // })
  //   .populate('_files')
  //   .limit(10);
  // console.log(documents);
  // if (documents.length) {
  //   for (let document of documents) {
  //     if (document._files.length) {
  //       console.log('FILESSSSS', document._files);
  //       document.ocrStatus = 'Scanning';
  //       await document.save();
  //       for (let file of document._files) {
  //         if (file.ocrStatus === 'No') {
  //           const foundFile = await File.findByIdAndUpdate(
  //             file._id,
  //             { ocrStatus: 'Scanning' },
  //             { new: true }
  //           );
  //           const { data: fileData } = await axios.post(
  //             'https://api.dropboxapi.com/2/files/get_temporary_link',
  //             { path: file.dropbox.path_display },
  //             {
  //               headers: {
  //                 Authorization: `Bearer ${process.env.DROPBOX_ACCESS_TOKEN}`,
  //               },
  //             }
  //           );
  //           const fileExtract = fileData.metadata.name.split('.');
  //           const fileExtension = fileExtract[fileExtract.length - 1];
  //           const extractedText = await pdfConvertAPI(fileData.link);
  //           if (extractedText.length) {
  //             for (let [index, text] of extractedText.entries()) {
  //               const scannedDocument = {
  //                 text: text.trim(),
  //                 page: ++index,
  //                 fileType: fileExtension,
  //                 controlNumber: document.controlNumber,
  //                 confidentialityLevel: document.confidentialityLevel,
  //                 _fileId: file._id,
  //                 _documentId: file._documentId,
  //                 _tenantId: file._tenantId,
  //               };
  //               await ScannedDocument.create(scannedDocument);
  //             }
  //           }
  //           if (foundFile) {
  //             foundFile.ocrStatus = 'Done';
  //             await foundFile.save();
  //           }
  //         }
  //       }
  //       document.ocrStatus = 'Done';
  //       await document.save();
  //     }
  //   }
  // }
});

app.use(errorController);

module.exports = app;
