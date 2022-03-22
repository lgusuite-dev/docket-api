const _ = require('lodash');

const Document = require('../../models/GENERAL/document.model');
const File = require('../../models/GENERAL/file.model');
const Task = require('../../models/GENERAL/task.model');
const ScannedDocument = require('../../models/GENERAL/scanned_document.model');

const ControlNumber = require('../../utils/control-number/controlNumber');
const { evaluateString } = require('../../utils/function');

const settings = require('../../mock/settings');

const audit = require('../../utils/audit/index.js');
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

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _tenantId: req.user._tenantId,
      _userId: req.user._id,
      type: 'Document',
      action: 'Create',
      requestBody: filteredBody,
    });
  }

  res.status(201).json({
    status: 'success',
    env: {
      document,
    },
  });
});

exports.generateDocuments = catchAsync(async (req, res, next) => {
  const { nDocuments } = req.body;

  const now = new Date();

  const month = now.toLocaleString('en-US', {
    month: 'numeric',
    timeZone: 'Asia/Singapore',
  });

  const year = now.toLocaleString('en-US', {
    year: 'numeric',
    timeZone: 'Asia/Singapore',
  });

  const from = new Date(year, month - 1, 1).toISOString();

  const initialQuery = {
    status: { $nin: ['Deleted', 'Reclassified'] },
    type: { $in: ['Incoming', 'Initial'] },
    _tenantId: req.user._tenantId,
    createdAt: {
      $gte: from,
    },
  };

  let totalDocuments = await Document.find(initialQuery).count();
  const dateReceived = new Date();

  const newDocuments = [];
  for (let i = 1; i <= nDocuments; i++) {
    totalDocuments++;
    const seq1 = totalDocuments.toString().padStart(3, '0');
    const mm = month.toString().padStart(2, '0');
    const yy = year.toString().substring(2);

    newDocuments.push({
      controlNumber: `R-${seq1}-${mm}${yy}`,
      type: 'Initial',
      dateReceived,
      _tenantId: req.user._tenantId,
      _createdBy: req.user._id,
    });
  }

  const documents = await Document.insertMany(newDocuments, {
    new: true,
  });

  res.status(200).json({
    status: 'Success',
    env: {
      documents,
    },
  });
});

exports.getAllDocuments = catchAsync(async (req, res, next) => {
  const initialQuery = {
    status: { $nin: ['Deleted', 'Reclassified'] },
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
      })
      .populate({
        path: '_files',
        populate: {
          path: '_currentVersionId',
          select: 'name status dropbox description versionNumber createdAt',
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
    status: { $nin: ['Deleted', 'Reclassified'] },
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(
    Document.findOne(initialQuery).populate({ path: '_files' }),
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
    status: { $nin: ['Deleted', 'Reclassified'] },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);
  if (!document) return next(new AppError('Document not found', 404));

  const fileQuery = {
    _documentId: id,
    _id: { $in: document._files },
    status: { $ne: 'Deleted' },
  };

  const fileQueryFeature = new QueryFeatures(
    File.find(fileQuery).populate({
      path: '_versions _currentVersionId',
      select: 'name status dropbox description versionNumber createdAt',
    }),
    req.query
  )
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nFileQueryFeature = new QueryFeatures(
    File.find(fileQuery).populate({
      path: '_versions _currentVersionId',
      select: 'name status dropbox description versionNumber createdAt',
    }),
    req.query
  )
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
    'type',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  filteredBody._updatedBy = req.user._id;
  const initialQuery = {
    _id: id,
    status: { $nin: ['Deleted', 'Reclassified'] },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);
  if (!document) return next(new AppError('Document not found', 404));

  if (filteredBody.type === 'Incoming' && document.status === 'Incoming') {
    return next(
      new AppError(
        `Document ${document.controlNumber} was already taken, Please select another document`,
        404
      )
    );
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
        _documentId: id,
        _tenantId: req.user._tenantId,
        status: { $nin: ['Deleted', 'Reclassified'] },
      },
      data: { dateReceived: filteredBody.dateReceived },
    },
  ];

  if (filteredBody.dateReceived) await updateSideEffects(updateArgs);

  if (!_.isEmpty(filteredBody)) {
    filteredBody.documentId = id;
    await audit.createAudit({
      _tenantId: req.user._tenantId,
      _userId: req.user._id,
      type: 'Document',
      action: 'Update',
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
  filteredBody.versionNumber = 'Version 1';

  const initialQuery = {
    _id: id,
    status: { $nin: ['Deleted', 'Reclassified'] },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);
  if (!document) return next(new AppError('Document not found', 404));

  const file = await File.create(filteredBody);

  document._files.push(file._id);
  document.fileLength = document._files.length;
  document._updatedBy = req.user._id;
  document.ocrStatus = 'No';

  if (['Outgoing', 'Archived', 'Internal'].includes(document.type))
    document.process.uploaded = true;

  await document.save({ validateBeforeSave: false });

  if (!_.isEmpty(filteredBody)) {
    filteredBody.documentId = id;

    await audit.createAudit({
      _tenantId: req.user._tenantId,
      _userId: req.user._id,
      type: 'Document',
      action: 'Upload File',
      requestBody: filteredBody,
    });
  }

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
    status: { $nin: ['Deleted', 'Reclassified'] },
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
          status: { $nin: ['Deleted', 'Reclassified'] },
          _tenantId: req.user._tenantId,
        },
        data: { ocrStatus: 'No' },
      },
      {
        Model: ScannedDocument,
        query: {
          _fileId: file._id,
          status: { $nin: ['Deleted', 'Reclassified'] },
          _tenantId: req.user._tenantId,
        },
        data: { status: 'Deleted' },
      },
    ];

    await updateSideEffects(updateArgs);
  }

  if (!_.isEmpty(filteredBody)) {
    filteredBody.documentId = _documentId;
    filteredBody.fileId = id;
    await audit.createAudit({
      _tenantId: req.user._tenantId,
      _userId: req.user._id,
      type: 'Document',
      action: 'Update uploaded file',
      requestBody: filteredBody,
    });
  }

  res.status(200).json({
    status: 'success',
    env: {
      file: updatedFile,
    },
  });
});

exports.declassifyDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const initialQuery = {
    _id: id,
    status: { $nin: ['Deleted', 'Reclassified'] },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);

  if (!document) return next(new AppError('Document not found', 404));

  const newDoc = _.omit(document._doc, ['_id', 'status']);
  const duplicateDocument = await Document.create({
    ...newDoc,
    status: 'Reclassified',
  });

  const controlNumberArr = document.controlNumber.split('-');

  const fieldBased1 = controlNumberArr[0];
  const seq1 = controlNumberArr[1];
  const monthYr = controlNumberArr[2];

  document.controlNumber = `${fieldBased1}-${seq1}-${monthYr}`;

  document.dateClassified = undefined;
  document.classification = undefined;
  document.subClassification = undefined;
  document.remarks = undefined;

  await document.save({ validateBeforeSave: false });

  // UPDATE SIDE EFFECTS
  const updateArgs = [
    {
      Model: ScannedDocument,
      query: {
        _documentId: document._id,
        status: { $nin: ['Deleted', 'Reclassified'] },
        _tenantId: req.user._tenantId,
      },
      data: {
        dateClassified: undefined,
        classification: undefined,
        subClassification: undefined,
        subClassification: undefined,
        remarks: undefined,
        controlNumber: `${fieldBased1}-${seq1}-${monthYr}`,
      },
    },
  ];

  await updateSideEffects(updateArgs);

  await audit.createAudit({
    _tenantId: req.user._tenantId,
    _userId: req.user._id,
    type: 'Document',
    action: 'Declassify',
    requestBody: {
      documentId: id,
    },
  });

  res.status(200).json({
    status: 'success',
    env: {
      document: duplicateDocument,
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
    status: { $nin: ['Deleted', 'Reclassified'] },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(initialQuery);

  if (!document) return next(new AppError('Document not found', 404));

  const now = new Date();

  const month = now.toLocaleString('en-US', {
    month: 'numeric',
    timeZone: 'Asia/Singapore',
  });

  const year = now.toLocaleString('en-US', {
    year: 'numeric',
    timeZone: 'Asia/Singapore',
  });

  const classificationQuery = {
    status: { $ne: 'Deleted' },
    type: document.type,
    classification: filteredBody.classification,
    createdAt: {
      $gte: new Date(year, 0, 1).toISOString(),
    },
    _tenantId: req.user._tenantId,
  };

  const classifiedDocument = await Document.find(classificationQuery).count();
  const seq2 = (classifiedDocument + 1).toString().padStart(3, '0');

  let fieldBased2 = '';
  for (const logic of settings.CLASSIFICATION_LOGIC) {
    if (evaluateString(logic.if, filteredBody)) {
      fieldBased2 = logic.then;
      break;
    }
  }

  if (document.type === 'Incoming') {
    const controlNumber = `${document.controlNumber}-${seq2}-${fieldBased2}`;

    filteredBody.controlNumber = controlNumber;

    res.status(200).json({
      status: 'success',
      env: {
        document: filteredBody,
      },
    });
  } else {
    const initialQuery = {
      status: { $ne: 'Deleted' },
      type: document.type,
      _tenantId: req.user._tenantId,
      createdAt: {
        $gte: from,
      },
    };

    let totalDocuments = await Document.find(initialQuery).count();

    let fieldBased1 = '';
    for (const logic of settings.CLASSIFICATION_LOGIC) {
      if (evaluateString(logic.if, { type: document.type })) {
        fieldBased1 = logic.then;
        break;
      }
    }

    const seq1 = (totalDocuments + 1).toString().padStart(3, '0');
    const mm = month.toString().padStart(2, '0');
    const yy = year.toString().substring(2);

    filteredBody.controlNumber = `${fieldBased1}-${seq1}-${mm}${yy}-${seq2}-${fieldBased2}`;
  }

  filteredBody.dateClassified = new Date();

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
        status: { $nin: ['Deleted', 'Reclassified'] },
        _tenantId: req.user._tenantId,
      },
      data: filteredBody,
    },
  ];

  await updateSideEffects(updateArgs);

  if (!_.isEmpty(filteredBody)) {
    filteredBody.documentId = id;
    await audit.createAudit({
      _tenantId: req.user._tenantId,
      _userId: req.user._id,
      type: 'Document',
      action: 'Classify',
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

exports.acknowledgeDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const pickFields = ['dateConfirmed'];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._updatedBy = req.user._id;
  const initialQuery = {
    _id: id,
    status: { $nin: ['Deleted', 'Reclassified'] },
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
        status: { $nin: ['Deleted', 'Reclassified'] },
        _tenantId: req.user._tenantId,
      },
      data: filteredBody,
    },
  ];

  await updateSideEffects(updateArgs);

  if (!_.isEmpty(filteredBody)) {
    filteredBody.documentId = id;
    await audit.createAudit({
      _tenantId: req.user._tenantId,
      _userId: req.user._id,
      type: 'Document',
      action: 'Acknowledge',
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

// - CLEANUP
exports.deleteDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $nin: ['Deleted', 'Reclassified'] },
    _tenantId: req.user._tenantId,
  };

  let document = await Document.findOne(initialQuery);

  if (!document) return next(new AppError('Document not found', 404));

  if (document._assignedTo)
    return next(
      new AppError('Cannot delete documents with task assigned to it', 404)
    );

  if (document.classification)
    return next(new AppError('Cannot delete classified document', 404));

  const controlNumberArr = document.controlNumber.split('-');
  const fieldBased1 = controlNumberArr[0];
  const seq1 = controlNumberArr[1];
  const monthYr = controlNumberArr[2];

  const defaultFields = {
    subject: undefined,
    requestDate: undefined,
    sender: {},
    senderType: undefined,
    receivedThru: undefined,
    fileLength: 0,
    _files: [],
    type: 'Initial',
    recipients: [],
    controlNumber: `${fieldBased1}-${seq1}-${monthYr}`,
  };

  for (const [key, value] of Object.entries(defaultFields)) {
    document[key] = value;
  }

  console.log(document);
  await document.save();

  // UPDATE SIDE EFFECTS
  const updateArgs = [
    {
      Model: ScannedDocument,
      query: {
        _documentId: document._id,
        status: { $nin: ['Deleted', 'Reclassified'] },
        _tenantId: req.user._tenantId,
      },
      data: { ...defaultFields, type: 'Initial' },
    },
  ];

  await updateSideEffects(updateArgs);

  // DO SOME DOCUMENT ID CLEANUP HERE using referenceIdCleanup util

  await audit.createAudit({
    _userId: req.user._id,
    _tenantId: req.user._tenantId,
    type: 'Document',
    action: 'Delete',
    requestBody: { documentId: id },
  });

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
    status: { $nin: ['Deleted', 'Reclassified'] },
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
        _documentId: document._id,
        status: { $nin: ['Deleted', 'Reclassified'] },
        _tenantId: req.user._tenantId,
      },
      data: filteredBody,
    },
  ];

  await updateSideEffects(updateArgs);

  if (!_.isEmpty(filteredBody)) {
    filteredBody.documentId = id;
    await audit.createAudit({
      _userId: req.user._id,
      _tenantId: req.user._tenantId,
      type: 'Document',
      action: 'Update for Final Action',
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

// UPDATE OCR DOCUMENT
exports.releaseDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const pickFields = ['recipients', 'dateReleased'];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._updatedBy = req.user._id;
  const initialQuery = {
    _id: id,
    status: { $nin: ['Deleted', 'Reclassified'] },
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
        status: { $nin: ['Deleted', 'Reclassified'] },
        _tenantId: req.user._tenantId,
      },
      data: filteredBody,
    },
  ];

  await updateSideEffects(updateArgs);

  if (!_.isEmpty(filteredBody)) {
    filteredBody.documentId = id;

    await audit.createAudit({
      _userId: req.user._id,
      _tenantId: req.user._tenantId,
      type: 'Document',
      action: 'Release',
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

// UPDATE OCR DOCUMENT
exports.documentAssignation = catchAsync(async (req, res, next) => {
  const pickFields = [
    '_includes',
    '_excludes',
    'confidentialityLevel',
    '_assignedTo',
    '_fromTaskId',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;

  if (!filteredBody._assignedTo) {
    delete filteredBody._assignedTo;
    filteredBody['isAssigned'] = false;
  } else {
    filteredBody['isAssigned'] = true;
  }

  if (!filteredBody._fromTaskId) delete filteredBody._fromTaskId;

  const initialQuery = {
    _id: id,
    status: { $nin: ['Deleted', 'Reclassified'] },
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
        _documentId: document._id,
        status: { $nin: ['Deleted', 'Reclassified'] },
        _tenantId: req.user._tenantId,
      },
      data: filteredBody,
    },
  ];

  await updateSideEffects(updateArgs);

  if (!_.isEmpty(filteredBody)) {
    filteredBody.documentId = id;
    await audit.createAudit({
      _tenantId: req.user._tenantId,
      _userId: req.user._id,
      type: 'Document',
      action: 'Assign',
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
      _id: row,
      status: { $nin: ['Deleted', 'Reclassified'] },
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

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: req.user._id,
      _tenantId: req.user._tenantId,
      type: 'Document',
      action: 'Update Process',
      requestBody: filteredBody,
    });
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
    status: { $nin: ['Deleted', 'Reclassified'] },
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
        status: { $nin: ['Deleted', 'Reclassified'] },
        _tenantId: req.user._tenantId,
      },
      data: { type: document.type },
    },
  ];

  await updateSideEffects(updateArgs);

  if (!_.isEmpty(filteredBody)) {
    filteredBody.documentId = id;
    await audit.createAudit({
      _userId: req.user._id,
      _tenantId: req.user._tenantId,
      type: 'Document',
      action: 'Update Type',
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

  await audit.createAudit({
    _userId: req.user._id,
    _tenantId: req.user._tenantId,
    type: 'Document',
    action: 'Update Status',
    requestBody: { status: action, documentId: id },
  });

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
      _id: row,
      status: { $nin: ['Deleted', 'Reclassified'] },
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

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: req.user._id,
      _tenantId: req.user._tenantId,
      type: 'Document',
      action: 'Update Storage',
      requestBody: filteredBody,
    });
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
  console.log(ids);

  const files = await File.find({
    _id: { $in: ids },
  });
  for (let file of files) {
    // console.log(file);
    let tasks = await Task.find({
      _documentId: file._documentId,
    })
      .populate('_createdBy', 'firstName lastName')
      .populate('_assigneeId', 'firstName lastName');
    if (tasks.length)
      for (let t of tasks) {
        route.push({ file, task: t });
      }
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
    status: { $nin: ['Deleted', 'Reclassified'] },
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

  await audit.createAudit({
    _userId: req.user._id,
    _tenantId: req.user._tenantId,
    type: 'Document',
    action: 'Update Assigned Status',
    requestBody: { documentId: id },
  });

  res.status(200).json({
    status: 'success',
    env: {
      updatedDocument,
    },
  });
});

exports.migrateDocuments = catchAsync(async (req, res, next) => {
  const pickFields = ['documents'];
  const filteredBody = _.pick(req.body, pickFields);
  const { documents } = filteredBody;

  const insertedDocuments = await Document.insertMany(documents, {
    ordered: false,
  });

  res.status(200).json({
    status: 'success',
  });
});
