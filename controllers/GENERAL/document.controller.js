const _ = require('lodash');

const Document = require('../../models/GENERAL/document.model');
const File = require('../../models/GENERAL/file.model');
const Task = require('../../models/GENERAL/task.model');

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

  res.status(200).json({
    status: 'success',
    env: {
      updatedDocument,
    },
  });
});

exports.uploadDocumentFile = catchAsync(async (req, res, next) => {
  const pickFields = ['name', 'description', 'dropbox'];
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

  document._files.push(file._id);
  document.fileLength = document._files.length;

  if (['Outgoing', 'Archived', 'Internal'].includes(document.status)) {
    document.process.uploaded = true;
  }

  const updateBody = {
    _updatedBy: req.user._id,
    _files: document._files,
    fileLength: document.fileLength,
    process: document.process,
  };

  const updatedDocument = await Document.findByIdAndUpdate(id, updateBody, {
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

exports.updateUploadedDocumentFile = catchAsync(async (req, res, next) => {
  const pickFields = ['name', 'description', 'dropbox'];
  const filteredBody = _.pick(req.body, pickFields);
  const { _documentId, id } = req.params;
  const initialQuery = {
    _id: id,
    _documentId: _documentId,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const file = await File.findOne(initialQuery);
  if (!file) return next(new AppError('File not found', 404));

  const updatedFile = await File.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    env: {
      file: updatedFile,
    },
  });
});

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
    //control number generator
    filteredBody.controlNumber = Math.floor(
      Math.random() * 1000000000
    ).toString();
  }

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

exports.releaseDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const pickFields = ['recipient', 'dateReleased'];
  const filteredBody = _.pick(req.body, pickFields);
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

  res.status(200).json({
    status: 'success',
    env: {
      document: updatedDocument,
    },
  });
});

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

exports.patchDocumentProcess = catchAsync(async (req, res, next) => {
  const pickFields = ['body'];
  const filteredBody = _.pick(req.body, pickFields);
  const { action } = req.params;
  const allowedActions = ['printed', 'signed', 'released'];

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

exports.patchDocumentStatus = catchAsync(async (req, res, next) => {
  const pickFields = ['_taskId', 'message'];
  const filteredBody = _.pick(req.body, pickFields);
  const { id, action } = req.params;
  const { prevStatus } = req.query;
  const allowedActions = [
    'incoming',
    'outgoing',
    'internal',
    'archived',
    'personal',
    'undo',
  ];
  const allowedStatus = ['Outgoing', 'Internal', 'Archived'];

  if (!allowedActions.includes(action))
    return next(new AppError('Invalid action params', 400));

  if (action === 'undo' && !prevStatus)
    return next(new AppError('Please provide previous status value', 400));

  if (action === 'undo' && !allowedStatus.includes(prevStatus))
    return next(new AppError('Invalid previous status value', 400));
  const documentQuery = {
    _id: id,
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(documentQuery);
  if (!document) return next(new AppError('Document not found', 404));

  if (action === 'undo' && document.status !== 'Deleted')
    return next(new AppError('Document not deleted', 404));

  if (['outgoing', 'internal', 'archived'].includes(action)) {
    if (document.status === 'Deleted')
      return next(new AppError('Document not found', 404));

    const taskQuery = {
      _id: filteredBody._taskId,
      status: { $ne: 'Deleted' },
      _tenantId: req.user._tenantId,
    };

    const task = await Task.findOne(taskQuery);
    if (!task) return next(new AppError('Task not found', 404));

    task.status = 'Completed';
    task.message = filteredBody.message;
    const updatedTask = await task.save({ validateBeforeSave: false });

    if (action === 'outgoing') document.status = 'Outgoing';
    else if (action === 'internal') document.status = 'Internal';
    else if (action === 'archived') document.status = 'Archived';
    document.message = filteredBody.message;
    const updatedDocument = await document.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      env: {
        updatedDocument,
      },
    });
  } else if (action === 'undo') {
    document.status = prevStatus;
    const updatedDocument = await document.save({ validateBeforeSave: false });
    res.status(200).json({
      status: 'success',
      env: {
        updatedDocument,
      },
    });
  }
});

exports.updateDocumentStorage = catchAsync(async (req, res, next) => {
  const pickFields = ['storage'];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;

  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);

  if (!document) return next(new AppError('Document not found', 404));

  document['storage']['status'] = filteredBody.storage.status;
  const updatedDocument = await document.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    env: {
      document: updatedDocument,
    },
  });
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

exports.getAssigned = catchAsync(async (req, res, next) => {});
