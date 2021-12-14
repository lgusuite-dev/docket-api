const _ = require('lodash');

const Task = require('../../models/GENERAL/task.model');
const Document = require('../../models/GENERAL/document.model');
const { sendMail } = require('../../utils/comms/email');
const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');
var ObjectId = require('mongoose').Types.ObjectId;

exports.createTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;

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
      return next(new AppError(`Document reference id not found.`, 404));
  } else {
    delete filteredBody._documentId;
  }

  if (id) {
    prevTask = await Task.findById(id);
    if (!prevTask) return next(new AppError(`Main Task Id not found.`, 404));
    filteredBody['_previousTaskId'] = id;
    filteredBody['_mainTaskId'] = prevTask._mainTaskId || id;
  }

  const task = await Task.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      task,
    },
  });
});

exports.replyToTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let pickFields = ['message', '_documentId', 'status'];

  const task = await Task.findById(id);

  if (task.status != 'Pending')
    return next(
      new AppError(
        `Unable to reply to this task. (Current Status: ${task.status})`,
        404
      )
    );

  if (req.body.status === 'Completed') {
    pickFields = ['message', '_documentId', 'status'];
  } else if (req.body.status === 'Declined') {
    pickFields = ['message', 'status'];
  } else if (req.body.status === 'For Approval') {
    pickFields = ['message', '_documentId', 'status'];
  } else {
    return next(new AppError('Action is not valid!'));
  }

  let filteredBody = _.pick(req.body, pickFields);

  // check if required fields are not empty

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
    filteredBody._documentId = '';
    delete filteredBody._documentId;
  }

  task._updatedBy = req.user._id;
  task.status = filteredBody.status;
  task.reply = {
    message: filteredBody.message,
  };

  if (filteredBody._documentId) {
    task.reply['_documentId'] = filteredBody._documentId;
  }

  await task.save();

  res.status(201).json({
    status: 'success',
  });
});

exports.getTasks = catchAsync(async (req, res, next) => {
  const initialQuery = {
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(Task.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nQueryFeature = new QueryFeatures(Task.find(initialQuery), req.query)
    .filter()
    .count();

  const tasks = await queryFeatures.query;
  const ntasks = await nQueryFeature.query;

  res.status(200).json({
    status: 'success',
    total_docs: ntasks,
    env: {
      tasks,
    },
  });
});

exports.getForApprovalTasks = catchAsync(async (req, res, next) => {
  const initialQuery = {
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(
    Task.find(initialQuery).populate({
      path: 'reply._documentId',
      populate: [{ path: '_files', model: 'File' }],
    }),
    req.query
  )
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nQueryFeature = new QueryFeatures(
    Task.find(initialQuery).populate({
      path: 'reply._documentId',
      populate: [{ path: '_files', model: 'File' }],
    }),
    req.query
  )
    .filter()
    .count();

  const tasks = await queryFeatures.query;

  const ntasks = await nQueryFeature.query;

  res.status(200).json({
    status: 'success',
    total_docs: ntasks,
    env: {
      tasks,
    },
  });
});

exports.getTasksAssignedToMe = catchAsync(async (req, res, next) => {
  const initialQuery = {
    status: { $ne: 'Deleted' },
    _assigneeId: req.user._id,
  };

  const queryFeatures = new QueryFeatures(Task.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nQueryFeature = new QueryFeatures(Task.find(initialQuery), req.query)
    .filter()
    .count();

  const tasks = await queryFeatures.query;
  const ntasks = await nQueryFeature.query;

  res.status(200).json({
    status: 'success',
    total_docs: ntasks,
    env: {
      tasks,
    },
  });
});

exports.updateTask = catchAsync(async (req, res, next) => {
  const pickFields = [
    'name',
    'dueDate',
    'description',
    'workflow',
    'instruction',
    'remarks',
    '_assigneeId',
    '_documentId',
    'status',
    'message',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

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

  const task = await Task.findOneAndUpdate(initialQuery, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!task) return next(new AppError('Task not found!', 404));

  res.status(201).json({
    status: 'success',
    env: {
      task,
    },
  });
});

exports.updateTaskStatus = catchAsync(async (req, res, next) => {
  const pickFields = ['status'];
  const allowedStatus = [
    'Pending',
    'Completed',
    'Cancelled',
    'Declined',
    'For Approval',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  if (!filteredBody.status || !allowedStatus.includes(filteredBody.status))
    return next(new AppError('Invalid Status', 401));

  const task = await Task.findOneAndUpdate(initialQuery, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!task) return next(new AppError('Task not found'));

  res.status(201).json({
    status: 'success',
    env: {
      task,
    },
  });
});

exports.deleteTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const task = await Task.findOne(initialQuery);
  if (!task) return next(new AppError('Task not found', 404));

  if (task._documentId) {
    const document = await Document.findById(task._documentId);
    document.isAssigned = false;
    await document.save();
  }

  task.status = 'Deleted';
  await task.save();

  res.status(204).json({
    status: 'success',
  });
});

exports.patchTask = catchAsync(async (req, res, next) => {});
