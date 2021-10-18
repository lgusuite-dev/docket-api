const { expect } = require('chai');
const {
  connect,
  disconnect,
  createSuperAdmin,
  deleteOneUser,
  deleteUsers,
} = require('../../utils/db');
const { login, logout } = require('../../utils/response');

describe('AUTH API LOGOUT ENDPOINT', () => {
  let superAdmin;
  let token;
  let session;

  before(async () => {
    await connect();
    superAdmin = await createSuperAdmin();
    const userCreds = { email: superAdmin.email, password: 'password123' };
    const response = await login(userCreds, 'super');
    token = response.body.token;
    session = response.body.session_token;
  });

  after(async () => {
    await deleteUsers();
    await disconnect();
  });

  it('Should logout user', async () => {
    const response = await logout(token, session);

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal('success');
    expect(response.body.token).to.equal('');
    expect(response.body.session_token).to.equal('');
  });

  it(`Should NOT create user. NO AUTHORIZATION HEADER`, async () => {
    const response = await logout('', session);

    expect(response.status).to.equal(401);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please login to continue');
  });

  it(`Should NOT create user. NO SESSION AUTH HEADER`, async () => {
    const response = await logout(token, '');

    expect(response.status).to.equal(401);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please login to continue');
  });

  it(`Should NOT create user. INVALID AUTH SESSION VALUE`, async () => {
    const response = await logout(token, 'x_val');

    expect(response.status).to.equal(401);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Invalid session');
  });

  it(`Should NOT create user. DELETED USER`, async () => {
    await deleteOneUser(superAdmin._id);

    const response = await logout(token, session);

    expect(response.status).to.equal(404);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal(
      'User no longer exist. Please login to continue'
    );
  });
});
