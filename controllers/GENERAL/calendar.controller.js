const _ = require('lodash');
const Event = require('../../models/GENERAL/event.model');
const Task = require('../../models/GENERAL/task.model');
const User = require('../../models/GENERAL/user.model');
const Team = require('../../models/GENERAL/team.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

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
