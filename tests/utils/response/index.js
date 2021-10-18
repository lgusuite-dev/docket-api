const supertest = require('supertest');
const app = require('../../../app');
const request = supertest(app);

exports.login = (data, type) =>
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

exports.forgotPassword = (data) =>
  request.post('/api/v1/auth/forgot-password').send(data);

exports.resetPassword = (data, token) =>
  request.put(`/api/v1/auth/reset-password/${token}`).send(data);

exports.verifyRPToken = (token) =>
  request.get(`/api/v1/auth/reset-password/${token}`);

exports.getMe = (token = '', session_token = '') =>
  request
    .get('/me')
    .set('Authorization', `Bearer ${token}`)
    .set('s_auth', session_token);

exports.createUserAPI = (data, type, token = '', session_token = '') =>
  request
    .post(`/api/v1/tenants/${type}`)
    .send(data)
    .set('Authorization', `Bearer ${token}`)
    .set('s_auth', session_token);

exports.updateUserAPI = (data, type, id, token = '', session_token = '') =>
  request
    .put(`/api/v1/tenants/${type}/${id}`)
    .send(data)
    .set('Authorization', `Bearer ${token}`)
    .set('s_auth', session_token);
