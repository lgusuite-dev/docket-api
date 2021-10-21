const _ = require('lodash');
const Team = require('../../models/GENERAL/team.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.createTeam = catchAsync(async (req, res, next) => {
  const pickFields = ['name', 'description', 'users'];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;

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

  const team = await Team.findOneAndUpdate(initialQuery, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!team) return next(new AppError('Team not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      team,
    },
  });
});

exports.deleteTeam = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = { _id: id, status: { $ne: 'Deleted' } };

  const team = await Team.findOneAndUpdate(initialQuery, { status: 'Deleted' });

  if (!team) return next(new AppError('Team not found', 404));

  res.status(204).json({
    status: 'success',
  });
});
