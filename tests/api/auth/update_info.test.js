const { expect } = require('chai');
const {
  connect,
  disconnect,
  createSuperAdmin,
  deleteOneUser,
  deleteUsers,
} = require('../../utils/db');
const { login, updateInfo } = require('../../utils/response');
const { callback } = require('../../utils/callbacks');
require('dotenv').config();

describe('AUTH API UPDATE USER INFO ENDPOINT', async () => {
  let superAdmin;
  let token;
  let sessionToken;
  const newUserInfo = {
    firstName: 'newfirst',
    lastName: 'newlast',
    mobileNumber: '09987654321',
  };

  before(async () => {
    await connect();
    superAdmin = await createSuperAdmin();
    const userCreds = { email: superAdmin.email, password: 'password123' };
    const loginRes = await login(userCreds, 'super');
    token = loginRes.body.token;
    sessionToken = loginRes.body.session_token;
  });

  after(async () => {
    await deleteUsers();
    await disconnect();
  });

  it('Should update user info', async () => {
    const response = await updateInfo(newUserInfo, token, sessionToken);

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal('success');
    expect(response.body).to.have.property('token');
    expect(response.body).to.have.property('session_token');
    expect(response.body.env.user.firstName).to.equal(newUserInfo.firstName);
    expect(response.body.env.user.lastName).to.equal(newUserInfo.lastName);
    expect(response.body.env.user.mobileNumber).to.equal(
      newUserInfo.mobileNumber
    );
  });

  it('Should NOT update user info. NO AUTHORIZATION HEADER', async () => {
    const newUserInfo = {
      firstName: 'newfirst',
      lastName: 'newlast',
      mobileNumber: '09987654321',
    };
    const updateRes = await callback(updateInfo, newUserInfo, '', sessionToken);

    expect(updateRes.status).to.equal(401);
    expect(updateRes.body.status).to.equal('fail');
    expect(updateRes.body.message).to.equal('Please login to continue');
  });

  it('Should NOT update user info. NO SESSION AUTH HEADER', async () => {
    const newUserInfo = {
      firstName: 'newfirst',
      lastName: 'newlast',
      mobileNumber: '09987654321',
    };
    const updateRes = await callback(updateInfo, newUserInfo, token, '');

    expect(updateRes.status).to.equal(401);
    expect(updateRes.body.status).to.equal('fail');
    expect(updateRes.body.message).to.equal('Please login to continue');
  });

  it('Should NOT update user info. INVALID SESSION AUTH VALUE', async () => {
    const newUserInfo = {
      firstName: 'newfirst',
      lastName: 'newlast',
      mobileNumber: '09987654321',
    };
    const updateRes = await callback(updateInfo, newUserInfo, token, 'x_val');

    expect(updateRes.status).to.equal(401);
    expect(updateRes.body.status).to.equal('fail');
    expect(updateRes.body.message).to.equal('Invalid session');
  });

  it('Should NOT update user info. DELETED USER', async () => {
    await deleteOneUser(superAdmin._id);

    const newUserInfo = {
      firstName: 'newfirst',
      lastName: 'newlast',
      mobileNumber: '09987654321',
    };
    const updateRes = await callback(
      updateInfo,
      newUserInfo,
      token,
      sessionToken
    );

    expect(updateRes.status).to.equal(404);
    expect(updateRes.body.status).to.equal('fail');
    expect(updateRes.body.message).to.equal(
      'User no longer exist. Please login to continue'
    );
  });
});
