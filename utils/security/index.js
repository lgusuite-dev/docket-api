const AppError = require('../../utils/errors/AppError');

const allowedOrigins = [
  // 'https://docket-ph.herokuapp.com',
  // 'https://docket-clone.herokuapp.com',
  // 'https://docket-ph-staging.herokuapp.com',
  // 'https://docket-ph-development.herokuapp.com',
  // 'https://docket-batac.herokuapp.com',
  'https://uvtmymwarz.ap-southeast-1.awsapprunner.com',
  'https://www.lgudocket.com',
  'http://localhost:4200',
  'http://localhost:8100',
  'http://localhost:8101',
  'http://localhost:4201',
  'http://localhost',
];

exports.origin = function (origin, callback) {
  if (!origin) return callback(null, true);

  if (allowedOrigins.indexOf(origin) === -1) {
    const message = `This site ${origin} doesn't have a permission to access this site.`;
    return callback(new AppError(message, 403), false);
  }
  return callback(null, true);
};

exports.whitelist = ['process', 'status', 'populate', 'popField'];
