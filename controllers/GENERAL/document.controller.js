const _ = require('lodash');

const Document = require('../../models/GENERAL/document.model');
const Folder = require('../../models/GENERAL/folder.model');
const File = require('../../models/GENERAL/file.model');

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

///// DOCUMENTS/FOLDER Controllers //////////////

exports.getMyDocAndFolders = catchAsync(async (req, res, next) => {
  // console.log(req.user._id)

  const initialQuery = {
    _createdBy: req.user._id,
    status: { $ne: 'Deleted' },
    _parentId: { $eq: null },
  };
  const document = await Document.find(initialQuery);
  delete initialQuery._parentId;
  initialQuery._folderId = { $eq: null };
  const folder = await Folder.find(initialQuery);
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

exports.deleteFolder = catchAsync(async (req, res, next) => {});

exports.updateFolder = catchAsync(async (req, res, next) => {});
