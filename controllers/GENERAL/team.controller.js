const _ = require('lodash');
const Team = require('../../models/GENERAL/team.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

const teamUsersCleanup = (inputUsers, teamUsers = []) => {
  let uniqueUsers = [];

  if (teamUsers.length) {
    // get all unique _id values of teamUsers array
    for (const _id of teamUsers)
      if (!uniqueUsers.includes(_id)) uniqueUsers.push(_id.toString());

    // get all unique _id values of inputUsers array
    for (const _id of inputUsers)
      if (!uniqueUsers.includes(_id)) uniqueUsers.push(_id.toString());

    return uniqueUsers;
  }

  // get all unique _id values of inputUsers array if no teamUsrs
  for (const _id of inputUsers)
    if (!uniqueUsers.includes(_id)) uniqueUsers.push(_id);

  return uniqueUsers;
};

exports.createTeam = catchAsync(async (req, res, next) => {
  const pickFields = ['name', 'description', 'users'];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;

  if (filteredBody.users.length)
    filteredBody.users = teamUsersCleanup(filteredBody.users);

  const team = await Team.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      team,
    },
  });
});

exports.getTeams = catchAsync(async (req, res, next) => {
  const initialQuery = { status: { $ne: 'Deleted' } };
  const queryFeatures = new QueryFeatures(Team.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const teams = await queryFeatures.query;

  res.status(200).json({
    status: 'success',
    env: {
      teams,
    },
  });
});

exports.getTeam = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = { _id: id, status: { $ne: 'Deleted' } };

  const queryFeatures = new QueryFeatures(Team.findOne(initialQuery), req.query)
    .limitFields()
    .populate();

  const team = await queryFeatures.query;

  if (!team) return next(new AppError('Team not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      team,
    },
  });
});

exports.updateTeam = catchAsync(async (req, res, next) => {
  const pickFields = ['name', 'description', 'users'];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  const initialQuery = { _id: id, status: { $ne: 'Deleted' } };

  const team = await Team.findOne(initialQuery);

  if (!team) return next(new AppError('Team not found', 404));

  if (filteredBody.users.length)
    filteredBody.users = teamUsersCleanup(filteredBody.users, team.users);

  const updatedTeam = await Team.findByIdAndUpdate(team._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    env: {
      team: updatedTeam,
    },
  });
});

exports.deleteTeam = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = { _id: id, status: { $ne: 'Deleted' } };

  const team = await Team.findOneAndUpdate(initialQuery, { status: 'Deleted' });

  if (!team) return next(new AppError('Team not found', 404));

  if (team.users.length)
    return next(new AppError("Can't delete team that have users", 400));

  res.status(204).json({
    status: 'success',
  });
});
