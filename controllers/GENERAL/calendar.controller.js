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

  // const taskQuery = new QueryFeatures(Task.find(initialQuery), req.query)
  //   .sort()
  //   .limitFields()
  //   .filter()
  //   .paginate()
  //   .populate();
  const eventQuery = new QueryFeatures(Event.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  // const tasks = await taskQuery.query;
  const events = await eventQuery.query;

  res.status(200).json({
    status: 'success',
    env: {
      events,
      // tasks,
    },
  });
});

exports.getAllByTeam = catchAsync(async (req, res, next) => {
  const user = req.user;
  let teamIDs = req.user._teams;
  // let tasks = [];
  let events = [];

  const team = await Team.findById(req.params.id).populate('users', 'email');

  //   });
  for (let user of team.users) {
    console.log(user);
    // let _tasks = await Task.find({
    //   assignedTo: { $elemMatch: { $eq: user._id } },
    //   status: { $nin: ['Deleted'] },
    //   _tenantId: req.user._tenantId,
    // });
    let _events = await Event.find({
      guests: { $elemMatch: { email: user.email } },
      status: { $nin: ['Deleted'] },
      _tenantId: req.user._tenantId,
    });

    // if (_tasks.length) for (const doc of _tasks) tasks.push(doc);

    if (_events.length) for (const doc of _events) events.push(doc);
  }

  res.status(200).json({
    message: 'success',
    env: {
      // tasks,
      events,
    },
  });
});

exports.getAllByUser = catchAsync(async (req, res, next) => {
  //   console.log(req.user._id);
  let initialQuery = {
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
    assignedTo: { $elemMatch: { $eq: req.user._id } },
  };
  console.log(initialQuery, '1');
  // const taskQuery = new QueryFeatures(Task.find(initialQuery), req.query)
  //   .sort()
  //   .limitFields()
  //   .filter()
  //   .paginate()
  //   .populate();

  // const tasks = await taskQuery.query;

  const eventInitQuery = _.omit(initialQuery, ['assignedTo']);
  eventInitQuery.guests = { $elemMatch: { email: req.user.email } };

  console.log(req.user._id);
  console.log(req.user._tenantId);

  console.log(eventInitQuery, '2');
  const eventQuery = new QueryFeatures(Event.find(eventInitQuery), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate();

  const events = await eventQuery.query;

  res.status(200).json({
    status: 'success',
    env: {
      events,
      // tasks,
    },
  });
});
