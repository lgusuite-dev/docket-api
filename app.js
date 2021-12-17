const express = require('express');
const cors = require('cors');

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
const dashboardRouter = require('./routes/GENERAL/dashboard.routes');
const fileRouter = require('./routes/GENERAL/file.routes');
const firebaseRouter = require('./routes/Google/firebase.routes');

const errorController = require('./controllers/GENERAL/error.controller');

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
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/files', fileRouter);
app.use('/api/v1/firebase', firebaseRouter);

app.get('/api/v1/health', (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'Up and Running!',
  });
});

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorController);

module.exports = app;
