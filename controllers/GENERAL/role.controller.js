const _ = require('lodash');
const Role = require('../../models/GENERAL/role.model');

const audit = require('../../utils/audit/index.js');
const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');
const User = require('../../models/GENERAL/user.model');

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

    const undoTeam = await Role.findOneAndUpdate(
      undoQuery,
      {
        status: prevStatus,
      },
      { new: true, runValidators: true }
    );

    return undoTeam;
  }
};

exports.getAllRoles = catchAsync(async (req, res, next) => {
  const initialQuery = {
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };
  const queryFeatures = new QueryFeatures(Role.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();
  const countRoles = new QueryFeatures(Role.find(initialQuery), req.query)
    .filter()
    .count();

  const total = await countRoles.query;
  const roles = await queryFeatures.query;
  res.status(200).json({
    status: 'Success',
    total,
    env: {
      roles,
    },
  });
});

exports.getRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(Role.findOne(initialQuery), req.query)
    .limitFields()
    .populate();

  const role = await queryFeatures.query;
  if (!role) return next(new AppError('App not found!', 404));

  res.status({
    status: 'success',
    env: {
      role,
    },
  });
});

exports.createRole = catchAsync(async (req, res, next) => {
  const pickFields = ['name', 'description', 'access'];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;

  if (filteredBody.name) {
    const foundRole = await Role.findOne({
      name: filteredBody.name,
      status: 'Deleted',
      _tenantId: req.user._tenantId,
    });

    if (foundRole) await Role.findByIdAndDelete(foundRole._id);
  }

  const role = await Role.create(filteredBody);

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: req.user._id,
      _tenantId: req.user._tenantId,
      type: 'Role',
      action: 'Create',
      requestBody: filteredBody,
    });
  }

  res.status(201).json({
    status: 'success',
    env: {
      role,
    },
  });
});

exports.updateRole = catchAsync(async (req, res, next) => {
  const pickFields = ['name', 'description', 'access'];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  if (filteredBody.name) {
    const foundRole = await Role.findOne({
      name: filteredBody.name,
      status: 'Deleted',
      _tenantId: req.user._tenantId,
    });

    if (foundRole) await Role.findByIdAndDelete(foundRole._id);
  }

  const role = await Role.findOneAndUpdate(initialQuery, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!role) return next(new AppError('Role not found!', 404));

  if (!_.isEmpty(filteredBody)) {
    filteredBody.roleId = id;
    await audit.createAudit({
      _userId: req.user._id,
      _tenantId: req.user._tenantId,
      type: 'Role',
      action: 'Update',
      requestBody: filteredBody,
    });
  }

  res.status(200).json({
    status: 'success',
    env: {
      role,
    },
  });
});

exports.deleteRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const role = await Role.findOneAndUpdate(initialQuery, { status: 'Deleted' });

  if (!role) return next(new AppError('Role not found!', 400));

  await audit.createAudit({
    _userId: req.user._id,
    _tenantId: req.user._tenantId,
    type: 'Role',
    action: 'Delete',
    requestBody: { roleId: id },
  });

  res.status(204).json({
    status: 'success',
  });
});

exports.patchRole = catchAsync(async (req, res, next) => {
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

  if (!updatedTeam) return next(new AppError('Role not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      team: updatedTeam,
    },
  });
});

exports.checkRoleInUsers = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    status: { $nin: ['Deleted', 'Suspended'] },
    _role: id,
  };

  const queryFeatures = new QueryFeatures(User.findOne(initialQuery), req.query)
    .filter()
    .count();

  let total = 0;
  if (queryFeatures) {
    total = await queryFeatures.query;
  }
  res.status(200).json({
    status: 'success',
    total,
  });
});
