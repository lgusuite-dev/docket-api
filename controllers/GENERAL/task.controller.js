const _ = require('lodash');
const axios = require('axios');

const Task = require('../../models/GENERAL/task.model');
const { sendMail } = require('../../utils/comms/email');
const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

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
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;
  filteredBody._updatedBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;

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
