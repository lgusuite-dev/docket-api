const _ = require('lodash');
const mongoose = require('mongoose');

const User = require('../../models/GENERAL/user.model');
const Team = require('../../models/GENERAL/team.model');
const Role = require('../../models/GENERAL/role.model');

const audit = require('../../utils/audit/index.js');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const { _generateRandomPassword } = require('../../utils/tokens');
const QueryFeatures = require('../../utils/query/queryFeatures');

const createID = () => new mongoose.Types.ObjectId();

const userPatchOrDeleteCascade = async (userId, req) => {
  const user = await User.findById(userId);
  const { prevStatus } = req.query;
  const { status, _teams } = user;

  if (status === 'Deleted' || status === 'Suspended') {
    if (_teams) {
      for (const teamId of _teams) {
        const team = await Team.findById(teamId);
        team.users.splice(team.users.indexOf(userId), 1);
        await team.save();
      }
    }
  } else {
    if (_teams && prevStatus === 'Active') {
      for (const teamId of _teams) {
        const team = await Team.findById(teamId);
        team.users = [...team.users, userId];
        await team.save();
      }
    }
  }
};

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
    '_role',
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

  // if (!_.isEmpty(filteredBody)) {
  //   await audit.createAudit({
  //     _userId: req.user._id,
  //     type: 'Team',
  //     action: 'Create',
  //     requestBody: filteredBody,
  //   });
  // }

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

  if (!_.isEmpty(newUser)) {
    await audit.createAudit({
      _tenantId: req.user._tenantId,
      _userId: req.user._id,
      type: 'User',
      action: 'Create',
      requestBody: newUser,
    });
  }

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
    '_role',
    'access_level',
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

  if (!_.isEmpty(filteredBody)) {
    filteredBody.userId = req.params.id;
    await audit.createAudit({
      _tenantId: req.user._tenantId,
      _userId: req.user._id,
      type: 'User',
      action: 'Update',
      requestBody: filteredBody,
    });
  }

  res.status(200).json({
    status: 'success',
    env: {
      user: updatedUser,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const endpoint = req.originalUrl;
  const validTypes = ['admins', 'users'];
  const type = endpoint.split('/api/v1/tenants/')[1].split('/')[0];
  const initialQuery = generateGetOneUserQuery(type, req);

  if (!validTypes.includes(type))
    return next(new AppError('Invalid type params', 400));

  const user = await User.findOneAndUpdate(initialQuery, { status: 'Deleted' });

  if (!user) return next(new AppError('User not found', 404));

  await userPatchOrDeleteCascade(id, req);

  if (type === 'admins') {
    const query = {
      type: 'User',
      status: { $ne: 'Deleted' },
      _tenantId: user._tenantId,
    };
    await User.updateMany(query, { status: 'Deleted' });
  }

  await audit.createAudit({
    _tenantId: req.user._tenantId,
    _userId: req.user._id,
    type: 'User',
    action: 'Update',
    requestBody: { userId: id },
  });

  res.status(204).json({
    status: 'success',
  });
});

exports.patchUser = catchAsync(async (req, res, next) => {
  const { action, id } = req.params;
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

  await userPatchOrDeleteCascade(id, req);

  await audit.createAudit({
    _tenantId: req.user._tenantId,
    _userId: req.user._id,
    type: 'User',
    action: 'Update',
    requestBody: { userId: id, status: action },
  });

  res.status(200).json({
    status: 'success',
  });
});

exports.getInclusionExclusion = catchAsync(async (req, res, next) => {
  const { access_level, routeTo } = req.params;
  const inclusionQuery = {
    access_level: { $lt: access_level },
    status: { $eq: 'Active' },
    _tenantId: req.user._tenantId,
  };

  const inclusionList = await User.find(inclusionQuery);

  const exclusionQuery = {
    access_level: { $gte: access_level },
    type: { $nin: ['Superadmin', 'Admin'] },
    status: { $eq: 'Active' },
    _tenantId: req.user._tenantId,
  };

  let exclusionList = await User.find(exclusionQuery).populate({
    path: '_role',
  });

  exclusionList = exclusionList.filter((user) => {
    if (user._role) {
      let roleAccess = user._role.access;
      for (let access of roleAccess) {
        if (access.hasAccess && access.children) {
          let userWithDocAssign = access.children.find(
            (accessChild) =>
              accessChild.routeTo === routeTo && accessChild.hasAccess
          );
          if (userWithDocAssign) return false;
        }
      }
    }

    return true;
  });

  res.status(200).json({
    status: 'success',
    env: {
      inclusionList,
      exclusionList,
    },
  });
});

// private _filterExclusionList(userArray: any) {
//   if (!userArray || userArray.length === 0) return [];
// return userArray.filter((user: User) => {
//   let roleAccess: any = user._role?.access;
//   for (let access of roleAccess) {
//     if (access.hasAccess && access.children) {
//       let userWithDocAssign = access.children.find(
//         (accessChild: any) =>
//           accessChild.routeTo === 'document-assignation' &&
//           accessChild.hasAccess
//       );
//       if (userWithDocAssign) return false;
//     }
//   }

//   return user.access_level >= this.selectedConfLevel.value + 1;
// });
// }
