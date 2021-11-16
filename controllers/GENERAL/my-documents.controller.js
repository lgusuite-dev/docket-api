const _ = require('lodash');
const ObjectId = require('mongoose').Types.ObjectId;

const Document = require('../../models/GENERAL/document.model');
const Folder = require('../../models/GENERAL/folder.model');
const File = require('../../models/GENERAL/file.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.getRoot = catchAsync(async (req, res, next) => {
  const initialQuery = {
    _createdBy: req.user._id,
    status: { $ne: 'Deleted' },
    _parentId: { $eq: null },
  };

  const folder = await Folder.find(initialQuery);

  delete initialQuery._parentId;
  initialQuery['_folderId'] = { $eq: null };

  const document = await Document.find(initialQuery);

  return res.status(200).json({
    status: 'success',
    env: {
      document,
      folder,
    },
  });
});

exports.getFoldersAndDocs = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const openedFolders = [];
  const initialQuery = {
    status: { $ne: 'Deleted' },
    _createdBy: req.user._id,
    _parentId: id,
  };

  let currentFolder = await Folder.findById(id);

  if (!currentFolder) return next(new AppError('Folder not found', 404));

  const folder = await Folder.find(initialQuery);

  delete initialQuery._parentId;
  initialQuery['_folderId'] = id;

  const document = await Document.find(initialQuery).populate({
    path: '_files',
    select: '-name -dropbox',
    populate: {
      path: '_versions _currentVersionId',
      select: 'name status dropbox description versionNumber createdAt',
    },
  });

  openedFolders.push({
    id: currentFolder._id,
    name: currentFolder.name,
    folders: folder,
    documents: [],
  });

  if (req.query.reload) {
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
  }

  res.status(200).json({
    status: 'success',
    env: {
      folder,
      document,
      opened_folders: openedFolders,
    },
  });
});

exports.deleteFolder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
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
  const { id } = req.params;

  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _createdBy: req.user._id,
  };

  const folder = await Folder.findOne(initialQuery);
  if (!folder) return next(new AppError('Folder not found', 404));

  const updatedFolder = await Folder.findByIdAndUpdate(id, filteredBody, {
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

/* DOCUMENTS */
exports.createDocument = catchAsync(async (req, res, next) => {
  let newDocument;
  const { id } = req.params;
  const filteredBody = _.pick(req.body, ['subject']);

  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;
  filteredBody.status = 'My Documents';
  filteredBody.isMyDocuments = true;

  if (id === 'root') newDocument = await Document.create(filteredBody);
  else {
    if (!ObjectId.isValid(id))
      return next(new AppError('Invalid folder id', 400));

    const folder = await Folder.findById(id);

    if (!folder) return next(new AppError('Folder not found', 404));

    filteredBody._folderId = folder._id;

    newDocument = await Document.create(filteredBody);
  }

  res.status(201).json({
    status: 'success',
    env: {
      document: newDocument,
    },
  });
});

exports.updateDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const pickFields = ['subject', '_includes', '_exludes', '_files'];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._updatedBy = req.user._id;

  const query = {
    _id: id,
    status: { $ne: 'Deleted' },
    isMyDocuments: true,
    _createdBy: req.user._id,
  };

  const updatedDocument = await Document.findOneAndUpdate(query, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!updatedDocument) return next(new AppError('Document not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      document: updatedDocument,
    },
  });
});

exports.deleteDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const query = {
    _id: id,
    status: { $ne: 'Deleted' },
    isMyDocuments: true,
    _createdBy: req.user._id,
  };

  const updatedDocument = await Document.findOneAndUpdate(
    query,
    { status: 'Deleted' },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedDocument) return next(new AppError('Document not found', 404));

  res.status(204).json({
    status: 'success',
  });
});

/* FILES */
exports.uploadFile = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const pickFields = ['name', 'description', 'dropbox'];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._documentId = id;
  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;
  filteredBody.versionNumber = 'Version 1';

  const query = {
    _id: id,
    status: { $ne: 'Deleted' },
    isMyDocuments: true,
    _createdBy: req.user._id,
  };

  const document = await Document.findOne(query);
  if (!document) return next(new AppError('Document not found', 404));

  const newFile = await File.create(filteredBody);

  document._files.push(newFile._id);
  document.fileLength = document._files.length;
  document._updatedBy = req.user._id;

  await document.save();

  res.status(200).json({
    status: 'success',
    env: {
      file: newFile,
      document,
    },
  });
});

exports.updateFile = catchAsync(async (req, res, next) => {
  let fileVersion;
  const { id } = req.params;
  const pickFields = ['name', 'description', 'dropbox'];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._documentId = id;
  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;

  const query = {
    _id: id,
    status: { $ne: 'Deleted' },
    isMyDocuments: true,
    _createdBy: req.user._id,
  };

  const file = await File.findOne(query);
  if (!file) return next(new AppError('File not found', 404));

  if (file._id.toString() === file._currentVersionId.toString())
    file._versions.push(file._id);

  const newFileVersionData = { ...file._doc, ...filteredBody };
  delete newFileVersionData._id;

  if (!file.versionNumber) newFileVersionData.versionNumber = 'Version 1';
  else {
    const parentFile = await file.populate('_currentVersionId');

    fileVersion =
      +parentFile._currentVersionId.versionNumber.split('Version ')[1];

    newFileVersionData.versionNumber = `Version ${++fileVersion}`;
  }

  newFileVersionData._parentVersionId = file._id;
  newFileVersionData._versions = [];

  const newFileVersion = await File.create(newFileVersionData);

  file._currentVersionId = newFileVersion._id;
  file._versions.unshift(newFileVersion._id);
  file.versionsLength = file._versions.length;

  await file.save();

  res.status(200).json({
    status: 'success',
    env: {
      file,
      new_version: newFileVersion,
    },
  });
});
