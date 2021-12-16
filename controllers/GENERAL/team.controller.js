const _ = require('lodash');
const Team = require('../../models/GENERAL/team.model');
const User = require('../../models/GENERAL/user.model');
const audit = require('../../utils/audit/index.js');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

const filterTeamUsersID = (inputUsers) => [...new Set(inputUsers)];

const userStatusValidation = async (teamUsers) => {
  const userQuery = {
    _id: { $in: teamUsers },
    status: { $nin: ['Deleted', 'Suspended'] },
  };
  const users = await User.find(userQuery);

  return users.length !== teamUsers.length;
};

const addOrRemoveTeamIdToUsers = async (users, teamID, action) => {
  for (const id of users) {
    const user = await User.findById(id);

    if (user) {
      if (action === 'upsert') {
        let userTeams = [];

        if (user._teams.length) userTeams = [...user._teams];

        userTeams.push(teamID);

        user._teams = userTeams;
      }

      if (action === 'delete') {
        const updatedUserTeams = user._teams.filter(
          (id) => id.toString() !== teamID.toString()
        );

        user._teams = updatedUserTeams;
      }

      await user.save({ validateBeforeSave: false });
    }
  }
};

const identifyRemovedAndAddedIDs = (oldIDs, updatedIDs) => {
  const removedData = [];
  const addedData = [];

  if (oldIDs.length) {
    for (const id of oldIDs) {
      if (!updatedIDs.includes(id)) removedData.push(id);
    }
  }

  if (updatedIDs.length) {
    for (const id of updatedIDs) {
      if (!oldIDs.includes(id)) addedData.push(id);
    }
  }

  return { removedData, addedData };
};

const updateTeamBasedOnAction = async (req) => {
  const { id, action } = req.params;
  const { prevStatus } = req.query;

  const query = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  if (action === 'undo') {
    const undoQuery = { ...query };
    undoQuery.status = { $eq: 'Deleted' };

    const undoTeam = await Team.findOneAndUpdate(
      undoQuery,
      {
        status: prevStatus,
      },
      { new: true, runValidators: true }
    );

    return undoTeam;
  }
};

exports.createTeam = catchAsync(async (req, res, next) => {
  const pickFields = ['name', 'description', 'users'];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;

  if (filteredBody.users && filteredBody.users.length) {
    filteredBody.users = filterTeamUsersID(filteredBody.users);

    if (await userStatusValidation(filteredBody.users)) {
      return next(
        new AppError('Cannot add deleted or suspended user in a team', 404)
      );
    }
  }

  if (filteredBody.name) {
    const foundTeam = await Team.findOne({
      name: filteredBody.name,
      status: 'Deleted',
      _tenantId: req.user._tenantId,
    });

    if (foundTeam) await Team.findByIdAndDelete(foundTeam._id);
  }

  const team = await Team.create(filteredBody);

  if (team.users)
    await addOrRemoveTeamIdToUsers(team.users, team._id, 'upsert');

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: req.user._id,
      type: 'Team',
      action: 'Create',
      requestBody: filteredBody,
    });
  }

  res.status(201).json({
    status: 'success',
    env: {
      team,
    },
  });
});

exports.getTeams = catchAsync(async (req, res, next) => {
  const initialQuery = {
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(Team.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nQueryFeature = new QueryFeatures(Team.find(initialQuery), req.query)
    .filter()
    .count();

  const teams = await queryFeatures.query;
  const nTeams = await nQueryFeature.query;

  res.status(200).json({
    status: 'success',
    total_docs: nTeams,
    env: {
      teams,
    },
  });
});

exports.getTeam = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

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
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const team = await Team.findOne(initialQuery);

  if (!team) return next(new AppError('Team not found', 404));

  if (filteredBody.users && filteredBody.users.length) {
    filteredBody.users = filterTeamUsersID(filteredBody.users);

    if (await userStatusValidation(filteredBody.users)) {
      return next(
        new AppError('Cannot add deleted or suspended user in a team', 404)
      );
    }
  }

  if (filteredBody.name) {
    const foundTeam = await Team.findOne({
      name: filteredBody.name,
      status: 'Deleted',
      _tenantId: req.user._tenantId,
    });

    if (foundTeam) await Team.findByIdAndDelete(foundTeam._id);
  }

  const updatedTeam = await Team.findByIdAndUpdate(team._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  const { addedData, removedData } = identifyRemovedAndAddedIDs(
    team.users,
    updatedTeam.users
  );

  if (addedData.length)
    await addOrRemoveTeamIdToUsers(addedData, updatedTeam._id, 'upsert');
  if (removedData.length)
    await addOrRemoveTeamIdToUsers(removedData, updatedTeam._id, 'delete');

  if (!_.isEmpty(filteredBody)) {
    filteredBody.teamId = id;
    await audit.createAudit({
      _userId: req.user._id,
      type: 'Team',
      action: 'Update',
      requestBody: filteredBody,
    });
  }

  res.status(200).json({
    status: 'success',
    env: {
      team: updatedTeam,
    },
  });
});

exports.deleteTeam = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const team = await Team.findOneAndUpdate(initialQuery, { status: 'Deleted' });

  if (!team) return next(new AppError('Team not found', 404));

  if (team.users.length)
    return next(new AppError("Can't delete team that have users", 400));

  await audit.createAudit({
    _userId: req.user._id,
    type: 'Team',
    action: 'Delete',
    requestBody: { teamId: id },
  });

  res.status(204).json({
    status: 'success',
  });
});

exports.patchTeam = catchAsync(async (req, res, next) => {
  const { action } = req.params;
  const { prevStatus } = req.query;
  const allowedActions = ['undo'];
  const allowedStatus = ['Active'];

  if (!allowedActions.includes(action))
    return next(new AppError('Invalid action params', 400));

  if (action === 'undo' && !prevStatus)
    return next(new AppError('Please provide previous status value', 400));

  if (action === 'undo' && !allowedStatus.includes(prevStatus))
    return next(new AppError('Invalid previous status value', 400));

  const updatedTeam = await updateTeamBasedOnAction(req);

  if (!updatedTeam) return next(new AppError('Team not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      team: updatedTeam,
    },
  });
});
