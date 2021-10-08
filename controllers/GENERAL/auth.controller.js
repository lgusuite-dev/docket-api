const User = require('../../models/GENERAL/user.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const {
  _signToken,
  _verifyToken,
  _createSessionToken,
} = require('../../utils/tokens');

const generateLoginQuery = (type) => {
  if (type === 'super')
    return { type: 'Superadmin', status: { $ne: 'Deleted' } };
  if (type === 'admin') return { type: 'Admin', status: { $ne: 'Deleted' } };
  if (type === 'user') return { type: 'User', status: { $ne: 'Deleted' } };
};

exports.login = catchAsync(async (req, res, next) => {
  const { type } = req.params;
  const { email, password } = req.body;
  const validTypes = ['super', 'admin', 'user'];

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

  const token = _signToken({ id: user._id });
  const session_token = _createSessionToken(user, token);

  user.password = undefined;

  res.status(200).json({
    status: 'success',
    session_token,
    token,
    env: {
      user,
    },
  });
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

  const user = await User.findById(verifiedToken.id);

  if (!user) return next(new AppError('User no longer exist', 404));

  if (!user.verifySession(sessionToken, token))
    return next(new AppError('Invalid session', 401));

  req.user = user;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.type))
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );

    next();
  };
};
