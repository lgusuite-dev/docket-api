const { expect } = require('chai');
const {
  connect,
  disconnect,
  createSuperAdmin,
  deleteOneUser,
  deleteUsers,
} = require('../../utils/db');
const { login } = require('../../utils/response');
const { updatePassword } = require('../../utils/response');
const { userPassData } = require('../../constants/auth');

describe('AUTH API UPDATE USER PASSWORD ENDPOINT', () => {
  let superAdmin;
  let token;
  let sessionToken;

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

  it('Should update user passwords', async () => {
    const response = await updatePassword(userPassData, token, sessionToken);

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal('success');
    expect(response.body).to.have.property('token');
    expect(response.body).to.have.property('session_token');
  });

  it('Should NOT update user passwords. WRONG CURRENT PASSWORD', async () => {
    const response = await updatePassword(userPassData, token, sessionToken);

    expect(response.status).to.equal(401);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Incorrect current password');
  });

  it('Should NOT update user passwords. NO CURRENT PASSWORD', async () => {
    const userPass = { ...userPassData };
    userPass.currentPassword = undefined;

    const response = await updatePassword(userPass, token, sessionToken);

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please provide current password');
  });

  it('Should NOT update user passwords. NO NEW PASSWORD', async () => {
    const userPass = { ...userPassData };
    userPass.newPassword = undefined;

    const response = await updatePassword(userPass, token, sessionToken);

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please provide new password');
  });

  it('Should NOT update user passwords. PASSWORD NOT CONFIRM', async () => {
    const userPass = { ...userPassData };
    userPass.confirmNewPassword = undefined;

    const response = await updatePassword(userPass, token, sessionToken);

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please confirm new password');
  });

  it('Should NOT update user passwords. NEW PASSWORD NOT MATCH', async () => {
    const userPass = { ...userPassData };
    userPass.currentPassword = '123password';
    userPass.confirmNewPassword = 'some_password';

    const response = await updatePassword(userPass, token, sessionToken);

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal("Password don't match");
  });

  it('Should NOT update user info. NO AUTHORIZATION HEADER', async () => {
    const updateRes = await updatePassword(userPassData, '', sessionToken);

    expect(updateRes.status).to.equal(401);
    expect(updateRes.body.status).to.equal('fail');
    expect(updateRes.body.message).to.equal('Please login to continue');
  });

  it('Should NOT update user info. NO SESSION AUTH HEADER', async () => {
    const updateRes = await updatePassword(userPassData, token, '');

    expect(updateRes.status).to.equal(401);
    expect(updateRes.body.status).to.equal('fail');
    expect(updateRes.body.message).to.equal('Please login to continue');
  });

  it('Should NOT update user info. INVALID SESSION AUTH VALUE', async () => {
    const updateRes = await updatePassword(userPassData, token, 'x_val');

    expect(updateRes.status).to.equal(401);
    expect(updateRes.body.status).to.equal('fail');
    expect(updateRes.body.message).to.equal('Invalid session');
  });

  it('Should NOT update user info. DELETED USER', async () => {
    await deleteOneUser(superAdmin._id);

    const updateRes = await updatePassword(userPassData, token, sessionToken);

    expect(updateRes.status).to.equal(404);
    expect(updateRes.body.status).to.equal('fail');
    expect(updateRes.body.message).to.equal(
      'User no longer exist. Please login to continue'
    );
  });
});
