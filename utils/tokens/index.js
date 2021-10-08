const crypto = require('crypto');
const jwt = require('jsonwebtoken');

exports._signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports._verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

exports._createSessionToken = (user, token) => {
  const verifiedToken = this._verifyToken(token);

  const csrf_token = `<${user._id}+${user.email}+${verifiedToken.exp}+${verifiedToken.iat}>`;

  return crypto.createHash('sha256').update(csrf_token).digest('hex');
};

exports._generateRandomPassword = (length = 8) => {
  if (process.env.NODE_ENV === 'development') return '123qweasdzxc';

  // generate random password
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPassword = '';

  for (let i = 0, n = charset.length; i < length; ++i) {
    randomPassword += charset.charAt(Math.floor(Math.random() * n));
  }
  return randomPassword;
};
