const _ = require('lodash');

const Document = require('../../models/GENERAL/document.model');
const Folder = require('../../models/GENERAL/folder.model');
const File = require('../../models/GENERAL/file.model');
const Task = require('../../models/GENERAL/task.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.createDocument = catchAsync(async (req, res, next) => {
  const pickFields = [
    'subject',
    'senderType',
    'senderFirstName',
    'senderLastName',
    'department',
    'position',
    'mobileNumber',
    'email',
    'requestDate',
    'dateReceived',
    'receivedThru',
    'others',
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
    'senderType',
    'senderFirstName',
    'senderLastName',
    'department',
    'position',
    'mobileNumber',
    'email',
    'requestDate',
    'dateReceived',
    'receivedThru',
    'others',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  filteredBody._updatedBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;
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

  const updateBody = {
    _updatedBy: req.user._id,
    _files: document._files,
    fileLength: document.fileLength,
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

  //control number generator
  filteredBody.controlNumber = Math.floor(
    Math.random() * 1000000000
  ).toString();

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

exports.patchDocumentProcess = catchAsync(async (req, res, next) => {
  const { id, action } = req.params;
  const allowedActions = ['printed', 'signed', 'released'];
  const documentQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  if (!allowedActions.includes(action))
    return next(new AppError('Invalid action params', 400));

  const document = Document.findOne(documentQuery);

  if (action === 'printed') document.process.printed = true;
  else if (action === 'signed') document.process.signed = true;
  else if (action === 'released') document.process.released = true;

  const updatedDocument = await document.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    env: {
      document: updatedDocument,
    },
  });
});

exports.patchDocumentfinalStatus = catchAsync(async (req, res, next) => {
  const { id, action } = req.params;
  const allowedActions = ['approved', 'onhold', 'destroy'];
  const documentQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  if (!allowedActions.includes(action))
    return next(new AppError('Invalid action params', 400));

  const document = Document.findOne(documentQuery);

  if (document.status === 'Approved')
    return next(new AppError('Document already Approved', 400));
  else if (document.status === 'On Hold')
    return next(new AppError('Document already On Hold', 400));
  else if (document.status === 'Destroy')
    return next(new AppError('Document already Destroyed', 400));

  if (action === 'approved') document.status = 'Approved';
  else if (action === 'onhold') document.status = 'On Hold';
  else if (action === 'destroy') document.status = 'Destroy';

  const updatedDocument = await document.save({ validateBeforeSave: false });

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

  if (['outgoing', 'internal', 'archived'].includes(action)) {
    const documentQuery = {
      _id: id,
      status: { $ne: 'Deleted' },
      _tenantId: req.user._tenantId,
    };

    const document = await Document.findOne(documentQuery);

    if (!document) return next(new AppError('Document not found', 404));

    const taskQuery = {
      _documentId: id,
      status: { $ne: 'Deleted' },
      _tenantId: req.user._tenantId,
    };

    const task = await Task.findOne(taskQuery);

    if (task) {
      await Task.findByIdAndUpdate(
        task._id,
        {
          status: 'Completed',
        },
        {
          new: true,
          runValidators: true,
        }
      );
    }

    if (action === 'outgoing') document.status = 'Outgoing';
    else if (action === 'archiving') document.status = 'Archiving';
    else if (action === 'internal') document.status = 'Internal';
    const updatedDocument = await document.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      env: {
        document: updatedDocument,
      },
    });
  }
});

///// DOCUMENTS/FOLDER Controllers //////////////

exports.getMyDocAndFolders = catchAsync(async (req, res, next) => {
  // console.log(req.user._id)

  const initialQuery = {
    _createdBy: req.user._id,
    status: { $ne: 'Deleted' },
    _parentId: { $eq: null },
  };
  const folder = await Folder.find(initialQuery);
  const document = await Document.find(initialQuery);
  delete initialQuery._parentId;

  initialQuery['_folderId'] = { $eq: null };

  // console.log(document)

  // if (!document) return next(new AppError('Document not found', 404))
  // if (!document) return next(new AppError('Document not found', 404))

  return res.status(200).json({
    status: 'success',
    document,
    folder,
  });
});

exports.createFolder = catchAsync(async (req, res, next) => {
  const pickFields = ['name', '_parentId'];

  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;
  const folder = await Folder.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      folder,
    },
  });
});

exports.updateFolder = catchAsync(async (req, res, next) => {
  const pickFields = ['name', '_parentId'];
  const filteredBody = _.pick(req.body, pickFields);
  const { folderId } = req.params;

  const initialQuery = {
    _id: folderId,
    status: { $ne: 'Deleted' },
    _createdBy: req.user._id,
  };

  const folder = await Folder.findOne(initialQuery);
  if (!folder) return next(new AppError('Folder not found', 404));

  const updatedFolder = await Folder.findByIdAndUpdate(folderId, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    env: {
      updatedFolder,
    },
  });
});

exports.deleteFolder = catchAsync(async (req, res, next) => {
  const { folderId } = req.params;
  const initialQuery = {
    _id: folderId,
    status: { $ne: 'Deleted' },
    _createdBy: req.user._id,
  };

  const folder = await Folder.findOneAndUpdate(initialQuery, {
    status: 'Deleted',
  });

  if (!folder) return next(new AppError('Folder not found', 404));

  res.status(204).json({
    status: 'success',
  });
});

exports.getSubFolderAndDocs = catchAsync(async (req, res, next) => {
  const openedFolders = [];
  const initialQuery = {
    status: { $ne: 'Deleted' },
    _createdBy: req.user._id,
    _parentId: req.body.id,
  };

  let currentFolder = await Folder.findById(req.body.id);

  if (!currentFolder) return next(new AppError('Folder not found', 404));

  const folder = await Folder.find(initialQuery);

  delete initialQuery._parentId;

  initialQuery['_folderId'] = req.body.id;
  const document = await Document.find(initialQuery);

  openedFolders.push({
    id: currentFolder._id,
    name: currentFolder.name,
    folders: [],
    documents: [],
  });

  while (currentFolder._parentId) {
    currentFolder = await Folder.findById(currentFolder._parentId);

    if (currentFolder)
      openedFolders.unshift({
        id: currentFolder._id,
        name: currentFolder.name,
        folders: [],
        documents: [],
      });
  }

  res.status(200).json({
    status: 'success',
    folder,
    document,
    opened_folders: openedFolders,
  });
});
