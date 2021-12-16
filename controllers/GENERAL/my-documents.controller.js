const _ = require('lodash');
const ObjectId = require('mongoose').Types.ObjectId;

const Document = require('../../models/GENERAL/document.model');
const Folder = require('../../models/GENERAL/folder.model');
const File = require('../../models/GENERAL/file.model');
const audit = require('../../utils/audit/index.js');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const { callbackAsync } = require('../../utils/function');

const referenceIdCleanup = async (ModelAndProps, docId) => {
  for (let MP of ModelAndProps) {
    const documents = await MP.model.find(MP.query);

    if (documents.length) {
      for (let document of documents) {
        const _arrRefField = [...document[MP._refField]];

        if (Array.isArray(_arrRefField) && _arrRefField.length) {
          document[MP._refField] = _arrRefField.filter(
            (id) => id.toString() !== docId.toString()
          );

          await document.save();
        }
      }
    }

    if (MP.callback) await callbackAsync(MP.callback, ...MP.callbackArgs);
  }
};

exports.getSharedToMe = catchAsync(async (req, res, next) => {
  const initialQuery = {
    type: { $ne: 'Incoming' },
    status: { $ne: 'Deleted' },
    _sharedTo: req.user._id,
  };
  // console.log(req.user._id);
  const sharedFolders = await Folder.find(initialQuery).populate({
    path: '_sharedTo',
  });

  const sharedDocuments = await Document.find(initialQuery).populate([
    {
      path: '_files',
      select: '-name -dropbox',
      populate: {
        path: '_versions _currentVersionId',
        select: 'name status dropbox description versionNumber createdAt',
      },
    },
    {
      path: '_sharedTo',
    },
  ]);

  res.status(200).json({
    status: 'success',
    env: {
      sharedFolders,
      sharedDocuments,
    },
  });
});

exports.updateShareFolder = catchAsync(async (req, res, next) => {
  const pickFields = ['_sharedTo'];
  const filteredBody = _.pick(req.body, pickFields);

  const { id } = req.params;

  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
  };
  const folder = await Folder.findOne(initialQuery);
  // console.log(folder._sharedTo);
  if (!folder) return next(new AppError('Folder not found', 404));
  sharedIds = folder._sharedTo.map((el) => el.toString());

  if (!sharedIds.includes(req.user._id.toString())) {
    return next(new AppError('You do not have access', 400));
  }
  const updatedFolder = await Folder.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: req.user._id,
      type: 'Folder',
      action: 'Update Shared User/s',
      requestBody: filteredBody,
    });
  }

  res.status(200).json({
    status: 'success',
    env: {
      updatedFolder,
    },
  });
});
exports.updateShareDocument = catchAsync(async (req, res, next) => {
  const pickFields = ['_sharedTo'];
  const filteredBody = _.pick(req.body, pickFields);

  const { id } = req.params;

  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
  };
  const document = await Document.findOne(initialQuery);
  // console.log(document._sharedTo);
  if (!document) return next(new AppError('Document not found', 404));
  sharedIds = document._sharedTo.map((el) => el.toString());

  if (!sharedIds.includes(req.user._id.toString())) {
    return next(new AppError('You do not have access', 400));
  }
  const updatedDocument = await Document.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: req.user._id,
      type: 'Document',
      action: 'Update Shared User/s',
      requestBody: filteredBody,
    });
  }

  res.status(200).json({
    status: 'success',
    env: {
      updatedDocument,
    },
  });
});

exports.getRoot = catchAsync(async (req, res, next) => {
  const initialQuery = {
    type: { $ne: 'Incoming' },
    _createdBy: req.user._id,
    status: { $ne: 'Deleted' },
    _parentId: { $eq: null },
  };

  const folder = await Folder.find(initialQuery).populate({
    path: '_sharedTo',
  });

  delete initialQuery._parentId;
  initialQuery['_folderId'] = { $eq: null };

  const document = await Document.find(initialQuery).populate([
    {
      path: '_files',
      select: '-name -dropbox',
      populate: {
        path: '_versions _currentVersionId',
        select: 'name status dropbox description versionNumber createdAt',
      },
    },
    {
      path: '_sharedTo',
    },
  ]);

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
    type: { $ne: 'Incoming' },
    status: { $ne: 'Deleted' },
    // _createdBy: req.user._id,
    _parentId: id,
  };

  let currentFolder = await Folder.findOne({
    _id: id,
    status: { $ne: 'Deleted' },
  });

  if (!currentFolder) return next(new AppError('Folder not found', 404));

  let sharedUsers = currentFolder._sharedTo.map((el) => el.toString());

  // console.log(currentFolder._createdBy, req.user._id, sharedUsers);
  if (
    currentFolder._createdBy.toString() !== req.user._id.toString() &&
    !sharedUsers.includes(req.user._id.toString())
  ) {
    return next(new AppError('You do have not access', 401));
  }

  const folder = await Folder.find(initialQuery).populate({
    path: '_sharedTo',
  });

  delete initialQuery._parentId;
  initialQuery['_folderId'] = id;

  const document = await Document.find(initialQuery).populate([
    {
      path: '_files',
      select: '-name -dropbox',
      populate: {
        path: '_versions _currentVersionId',
        select: 'name status dropbox description versionNumber createdAt',
      },
    },
    {
      path: '_sharedTo',
    },
  ]);

  openedFolders.push({
    id: currentFolder._id,
    name: currentFolder.name,
    folders: folder,
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

  await audit.createAudit({
    _userId: req.user._id,
    type: 'Folder',
    action: 'Delete',
    requestBody: { folderId: id },
  });

  res.status(204).json({
    status: 'success',
  });
});

exports.createFolder = catchAsync(async (req, res, next) => {
  const pickFields = ['name', '_parentId'];

  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;
  const folder = await Folder.create(filteredBody);

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: req.user._id,
      type: 'Folder',
      action: 'Create',
      requestBody: filteredBody,
    });
  }

  res.status(201).json({
    status: 'success',
    env: {
      folder,
    },
  });
});

exports.updateFolder = catchAsync(async (req, res, next) => {
  const pickFields = ['name', '_parentId', '_sharedTo'];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;

  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    // _createdBy: req.user._id,
  };

  const folder = await Folder.findOne(initialQuery);
  if (!folder) return next(new AppError('Folder not found', 404));
  if (folder._createdBy.toString() != req.user._id.toString())
    return next(new AppError('You do not have access', 400));

  const updatedFolder = await Folder.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: req.user._id,
      type: 'Folder',
      action: 'Update',
      requestBody: filteredBody,
    });
  }

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
  filteredBody.type = 'Not Defined';

  if (id === 'root') newDocument = await Document.create(filteredBody);
  else {
    if (!ObjectId.isValid(id))
      return next(new AppError('Invalid folder id', 400));

    const folder = await Folder.findById(id);

    if (!folder) return next(new AppError('Folder not found', 404));

    filteredBody._folderId = folder._id;

    newDocument = await Document.create(filteredBody);
  }

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: req.user._id,
      type: 'Document',
      action: 'Create',
      requestBody: filteredBody,
    });
  }

  res.status(201).json({
    status: 'success',
    env: {
      document: newDocument,
    },
  });
});

exports.getDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const query = {
    _id: id,
    status: { $ne: 'Deleted' },
    // _createdBy: req.user._id,
  };

  const document = await Document.findOne(query).populate({
    path: '_files',
    select: '-name -dropbox',
    populate: {
      path: '_versions _currentVersionId',
      select: 'name status dropbox description versionNumber createdAt',
    },
  });

  if (!document) return next(new AppError('Document not Found', 404));
  const sharedUsers = document._sharedTo.map((el) => el.toString());

  if (
    document._createdBy.toString() !== req.user._id.toString() &&
    !sharedUsers.includes(req.user._id.toString())
  ) {
    return next(new AppError('You do have not access', 401));
  }

  res.status(200).json({
    status: 'success',
    env: {
      document,
    },
  });
});

exports.updateDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const pickFields = [
    'subject',
    '_includes',
    '_exludes',
    '_files',
    '_sharedTo',
  ];
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

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: req.user._id,
      type: 'Document',
      action: 'Update',
      requestBody: filteredBody,
    });
  }

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

  await audit.createAudit({
    _userId: req.user._id,
    type: 'Document',
    action: 'Delete',
    requestBody: { docId: id },
  });

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
  filteredBody.fromMyDocuments = true;

  const query = {
    _id: id,
    status: { $ne: 'Deleted' },
    _createdBy: req.user._id,
  };

  const document = await Document.findOne(query);
  if (!document) return next(new AppError('Document not found', 404));

  const newFile = await File.create(filteredBody);

  document._files.push(newFile._id);
  document.fileLength = document._files.length;
  document._updatedBy = req.user._id;

  await document.save();

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: req.user._id,
      type: 'Document',
      action: 'Upload File',
      requestBody: filteredBody,
    });
  }

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
    _createdBy: req.user._id,
  };

  const file = await File.findOne(query);
  if (!file) return next(new AppError('File not found', 404));

  if (file._id.toString() === file._currentVersionId.toString())
    file._versions.push(file._id);

  const newFileVersionData = { ...file._doc, ...filteredBody };
  delete newFileVersionData._id;
  delete newFileVersionData.createdAt;
  delete newFileVersionData.updatedAt;

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

  if (filteredBody.name) file.name = filteredBody.name;
  if (filteredBody.description) file.description = filteredBody.description;

  file._currentVersionId = newFileVersion._id;
  file._versions.unshift(newFileVersion._id);
  file.versionsLength = file._versions.length;
  file.versionNumber = newFileVersionData.versionNumber;

  await file.save();

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: req.user._id,
      type: 'File',
      action: 'Update',
      requestBody: filteredBody,
    });
  }

  res.status(200).json({
    status: 'success',
    env: {
      file,
      new_version: newFileVersion,
    },
  });
});

exports.deleteFile = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const file = await File.findOneAndUpdate(
    { _id: id, status: { $ne: 'Deleted' } },
    { status: 'Deleted' },
    { new: true, runValidators: true }
  );

  if (!file) return next(new AppError('File not Found', 404));

  const cleanupCallback = async (_id) => {
    const file = await File.findById(_id);

    if (
      file._versions.length &&
      file._currentVersionId.toString() !== file._versions[0].toString()
    ) {
      file._currentVersionId = file._versions[0];
      await file.save();
    }

    if (file && !file._versions.length) {
      const modelQueryArgs = [
        {
          model: Document,
          query: { _files: { $in: [_id] } },
          _refField: '_files',
          callbackArgs: [file._documentId, file._id],
          callback: async (docId, fileId) => {
            const document = await Document.findById(docId);
            const _documentFiles = [...document._files];

            document._files = _documentFiles.filter(
              (id) => id.toString() !== fileId.toString()
            );

            await document.save();
          },
        },
      ];

      await referenceIdCleanup(modelQueryArgs, id);
    }
  };

  const _id = file._parentVersionId ? file._parentVersionId : file._id;
  const cleanupFileQuery = { _versions: { $in: [id] } };
  const modelQueryArgs = [
    {
      model: File,
      query: cleanupFileQuery,
      _refField: '_versions',
      callback: cleanupCallback,
      callbackArgs: [_id],
    },
  ];

  await referenceIdCleanup(modelQueryArgs, id);

  await audit.createAudit({
    _userId: req.user._id,
    type: 'File',
    action: 'Delete ',
    requestBody: { fileId: id },
  });

  res.status(204).json({
    status: 'success',
  });
});
