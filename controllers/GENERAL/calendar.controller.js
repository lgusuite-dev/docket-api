const _ = require('lodash');
const Event = require('../../models/GENERAL/event.model');
const Task = require('../../models/GENERAL/task.model');
const User = require('../../models/GENERAL/user.model');
const Team = require('../../models/GENERAL/team.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.getAll = catchAsync(async (req, res, next) => {
  const initialQuery = {
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const taskQuery = new QueryFeatures(Task.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();
  const eventQuery = new QueryFeatures(Event.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const tasks = await taskQuery.query;
  const events = await eventQuery.query;

  res.status(200).json({
    status: 'success',
    env: {
      events,
      tasks,
    },
  });
});

exports.getAllByTeam = catchAsync(async (req, res, next) => {
  const user = req.user;
  let teamIDs = req.user._teams;
  let tasks, events;
  //   console.log(teamIDs);

  const team = await Team.find({ _id: { $in: teamIDs } });

  res.status(200).json({
    message: 'success',
    env: {
      tasks,
      events,
      user,
    },
  });
});

exports.getAllByUser = catchAsync(async (req, res, next) => {
  const initialQuery = {
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
    _id: req.user._id,
  };

  const taskQuery = new QueryFeatures(Task.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();
  const eventQuery = new QueryFeatures(Event.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const tasks = await taskQuery.query;
  const events = await eventQuery.query;

  res.status(200).json({
    status: 'success',
    env: {
      events,
      tasks,
    },
  });
});
