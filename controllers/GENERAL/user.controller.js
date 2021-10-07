const _ = require('lodash');
const mongoose = require('mongoose');

const User = require('../../models/GENERAL/user.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const { _generateRandomPassword } = require('../../utils/tokens');
const QueryFeatures = require('../../utils/query/queryFeatures');

const createID = () => new mongoose.Types.ObjectId();

exports.createSuper = catchAsync(async (req, res, next) => {
  if (!req.headers.supertoken || !req.headers.superuser)
    return next(new AppError('Forbidden', 403));

  if (
    req.headers.superuser !== process.env.SUPERUSER ||
    req.headers.supertoken !== process.env.SUPERTOKEN
  )
    return next(new AppError('Unauthorized', 401));

  const omitFields = ['type', 'status', '_tenantId'];
  const filteredBody = _.omit(req.body, omitFields);
  const _id = createID();

  filteredBody.type = 'Superadmin';
  filteredBody._id = _id;
  filteredBody._tenantId = _id;
  filteredBody._createdBy = _id;

  const newSuper = await User.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      user: newSuper,
    },
  });
});

exports.createAdmin = catchAsync(async (req, res, next) => {
  const pickFields = [
    'firstName',
    'lastName',
    'middleName',
    'email',
    'mobileNumber',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const randomPassword = _generateRandomPassword(8);
  const _id = createID();

  filteredBody.password = randomPassword;
  filteredBody.passwordConfirm = randomPassword;
  filteredBody._id = _id;
  filteredBody._tenantId = _id;
  filteredBody._createdBy = req.user._id;

  const newAdmin = await User.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      user: newAdmin,
    },
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  const pickFields = [
    'firstName',
    'lastName',
    'middleName',
    'email',
    'mobileNumber',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const randomPassword = _generateRandomPassword(8);
  const _id = createID();

  filteredBody.type = 'User';
  filteredBody.password = randomPassword;
  filteredBody.passwordConfirm = randomPassword;
  filteredBody._id = _id;
  filteredBody._tenantId = req.user._id;
  filteredBody._createdBy = req.user._id;

  const newAdmin = await User.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      user: newAdmin,
    },
  });
});

exports.getAllAdmins = catchAsync(async (req, res, next) => {
  const initialQuery = { status: { $ne: 'Deleted' }, type: 'Admin' };

  const queryFeature = new QueryFeatures(User.find(initialQuery), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate();

  const nQueryFeature = new QueryFeatures(User.find(initialQuery), req.query)
    .filter()
    .count();

  const admins = await queryFeature.query;
  const nAdmins = await nQueryFeature.query;

  res.status(200).json({
    status: 'success',
    total_docs: nAdmins,
    results: admins.length,
    env: {
      admins,
    },
  });
});

exports.getAdmin = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const intialQuery = { _id: id, status: { $ne: 'Deleted' }, type: 'Admin' };

  const queryFeature = new QueryFeatures(User.findOne(intialQuery), req.query)
    .limitFields()
    .populate();

  const user = await queryFeature.query;

  if (!user) return next(new AppError('User not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      user,
    },
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const initialQuery = {
    status: { $ne: 'Deleted' },
    type: 'User',
    _tenantId: req.user._tenantId,
  };

  const queryFeature = new QueryFeatures(User.find(initialQuery), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate();

  const nQueryFeature = new QueryFeatures(User.find(initialQuery), req.query)
    .filter()
    .count();

  const users = await queryFeature.query;
  const nUsers = await nQueryFeature.query;

  res.status(200).json({
    status: 'success',
    total_docs: nUsers,
    results: users.length,
    env: {
      users,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    type: 'User',
    _tenantId: req.user._tenantId,
  };

  const queryFeature = new QueryFeatures(User.findOne(initialQuery), req.query)
    .limitFields()
    .populate();

  const user = await queryFeature.query;

  if (!user) return next(new AppError('User not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      user,
    },
  });
});

exports.deleteAdmin = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    type: 'Admin',
  };

  const user = await User.findOneAndUpdate(initialQuery, { status: 'Deleted' });

  if (!user) return next(new AppError('User not found', 404));

  res.status(204).json({
    status: 'success',
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    type: 'User',
    _tenantId: req.user._tenantId,
  };

  const user = await User.findOneAndUpdate(initialQuery, { status: 'Deleted' });

  if (!user) return next(new AppError('User not found', 404));

  res.status(204).json({
    status: 'success',
  });
});

exports.suspendAdmin = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const initialQuery = {
    _id: id,
    type: 'Admin',
  };

  const user = await User.findOne(initialQuery);

  if (!user) return next(new AppError('User not found', 404));

  if (user.status === 'Suspended')
    return next(new AppError('This account is already suspended', 400));

  user.status = 'Suspended';
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
  });
});
