const _ = require('lodash');
const Task = require('../../models/GENERAL/task.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

const filterTaskUsersID = (inputUsers) => [...new Set(inputUsers)];

const updateTaskBasedOnAction = async (action, task, prevStatus) => {
  if (action === 'undo') {
    if (task.status !== 'Deleted') {
      const message = 'Cant retrieve task';
      return { haveError: true, message, status: 400 };
    }
    task.status = prevStatus;
    await task.save({ validateBeforeSave: false });
    return { haveError: false };
  }

  if (task.status === 'Deleted') {
    const message = 'This task is deleted';
    return { haveError: true, message, status: 400 };
  }

  if (action === 'pending') task.status = 'Pending';
  else if (action === 'todo') task.status = 'Todo';
  else if (action === 'declined') task.status = 'Declined';
  else task.status = 'Completed';

  await task.save({ validateBeforeSave: false });
  return { haveError: false };
};

exports.createTask = catchAsync(async (req, res, next) => {
  const pickFields = [
    'name',
    'description',
    'instruction',
    'attachments',
    '_references',
    'startDate',
    'dueDate',
    'assignedTo',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;

  let prevTaskId = req.params['id'];
  if (prevTaskId) {
    let prevTask = await Task.findById(prevTaskId);
    filteredBody['_mainTaskId'] = prevTask._mainTaskId || prevTaskId;
    filteredBody['_fromTaskId'] = prevTaskId;
  }

  const foundTask = await Task.findOne({
    name: filteredBody.name,
    status: 'Deleted',
    _tenantId: req.user._tenantId,
  });

  if (foundTask) await Task.findByIdAndDelete(foundTask._id);

  if (filteredBody.assignedTo && filteredBody.assignedTo.length)
    filteredBody.assignedTo = filterTaskUsersID(filteredBody.assignedTo);

  const task = await Task.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      task,
    },
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

  const tasks = await queryFeatures.query;

  res.status(200).json({
    status: 'success',
    env: {
      tasks,
    },
  });
});

//needs refactoring -ryan
exports.getTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const body = { isRead: true };
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const task = await Task.findOne(initialQuery);

  if (!task) return next(new AppError('Task not found', 404));

  const stringifyAssignedTo = [...task.assignedTo.toString().split(',')];

  if (stringifyAssignedTo.includes(req.user._id.toString()))
    await Task.findByIdAndUpdate(task._id, body, {
      new: true,
      runValidators: true,
    });

  const queryFeatures = new QueryFeatures(Task.findOne(initialQuery), req.query)
    .limitFields()
    .populate();

  const taskRow = await queryFeatures.query;

  res.status(200).json({
    status: 'success',
    env: {
      taskRow,
    },
  });
});

exports.updateTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const pickFields = [
    'name',
    'description',
    'instruction',
    'attachments',
    '_references',
    'startDate',
    'dueDate',
    'assignedTo',
  ];
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._updatedBy = req.user._id;

  if (filteredBody.assignedTo && filteredBody.assignedTo.length)
    filteredBody.users = filterTaskUsersID(filteredBody.users);

  const foundTask = await Task.findOne({
    name: filteredBody.name || '',
    status: 'Deleted',
    _tenantId: req.user._tenantId,
  });

  if (foundTask) await Task.findByIdAndDelete(foundTask._id);

  const updatedTask = await Task.findOneAndUpdate(initialQuery, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!updatedTask) return next(new AppError('Task not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      task: updatedTask,
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

  const task = await Task.findOneAndUpdate(initialQuery, { status: 'Deleted' });

  if (!task) return next(new AppError('Task not found', 404));

  res.status(204).json({
    status: 'success',
  });
});

exports.patchTask = catchAsync(async (req, res, next) => {
  const { id, action } = req.params;
  const { prevStatus } = req.query;
  const allowedActions = ['pending', 'todo', 'completed', 'undo', 'declined'];
  const allowedStatus = ['Pending', 'Todo', 'Completed'];
  const initialQuery = { _id: id, _tenantId: req.user._tenantId };

  if (!allowedActions.includes(action))
    return next(new AppError('Invalid action params', 400));

  if (action === 'undo' && !prevStatus)
    return next(new AppError('Please provide previous status value', 400));

  if (action === 'undo' && !allowedStatus.includes(prevStatus))
    return next(new AppError('Invalid previous status value', 400));

  const task = await Task.findOne(initialQuery);

  if (!task) return next(new AppError('Task not found', 404));

  if (task.status === 'Todo' && action === 'todo')
    return next(new AppError('This task is already todo', 400));

  if (task.status === 'Pending' && action === 'pending')
    return next(new AppError('This task is already pending', 400));

  if (task.status === 'Completed' && action === 'completed')
    return next(new AppError('This task is already completed', 400));

  if (task.status === 'Declined' && action === 'declined')
    return next(new AppError('This task is already completed', 400));

  const result = await updateTaskBasedOnAction(action, task, prevStatus);

  if (result.haveError)
    return next(new AppError(result.message, result.status));

  res.status(200).json({
    status: 'success',
    env: {
      task: task,
    },
  });
});
