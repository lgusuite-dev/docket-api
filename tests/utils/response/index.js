const supertest = require('supertest');
const app = require('../../../app');
const request = supertest(app);
const User = require('../../../models/GENERAL/user.model');

exports.login = async (data, type) =>
  request.post(`/api/v1/auth/login/${type}`).send(data);

exports.updateInfo = (data, token = '', session_token = '') =>
  request
    .put('/api/v1/auth/update-info')
    .send(data)
    .set('Authorization', `Bearer ${token}`)
    .set('s_auth', session_token);

exports.updatePassword = (data, token = '', session_token = '') =>
  request
    .put('/api/v1/auth/update-password')
    .send(data)
    .set('Authorization', `Bearer ${token}`)
    .set('s_auth', session_token);
