const _ = require('lodash');
const axios = require('axios');

const Document = require('../../models/GENERAL/document.model');
const File = require('../../models/GENERAL/file.model');
const Task = require('../../models/GENERAL/task.model');
const ScannedDocument = require('../../models/GENERAL/scanned_document.model');

const ControlNumber = require('../../utils/control-number/controlNumber');
const settings = require('../../mock/settings');

const { updateSideEffects } = require('../../utils/cleanup');
const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.createDocument = catchAsync(async (req, res, next) => {
  const pickFields = [
    'subject',
    'sender',
    'senderType',
    'requestDate',
    'dateReceived',
    'receivedThru',
  ];

  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;
  filteredBody.type = 'Incoming';

  const document = await Document.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      document,
    },
  });
});

exports.getAllDocuments = catchAsync(async (req, res, next) => {
  const initialQuery = {
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(
    Document.find(initialQuery)
      .populate({
        path: '_excludes',
        populate: {
          path: '_role',
          model: 'Role',
        },
      })
      .populate({
        path: '_includes',
        populate: {
          path: '_role',
          model: 'Role',
        },
      }),
    req.query
  )
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nQueryFeatures = new QueryFeatures(
    Document.find(initialQuery)
      .populate({
        path: '_excludes',
        populate: {
          path: '_role',
          model: 'Role',
        },
      })
      .populate({
        path: '_includes',
        populate: {
          path: '_role',
          model: 'Role',
        },
      })
      .populate({
        path: '_fromTaskId',
        select: '_documentId',
        populate: {
          path: '_documentId',
          model: 'Document',
          populate: {
            path: '_files',
            model: 'File',
          },
        },
      }),
    req.query
  )
    .filter()
    .count();

  const documents = await queryFeatures.query;
  const nDocuments = await nQueryFeatures.query;

  res.status(200).json({
    status: 'Success',
    total_docs: nDocuments,
    env: {
      documents,
    },
  });
});

exports.getDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(
    Document.findOne(initialQuery),
    req.query
  )
    .limitFields()
    .populate();

  const document = await queryFeatures.query;
  if (!document) return next(new AppError('Document not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      document,
    },
  });
});

exports.getDocumentFiles = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(
    Document.findOne(initialQuery),
    req.query
  );

  const document = await queryFeatures.query;
  if (!document) return next(new AppError('Document not found', 404));

  const fileQuery = {
    _documentId: id,
    status: { $ne: 'Deleted' },
  };

  const fileQueryFeature = new QueryFeatures(File.find(fileQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nFileQueryFeature = new QueryFeatures(File.find(fileQuery), req.query)
    .filter()
    .count();

  const files = await fileQueryFeature.query;
  const nFiles = await nFileQueryFeature.query;

  res.status(200).json({
    status: 'Success',
    total_docs: nFiles,
    env: {
      files,
    },
  });
});

// UPDATE DATE RECEIVED - OCR
exports.updateDocument = catchAsync(async (req, res, next) => {
  const pickFields = [
    'subject',
    'sender',
    'senderType',
    'requestDate',
    'dateReceived',
    'receivedThru',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  filteredBody._updatedBy = req.user._id;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);
  if (!document) return next(new AppError('Document not found', 404));

  const updatedDocument = await Document.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // UPDATE SIDE EFFECTS
  const updateArgs = [
    {
      Model: ScannedDocument,
      query: {
        _documentId: id,
        _tenantId: req.user._tenantId,
        status: { $ne: 'Deleted' },
      },
      data: { dateReceived: filteredBody.dateReceived },
    },
  ];

  if (filteredBody.dateReceived) await updateSideEffects(updateArgs);

  res.status(200).json({
    status: 'success',
    env: {
      updatedDocument,
    },
  });
});

// UPDATE DOCUMENT OCR STATUS TO NO
exports.uploadDocumentFile = catchAsync(async (req, res, next) => {
  const pickFields = [
    'name',
    'description',
    'dropbox',
    'acknowledgementReceipt',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  filteredBody._documentId = id;
  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);
  if (!document) return next(new AppError('Document not found', 404));

  const file = await File.create(filteredBody);
  console.log(file);

  document._files.push(file._id);
  document.fileLength = document._files.length;
  document._updatedBy = req.user._id;
  document.ocrStatus = 'No';

  if (['Outgoing', 'Archived', 'Internal'].includes(document.type))
    document.process.uploaded = true;

  await document.save();

  res.status(200).json({
    status: 'success',
    env: {
      document,
    },
  });
});

// UPDATE OCR
exports.updateUploadedDocumentFile = catchAsync(async (req, res, next) => {
  const { _documentId, id } = req.params;
  const pickFields = ['name', 'description', 'dropbox'];
  const filteredBody = _.pick(req.body, pickFields);

  const initialQuery = {
    _id: id,
    _documentId: _documentId,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const file = await File.findOne(initialQuery);
  if (!file) return next(new AppError('File not found', 404));

  // FAST OBJ COMPARE XD
  if (
    filteredBody.dropbox &&
    JSON.stringify(filteredBody.dropbox) !== JSON.stringify(file.dropbox)
  )
    filteredBody.ocrStatus = 'No';

  const updatedFile = await File.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // UPDATE SIDE EFFECTS
  if (
    filteredBody.dropbox &&
    JSON.stringify(filteredBody.dropbox) !== JSON.stringify(file.dropbox)
  ) {
    const updateArgs = [
      {
        Model: Document,
        query: {
          _id: _documentId,
          status: { $ne: 'Deleted' },
          _tenantId: req.user._tenantId,
        },
        data: { ocrStatus: 'No' },
      },
      {
        Model: ScannedDocument,
        query: {
          _fileId: file._id,
          status: { $ne: 'Deleted' },
          _tenantId: req.user._tenantId,
        },
        data: { status: 'Deleted' },
      },
    ];

    await updateSideEffects(updateArgs);
  }

  res.status(200).json({
    status: 'success',
    env: {
      file: updatedFile,
    },
  });
});

// UPDATE OCR DOCUMENT
exports.classifyDocument = catchAsync(async (req, res, next) => {
  const pickFields = [
    'classification',
    'subClassification',
    'remarks',
    '_assignedTo',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._updatedBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;

  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);
  if (!document) return next(new AppError('Document not found', 404));

  if (!document.controlNumber) {
    const data = {
      type: document.type,
      ...filteredBody,
    };
    const configs = settings.ALGORITHM;
    const controlNumber = await new ControlNumber(
      data,
      configs,
      req.user._tenantId
    )
      .fieldBased('type')
      .sequence('monthly', 'type')
      .month()
      .year()
      .sequence('yearly', 'type')
      .fieldBased('classification')
      .generate();

    filteredBody.controlNumber = controlNumber;
    filteredBody.dateClassified = new Date();
  }

  if (document.type === 'Incoming' && document.isAssigned !== true) {
    filteredBody.isAssigned = false;
  }

  const updatedDocument = await Document.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // UPDATE SIDE EFFECTS
  const updateArgs = [
    {
      Model: ScannedDocument,
      query: {
        _documentId: document._id,
        status: { $ne: 'Deleted' },
        _tenantId: req.user._tenantId,
      },
      data: filteredBody,
    },
  ];

  await updateSideEffects(updateArgs);

  res.status(200).json({
    status: 'success',
    env: {
      document: updatedDocument,
    },
  });
});

exports.acknowledgeDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const pickFields = ['dateConfirmed'];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._updatedBy = req.user._id;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);

  if (!document) return next(new AppError('Document not found', 404));

  document.process.acknowledged = true;

  filteredBody.dateConfirmed = new Date();

  const updatedDocument = await Document.findByIdAndUpdate(
    id,
    { ...filteredBody, process: document.process },
    {
      new: true,
      runValidators: true,
    }
  );

  // UPDATE SIDE EFFECTS
  const updateArgs = [
    {
      Model: ScannedDocument,
      query: {
        _documentId: document._id,
        status: { $ne: 'Deleted' },
        _tenantId: req.user._tenantId,
      },
      data: filteredBody,
    },
  ];

  await updateSideEffects(updateArgs);

  res.status(200).json({
    status: 'success',
    env: {
      document: updatedDocument,
    },
  });
});

// - CLEANUP
exports.deleteDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOneAndUpdate(initialQuery, {
    status: 'Deleted',
  });

  if (!document) return next(new AppError('Document not found', 404));

  // UPDATE SIDE EFFECTS
  const updateArgs = [
    {
      Model: ScannedDocument,
      query: {
        _documentId: document._id,
        status: { $ne: 'Deleted' },
        _tenantId: req.user._tenantId,
      },
      data: { status: 'Deleted' },
    },
  ];

  await updateSideEffects(updateArgs);

  // DO SOME DOCUMENT ID CLEANUP HERE using referenceIdCleanup util

  res.status(204).json({
    status: 'success',
  });
});

exports.forFinalAction = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const pickFields = [
    'finalStatus',
    'confidentialityLevel',
    '_includes',
    '_excludes',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._updatedBy = req.user._id;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);
  if (!document) return next(new AppError('Document not found', 404));

  const updatedDocument = await Document.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    env: {
      document: updatedDocument,
    },
  });
});

// UPDATE OCR DOCUMENT
exports.releaseDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const pickFields = ['documentFileLinks', 'recipients', 'dateReleased'];
  const filteredBody = _.pick(req.body, pickFields);
  const { documentFileLinks } = filteredBody;
  delete filteredBody.documentFileLinks;
  filteredBody._updatedBy = req.user._id;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);

  if (!document) return next(new AppError('Document not found', 404));

  document.process.released = true;

  const updatedDocument = await Document.findByIdAndUpdate(
    id,
    { ...filteredBody, process: document.process },
    {
      new: true,
      runValidators: true,
    }
  );

  // UPDATE SIDE EFFECTS
  const updateArgs = [
    {
      Model: ScannedDocument,
      query: {
        _documentId: document._id,
        status: { $ne: 'Deleted' },
        _tenantId: req.user._tenantId,
      },
      data: filteredBody,
    },
  ];

  await updateSideEffects(updateArgs);

  if (documentFileLinks.length !== 0) {
    const outgoingDocument = await Document.findById(
      updatedDocument._id
    ).populate({
      path: '_fromTaskId',
      select: '_documentId',
      populate: {
        path: '_documentId',
        model: 'Document',
      },
    });

    const incomingDocument = doc._fromTaskId._documentId;

    const userEmails = [incomingDocument.sender.email];

    const { recipients } = outgoingDocument;
    for (let recipient of recipients) {
      userEmails.push(recipient.email);
    }

    let fileBufferArray = [];
    for (let file of documentFileLinks) {
      const { fileName, link } = file;
      const downloadedFile = await axios.get(link);

      if (downloadedFile) {
        fileBufferArray.push({
          name: fileName,
          buffer: Buffer.from(downloadedFile.data).toString('base64'),
        });
      }
    }

    const file = await axios.get(attachment.link);

    if (file) {
      const bufferedFile = Buffer.from(file.data).toString('base64');
      const emailAttachment = {
        content: bufferedFile,
        filename: `some-attachment${index}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
        content_id: 'mytext',
      };

      emailAttachments.push(emailAttachment);

      const emailOptions = {
        to: sendTo,
        subject,
        html: '<p>Here’s an attachment for you!</p>',
        html: `<p>${message}</p>`,
        attachments: emailAttachments,
      };

      await sendMail(emailOptions);
    }
  }

  res.status(200).json({
    status: 'success',
    env: {
      document: updatedDocument,
    },
  });
});

// UPDATE OCR DOCUMENT
exports.documentAssignation = catchAsync(async (req, res, next) => {
  const pickFields = [
    '_includes',
    '_excludes',
    'confidentialityLevel',
    '_assignedTo',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;

  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);

  if (!document) return next(new AppError('Document not found', 404));

  if (filteredBody._assignedTo) filteredBody.isAssigned = true;

  const updatedDocument = await Document.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // UPDATE SIDE EFFECTS
  const updateArgs = [
    {
      Model: ScannedDocument,
      query: {
        _documentId: document._id,
        status: { $ne: 'Deleted' },
        _tenantId: req.user._tenantId,
      },
      data: filteredBody,
    },
  ];

  await updateSideEffects(updateArgs);

  res.status(200).json({
    status: 'success',
    env: {
      document: updatedDocument,
    },
  });
});

exports.updateDocumentProcess = catchAsync(async (req, res, next) => {
  const pickFields = ['body'];
  const filteredBody = _.pick(req.body, pickFields);
  const { action } = req.params;
  const allowedActions = [
    'printed',
    'signed',
    'released',
    'receipt',
    'acknowledged',
  ];

  if (!allowedActions.includes(action))
    return next(new AppError('Invalid action params', 400));

  const documents = [];
  for (const row of filteredBody.body) {
    const documentQuery = {
      _id: row._id,
      status: { $ne: 'Deleted' },
      _tenantId: req.user._tenantId,
    };

    const document = await Document.findOne(documentQuery);
    if (!document)
      return next(new AppError('One of the documents does not exist', 404));
    documents.push(document);
  }

  const updatedDocuments = [];
  for (const document of documents) {
    if (action === 'printed') document.process.printed = true;
    else if (action === 'signed') document.process.signed = true;
    else if (action === 'released') document.process.released = true;
    else if (action === 'receipt') document.process.receipt = true;
    else if (action === 'acknowledged') document.process.acknowledged = true;

    const updatedDocument = await document.save({ validateBeforeSave: false });
    updatedDocuments.push(updatedDocument);
  }

  res.status(200).json({
    status: 'success',
    env: {
      documents: updatedDocuments,
    },
  });
});

exports.patchDocumentType = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const pickFields = ['_taskId', 'message', 'type'];
  const filteredBody = _.pick(req.body, pickFields);

  const documentQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(documentQuery);
  if (!document) return next(new AppError('Document not found', 404));

  document.type = filteredBody.type;
  document.dateApproved = new Date();

  const taskQuery = {
    _id: filteredBody._taskId,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const task = await Task.findOne(taskQuery);
  if (!task) return next(new AppError('Task not found', 404));

  task.status = 'Completed';
  task['message'] = filteredBody.message;

  document._fromTaskId = task._id;

  const updatedDocument = await document.save({ validateBeforeSave: false });
  await task.save({ validateBeforeSave: false });

  // UPDATE SIDE EFFECTS
  const updateArgs = [
    {
      Model: ScannedDocument,
      query: {
        _documentId: document._id,
        status: { $ne: 'Deleted' },
        _tenantId: req.user._tenantId,
      },
      data: { type: document.type },
    },
  ];

  await updateSideEffects(updateArgs);

  res.status(200).json({
    status: 'success',
    env: {
      document: updatedDocument,
    },
  });
});

exports.patchDocumentStatus = catchAsync(async (req, res, next) => {
  const { id, action } = req.params;
  const { prevStatus } = req.query;
  const allowedActions = ['undo'];
  const allowedStatus = ['Active'];

  if (!allowedActions.includes(action))
    return next(new AppError('Invalid action params', 400));

  if (action === 'undo' && !prevStatus)
    return next(new AppError('Please provide previous status value', 400));

  if (action === 'undo' && !allowedStatus.includes(prevStatus))
    return next(new AppError('Invalid previous status value', 400));

  const document = await Document.findById(id);
  if (!document) return next(new AppError('Document not found', 404));

  if (action === 'undo' && document.status !== 'Deleted')
    return next(new AppError('Document not deleted', 404));

  if (action === 'undo') {
    document.status = prevStatus;
  } else {
    document.status = action;
  }

  const updatedDocument = await document.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    env: {
      document: updatedDocument,
    },
  });
});

exports.updateDocumentStorage = catchAsync(async (req, res, next) => {
  const pickFields = ['body'];
  const filteredBody = _.pick(req.body, pickFields);

  const documents = [];
  for (const row of filteredBody.body) {
    const documentQuery = {
      _id: row._id,
      status: { $ne: 'Deleted' },
      _tenantId: req.user._tenantId,
    };

    const document = await Document.findOne(documentQuery);
    if (!document)
      return next(new AppError('One of the documents does not exist', 404));
    documents.push(document);
  }

  const updatedDocuments = [];
  for (const document of documents) {
    document.storage.status = req.params.status;

    const updatedDocument = await document.save({ validateBeforeSave: false });
    updatedDocuments.push(updatedDocument);
  }

  res.status(200).json({
    status: 'success',
    env: {
      documents: updatedDocuments,
    },
  });

  // const pickFields = ['storage'];
  // const filteredBody = _.pick(req.body, pickFields);
  // const { id } = req.params;

  // const initialQuery = {
  //   _id: id,
  //   status: { $ne: 'Deleted' },
  //   _tenantId: req.user._tenantId,
  // };

  // const document = await Document.findOne(initialQuery);

  // if (!document) return next(new AppError('Document not found', 404));

  // document['storage']['status'] = filteredBody.storage.status;
  // const updatedDocument = await document.save({ validateBeforeSave: false });

  // res.status(200).json({
  //   status: 'success',
  //   env: {
  //     document: updatedDocument,
  //   },
  // });
});

exports.getFileTask = catchAsync(async (req, res, next) => {
  let route = [];
  const ids = req.params.ids.split(',');

  const files = await File.find({
    _id: { $in: ids },
  });
  for (let file of files) {
    console.log(file);
    let tasks = await Task.findOne({
      _documentId: file._documentId,
    })
      .populate('_createdBy', 'firstName lastName')
      .populate('_assigneeId', 'firstName lastName');
    if (tasks) route.push({ file, task: tasks });
  }
  res.status(200).json({
    status: 'success',
    env: {
      history: route,
    },
  });
});

exports.getDocumentClassification = catchAsync(async (req, res, next) => {
  const initialQuery = {
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
    $or: [
      { $and: [{ type: 'Incoming' }, { fileLength: { $gte: 0 } }] },
      {
        $and: [
          { type: { $in: ['Outgoing', 'Internal', 'Archived'] } },
          { 'process.uploaded': true },
        ],
      },
    ],
  };

  const queryFeatures = new QueryFeatures(
    Document.find(initialQuery),
    req.query
  )
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nQueryFeatures = new QueryFeatures(
    Document.find(initialQuery),
    req.query
  )
    .filter()
    .count();

  const documents = await queryFeatures.query;
  const nDocuments = await nQueryFeatures.query;

  res.status(200).json({
    status: 'Success',
    total_docs: nDocuments,
    env: {
      documents,
    },
  });
});

exports.generateControlNumber = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: '619f5c8c123f3ec5f10862a9',
  };

  const document = await Document.findOne(initialQuery);

  if (!document) return next(new AppError('Document not found', 404));

  const configs = settings.ALGORITHM;
  let controlNumber = await new ControlNumber(
    document,
    configs,
    '619f5c8c123f3ec5f10862a9'
  )
    .fieldBased('type')
    .sequence('monthly', 'type')
    .month()
    .year()
    .sequence('yearly', 'type')
    .fieldBased('classification')
    .generate();

  // let controlNumber = await new ControlNumber(
  //   {},
  //   configs,
  //   '619f5c8c123f3ec5f10862a9'
  // )
  //   .fieldBased('type')
  //   .sequence('monthly', 'book')
  //   .month()
  //   .year()
  //   .sequence('yearly', 'book')
  //   .generate();

  res.status(200).json({
    status: 'success',
    env: {
      controlNumber: controlNumber,
    },
  });
});

exports.updateDocumentIsAssigned = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const initialQuery = {
    _id: id,
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);
  if (!document) return next(new AppError('Document not found', 404));

  const updateDocument = {
    isAssigned: false,
  };

  const updatedDocument = await Document.findByIdAndUpdate(
    initialQuery._id,
    updateDocument,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    env: {
      updatedDocument,
    },
  });
});
