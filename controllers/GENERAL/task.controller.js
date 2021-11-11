const _ = require('lodash');

const Task = require('../../models/GENERAL/task.model');
const Document = require('../../models/GENERAL/document.model');
const { sendMail } = require('../../utils/comms/email');
const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');
var ObjectId = require('mongoose').Types.ObjectId;

exports.createTask = catchAsync(async (req, res, next) => {
  const pickFields = [
    'name',
    'dueDate',
    'description',
    'workflow',
    'instruction',
    'remarks',
    '_assigneeId',
    '_documentId',
  ];
  let filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;
  filteredBody._updatedBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;

  if (filteredBody._documentId && !ObjectId.isValid(filteredBody._documentId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Document reference id is not valid.',
    });
  } else if (filteredBody._documentId) {
    const document = await Document.findById(filteredBody._documentId);

    if (!document)
      return res.status(404).json({
        status: 'error',
        error: {
          message: 'Document reference id not found.',
        },
      });
  } else {
    delete filteredBody._documentId;
  }

  const task = await Task.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      task,
    },
  });
});

exports.getTasks = catchAsync(async (req, res, next) => {});

exports.updateTask = catchAsync(async (req, res, next) => {});

exports.deleteTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const task = await Task.findOneAndUpdate(initialQuery, { status: 'Deleted' });

  if (!task) return next(new AppError('Task not found', 404));

  res.status(204).json({
    status: 'success',
  });
});

exports.patchTask = catchAsync(async (req, res, next) => {});
