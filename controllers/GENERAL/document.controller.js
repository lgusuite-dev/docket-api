const _ = require('lodash');

const Document = require('../../models/GENERAL/document.model');
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
  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);
  if (!document) return next(new AppError('Document not found', 404));

  const file = await File.create(filteredBody);

  document._files.push(file._id);

  const updatedDocument = await Document.findByIdAndUpdate(
    id,
    { _updatedBy: req.user._id, _files: document._files },
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
