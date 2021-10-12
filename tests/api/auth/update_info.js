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
const { authenticateTest } = require('../../utils/authenticate_middleware');
require('dotenv').config();

describe('AUTH API UPDATE PASSWORD ENDPOINT', async () => {
  let superAdmin;
  const newUserInfo = {
    firstName: 'newfirst',
    lastName: 'newlast',
    mobileNumber: '09987654321',
  };

  before(async () => {
    await connect();
    superAdmin = await createSuperAdmin();
  });

  after(async () => {
    await deleteUsers();
    await disconnect();
  });

  it('Should update user info', async () => {
    const userCreds = { email: superAdmin.email, password: 'password123' };
    const loginRes = await login(userCreds, 'super');
    const token = loginRes.body.token;
    const sessionToken = loginRes.body.session_token;

    const updateRes = await updateInfo(newUserInfo, token, sessionToken);

    expect(updateRes.status).to.equal(200);
    expect(updateRes.body.status).to.equal('success');
    expect(updateRes.body).to.have.property('token');
    expect(updateRes.body).to.have.property('session_token');
    expect(updateRes.body.env.user.firstName).to.equal(newUserInfo.firstName);
    expect(updateRes.body.env.user.lastName).to.equal(newUserInfo.lastName);
    expect(updateRes.body.env.user.mobileNumber).to.equal(
      newUserInfo.mobileNumber
    );
  });

  // const a = authenticateTest(superAdmin, 'super', updateInfo, newUserInfo);
  // console.log(a);

  it('Should NOT update user info. NO AUTHORIZATION HEADER', async () => {
    const userCreds = { email: superAdmin.email, password: 'password123' };
    const loginRes = await login(userCreds, 'super');
    const sessionToken = loginRes.body.session_token;

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
    const userCreds = { email: superAdmin.email, password: 'password123' };
    const loginRes = await login(userCreds, 'super');
    const token = loginRes.body.token;

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
    const userCreds = { email: superAdmin.email, password: 'password123' };
    const loginRes = await login(userCreds, 'super');
    const token = loginRes.body.token;

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
    const userCreds = { email: superAdmin.email, password: 'password123' };
    const loginRes = await login(userCreds, 'super');
    const token = loginRes.body.token;
    const sessionToken = loginRes.body.session_token;
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
