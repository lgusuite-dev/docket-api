const _ = require('lodash');
const crypto = require('crypto');

const User = require('../../models/GENERAL/user.model');

const audit = require('../../utils/audit/index.js');
const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const {
  _signToken,
  _verifyToken,
  _createSessionToken,
} = require('../../utils/tokens');
const { sendMail } = require('../../utils/comms/email');

const generateLoginQuery = (type) => {
  if (type === 'super')
    return { type: 'Superadmin', status: { $ne: 'Deleted' } };
  if (type === 'tenant')
    return {
      $or: [{ type: 'User' }, { type: 'Admin' }],
      status: { $ne: 'Deleted' },
    };
};

const sendAuthResponse = (user, statusCode, res) => {
  const token = _signToken({ id: user._id });
  const session_token = _createSessionToken(user, token);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    session_token,
    token,
    env: {
      user,
    },
  });
};

const mailResetToken = async (user, resetToken) => {
  if (process.env.NODE_ENV === 'test') return;

  try {
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const validityDate = new Date(Date.now() + 10 * 60 * 1000).toLocaleString();

    const mailOptions = {
      to: user.email,
      subject: `Docket Password Reset Token. Valid until ${validityDate}`,
      html: `<div>
      <h1>Good day ${user.firstName},</h1> 
      <p>Someone (hopefully you) has requested a password reset for your Docket account. Follow the link below to set a new password:</p>
      <div><p><a href=${resetLink}>${resetLink}</a></p></div>
      <div><p>If you don't wish to reset your password, disregard this email and no action will be taken.</p></div>
      </div>
      `,
    };

    await sendMail(mailOptions);
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending email. Please try again later!',
        500
      )
    );
  }
};

const checkMobileAccess = (user) => {
  const access = false;

  if (user._role.access.length) {
    for (const type of user._role.access) {
      if (type.label === 'My Tasks' && type.hasAccess) {
        for (const child of type.children) {
          if (child.routeTo === 'for-approval' && child.hasAccess) return true;
        }
      }
    }
  }

  return false;
};

exports.login = catchAsync(async (req, res, next) => {
  const { type } = req.params;
  const { email, password } = req.body;
  const validTypes = ['super', 'tenant'];

  if (!email) return next(new AppError('Please provide email', 400));
  if (!password) return next(new AppError('Please provide password', 400));

  if (!validTypes.includes(type))
    return next(new AppError('Invalid type params', 400));

  const query = { ...generateLoginQuery(type), email };

  const user = await User.findOne(query).select('+password');

  if (!user || !(await user.isPasswordCorrect(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  if (user.status === 'Suspended')
    return next(new AppError('Your Account is Suspended', 403));

  // const log = audit.createLogData(user._id, 'Authentication', 'Login');
  await audit.createAudit({
    _userId: user._id,
    _tenantId: user._tenantId,
    type: 'Authentication',
    action: 'Login',
    // requestBody: user,
    requestBody: { email },
  });

  sendAuthResponse(user, 200, res);
});

exports.loginMobile = catchAsync(async (req, res, next) => {
  const { type } = req.params;
  const { email, password } = req.body;
  const validTypes = ['super', 'tenant'];

  if (!email) return next(new AppError('Please provide email', 400));
  if (!password) return next(new AppError('Please provide password', 400));

  if (!validTypes.includes(type))
    return next(new AppError('Invalid type params', 400));
  const query = {
    ...generateLoginQuery(type),
    email,
  };

  const user = await User.findOne(query).select('+password').populate('_role');

  if (!user || !(await user.isPasswordCorrect(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  if (user.status === 'Suspended')
    return next(new AppError('Your Account is Suspended', 403));

  if (user.type !== 'Superadmin' && user.type !== 'Admin') {
    if (!checkMobileAccess(user))
      return next(new AppError('You do not have mobile app access!', 401));
  }

  if (user._role)
    await audit.createAudit({
      _userId: user._id,
      _tenantId: user._tenantId,

      type: 'Authentication',
      action: 'Login',
      requestBody: { email },
    });

  sendAuthResponse(user, 200, res);
});

exports.authenticate = catchAsync(async (req, res, next) => {
  const { authorization, s_auth } = req.headers;
  let sessionToken;
  let token;

  if (authorization && authorization.startsWith('Bearer'))
    token = authorization.split(' ')[1];
  if (s_auth) sessionToken = s_auth;

  if (!token || !sessionToken)
    return next(new AppError('Please login to continue', 401));

  const verifiedToken = _verifyToken(token);

  const user = await User.findById(verifiedToken.id).populate('_role');

  if (!user || user.status === 'Deleted')
    return next(
      new AppError('User no longer exist. Please login to continue', 404)
    );

  if (user.status === 'Suspended')
    return next(new AppError('Unauthorized. Account is Suspended', 403));

  if (!user.verifySession(sessionToken, token))
    return next(new AppError('Invalid session', 401));

  req.user = user;

  next();
});

exports.restrictToSpecifiedAccess = () => {
  return (req, res, next) => {
    if (['Admin'].includes(req.user.type)) {
      return next();
    }

    var hasAccess = req.user?._role?.access?.find(
      (i) => i.label === 'User Management'
    )?.hasAccess;

    if (hasAccess) {
      return next();
    }

    return next(
      new AppError('You do not have permission to perform this action', 403)
    );
  };
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.type)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    return next();
  };
};

exports.updateInfo = catchAsync(async (req, res, next) => {
  const pickField = [
    'firstName',
    'lastName',
    'middleName',
    'mobileNumber',
    'firebase_token',
  ];
  const filteredBody = _.pick(req.body, pickField);

  const user = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!user) return next(new AppError('User not found', 404));

  if (!_.isEmpty(filteredBody)) {
    await audit.createAudit({
      _userId: user._id,
      _tenantId: user._tenantId,

      type: 'User',
      action: 'Update',
      requestBody: filteredBody,
    });
  }

  sendAuthResponse(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, confirmNewPassword, newPassword } = req.body;

  if (!currentPassword)
    return next(new AppError('Please provide current password', 400));

  if (!newPassword)
    return next(new AppError('Please provide new password', 400));

  if (!confirmNewPassword)
    return next(new AppError('Please confirm new password', 400));

  const user = await User.findById(req.user._id).select('+password');

  if (!user || !(await user.isPasswordCorrect(currentPassword, user.password)))
    return next(new AppError('Incorrect current password', 401));

  user.password = newPassword;
  user.passwordConfirm = confirmNewPassword;

  await user.save();

  await audit.createAudit({
    _userId: req.user._id,
    _tenantId: user._tenantId,

    type: 'User',
    action: 'Update Password',
  });

  sendAuthResponse(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) return next(new AppError('Please provide email', 400));

  const user = await User.findOne({ email, status: { $ne: 'Deleted' } });

  if (!user) return next(new AppError('User not found', 404));

  if (user.status === 'Suspended')
    return next(new AppError('This account is suspended', 400));

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  await mailResetToken(user, resetToken);

  res.status(200).json({
    status: 'success',
    message: 'Reset password token has been sent to email',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  if (!password) return next(new AppError('Please provide new password', 400));

  if (!passwordConfirm)
    return next(new AppError('Please confirm new password', 400));

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
    status: { $ne: 'Deleted' },
  });

  if (!user)
    return next(
      new AppError('Password reset token is invalid or has expired', 400)
    );

  if (user === 'Suspended')
    return next(new AppError('Your Account is Suspended', 403));

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;

  await user.save();

  await audit.createAudit({
    _userId: user._id,
    _tenantId: user._tenantId,

    type: 'User',
    action: 'Reset Password',
  });

  res.status(200).json({
    status: 'success',
    env: {
      user,
    },
  });
});

exports.verifyResetPasswordToken = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
    status: { $ne: 'Deleted' },
  });

  if (!user) return next(new AppError('Invalid password reset token', 400));

  if (user === 'Suspended')
    return next(new AppError('Your Account is Suspended', 403));

  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;

  res.status(200).json({
    status: 'success',
    env: {
      user,
    },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await req.user.populate('_role');

  res.status(200).json({
    status: 'success',
    env: {
      user,
    },
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  await audit.createAudit({
    _userId: req.user._id,
    _tenantId: req.user._tenantId,
    type: 'Authentication',
    action: 'Logout',
  });

  res.status(200).json({
    status: 'success',
    token: '',
    session_token: '',
  });
});
