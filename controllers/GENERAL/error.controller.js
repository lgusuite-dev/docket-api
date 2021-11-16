const AppError = require('../../utils/errors/AppError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} value`;

  return new AppError(message, 400);
};

const handleDuplicateDataErrorDB = (err) => {
  // search for the value that inside of a quoute ("")
  const value = err.message.match(/(["'])(\\?.)*?\1/);
  const message = `${Object.keys(err.keyPattern)[0]} ${
    value[0]
  } already exist.`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `${errors.join('.\n')}`;

  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token!', 401);

const handleJSONLimitSize = (err) => {
  const message = `JSON limit size reached. Allowed size: <= ${err.limit}kb`;

  return new AppError(message, 400);
};

const handleJWTExpiredError = () => new AppError('Expired token!', 401);

const handleInvalidCSRFToken = () =>
  new AppError('Invalid session. Please login to continue!', 401);

const devError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const prodError = (err, res) => {
  // predicted errors, trusted errors
  if (err.isKnownError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  console.error('Error', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong! Please try again later!',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    devError(err, res);
  } else if (
    process.env.NODE_ENV === 'production' ||
    process.env.NODE_ENV === 'test'
  ) {
    let error = { ...err };
    error.name = err.name;
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateDataErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'PayloadTooLargeError')
      error = handleJSONLimitSize(error);
    if (error.code === 'EBADCSRFTOKEN') error = handleInvalidCSRFToken();

    prodError(error, res);
  }
};
