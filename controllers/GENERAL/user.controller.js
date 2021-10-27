const _ = require('lodash');
const mongoose = require('mongoose');

const User = require('../../models/GENERAL/user.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const { _generateRandomPassword } = require('../../utils/tokens');
const QueryFeatures = require('../../utils/query/queryFeatures');

const createID = () => new mongoose.Types.ObjectId();

const generateGetUsersQuery = (type, req) => {
  if (type === 'admins') return { status: { $ne: 'Deleted' }, type: 'Admin' };

  if (type === 'users')
    return {
      status: { $ne: 'Deleted' },
      type: 'User',
      _tenantId: req.user._tenantId,
    };
};

const generateGetOneUserQuery = (type, req) => {
  const { id } = req.params;
  const { prevStatus } = req.query;

  const query = { _id: id, status: { $ne: 'Deleted' } };

  if (type === 'admins') {
    if (prevStatus) delete query.status;
    query.type = 'Admin';
  }

  if (type === 'users') {
    if (prevStatus) delete query.status;
    query.type = 'User';
    query._tenantId = req.user._tenantId;
  }

  return query;
};

const generateUserData = (type, req) => {
  const pickFields = [
    'firstName',
    'lastName',
    'middleName',
    'email',
    'mobileNumber',
    'role',
    'access_level',
    'others',
    'sex',
    'address',
  ];

  const filteredBody = _.pick(req.body, pickFields);
  const randomPassword = _generateRandomPassword();
  const _id = createID();

  if (type === 'admins') {
    filteredBody.password = randomPassword;
    filteredBody.passwordConfirm = randomPassword;
    filteredBody._id = _id;
    filteredBody._tenantId = _id;
    filteredBody._createdBy = req.user._id;
  }

  if (type === 'users') {
    filteredBody.type = 'User';
    filteredBody.password = randomPassword;
    filteredBody.passwordConfirm = randomPassword;
    filteredBody._id = _id;
    filteredBody._createdBy = req.user._id;
    filteredBody._tenantId = req.user._tenantId;
  }

  return filteredBody;
};

const validateAction = async (action, user, req) => {
  const { access_level } = req.body;
  const { prevStatus } = req.query;

  if (action === 'access-level') {
    const allowedAccessLevel = [1, 2, 3, 4];

    if (!allowedAccessLevel.includes(access_level)) {
      const message = 'Invalid access level value';
      return { haveError: true, message, status: 400 };
    }

    user.access_level = access_level;
    await user.save({ validateBeforeSave: false });
    return { haveError: false };
  }

  if (action === 'undo') {
    if (user.status !== 'Deleted') {
      const message = 'Cant retrieve user';
      return { haveError: true, message, status: 400 };
    }
    user.status = prevStatus;
    await user.save({ validateBeforeSave: false });
    return { haveError: false };
  }

  user.status = action === 'suspend' ? 'Suspended' : 'Active';
  await user.save({ validateBeforeSave: false });
  return { haveError: false };
};

const updateChildBasedOnAction = async (type, action, user, req) => {
  if (action === 'access-level' || type === 'users') return;

  const { _tenantId } = user;
  const query = { type: 'User', _tenantId, status: { $eq: 'Active' } };

  if (action === 'suspend') {
    await User.updateMany(query, { status: 'Suspended' });
  } else if (action === 'undo') {
    const undoQuery = { ...query };
    const { prevStatus } = req.query;
    undoQuery.status = { $eq: 'Deleted' };

    await User.updateMany(undoQuery, { status: prevStatus });
  } else {
    const activeQuery = { ...query };
    activeQuery.status = { $eq: 'Suspended' };

    await User.updateMany(activeQuery, { status: 'Active' });
  }
};

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

exports.createUser = catchAsync(async (req, res, next) => {
  const endpoint = req.originalUrl;
  const validTypes = ['admins', 'users'];
  const type = endpoint.split('/api/v1/tenants/')[1].split('?')[0];
  const userData = generateUserData(type, req);

  if (!validTypes.includes(type))
    return next(new AppError('Invalid type params', 400));

  const newUser = await User.create(userData);
  newUser.password = undefined;

  res.status(201).json({
    status: 'success',
    env: {
      user: newUser,
    },
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const endpoint = req.originalUrl;
  const validTypes = ['admins', 'users'];
  const type = endpoint.split('/api/v1/tenants/')[1].split('?')[0];
  const initialQuery = generateGetUsersQuery(type, req);

  if (!validTypes.includes(type))
    return next(new AppError('Invalid type params', 400));

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
  const endpoint = req.originalUrl;
  const validTypes = ['admins', 'users'];
  const type = endpoint.split('/api/v1/tenants/')[1].split('/')[0];
  const initialQuery = generateGetOneUserQuery(type, req);

  if (!validTypes.includes(type))
    return next(new AppError('Invalid type params', 400));

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

exports.updateUser = catchAsync(async (req, res, next) => {
  const endpoint = req.originalUrl;
  const validTypes = ['admins', 'users'];
  const pickFields = [
    'firstName',
    'lastName',
    'middleName',
    'mobileNumber',
    'sex',
    'others',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const type = endpoint.split('/api/v1/tenants/')[1].split('/')[0];
  const initialQuery = generateGetOneUserQuery(type, req);

  if (!validTypes.includes(type))
    return next(new AppError('Invalid type params', 400));

  const user = await User.findOne(initialQuery);

  if (!user) return next(new AppError('User not found', 404));

  const { others } = filteredBody;

  if (others) {
    const filteredOthers = _.pick(others, ['prefix', 'suffix', 'position']);
    filteredBody.others = { ...user.others, ...filteredOthers };
  }

  const updatedUser = await User.findByIdAndUpdate(user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    env: {
      user: updatedUser,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const endpoint = req.originalUrl;
  const validTypes = ['admins', 'users'];
  const type = endpoint.split('/api/v1/tenants/')[1].split('/')[0];
  const initialQuery = generateGetOneUserQuery(type, req);

  if (!validTypes.includes(type))
    return next(new AppError('Invalid type params', 400));

  const user = await User.findOneAndUpdate(initialQuery, { status: 'Deleted' });

  if (!user) return next(new AppError('User not found', 404));

  if (type === 'admins') {
    const query = {
      type: 'User',
      status: { $ne: 'Deleted' },
      _tenantId: user._tenantId,
    };
    await User.updateMany(query, { status: 'Deleted' });
  }

  res.status(204).json({
    status: 'success',
  });
});

exports.patchUser = catchAsync(async (req, res, next) => {
  const { action } = req.params;
  const { prevStatus } = req.query;
  const endpoint = req.originalUrl;
  const allowedActions = ['suspend', 'active', 'access-level', 'undo'];
  const allowedStatus = ['Active', 'Suspended', 'Deleted'];
  const type = endpoint.split('/api/v1/tenants/')[1].split('/')[0];
  const initialQuery = generateGetOneUserQuery(type, req);

  if (!allowedActions.includes(action))
    return next(new AppError('Invalid action params', 400));

  if (action === 'undo' && !prevStatus)
    return next(new AppError('Please provide previous status value', 400));

  if (action === 'undo' && !allowedStatus.includes(prevStatus))
    return next(new AppError('Invalid previous status value', 400));

  const user = await User.findOne(initialQuery);

  if (!user) return next(new AppError('User not found', 404));

  if (user.status === 'Suspended' && action === 'suspend')
    return next(new AppError('This account is already suspended', 400));

  if (user.status === 'Active' && action === 'active')
    return next(new AppError('This account is already active', 400));

  const result = await validateAction(action, user, req);

  if (result.haveError)
    return next(new AppError(result.message, result.status));

  await updateChildBasedOnAction(type, action, user, req);

  res.status(200).json({
    status: 'success',
  });
});
