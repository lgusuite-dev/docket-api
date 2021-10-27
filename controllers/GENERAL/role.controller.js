const _ = require('lodash');
const Role = require('../../models/GENERAL/role.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

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

  const role = await Role.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      role,
    },
  });
});

exports.updateRole = catchAsync(async (req, res, next) => {
  const pickFields = ['name', 'description', 'accesss'];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const role = await Role.findOneAndUpdate(initialQuery, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!role) return next(new AppError('Role not found!', 404));

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

  res.status(204).json({
    status: 'success',
  });
});
