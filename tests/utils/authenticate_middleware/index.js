const { expect } = require('chai');
const { login } = require('../response/index');
const { callback } = require('../callbacks');
const { deleteOneUser } = require('../db');

exports.authenticateTest = async (userCreds, userType, cb, ...params) => {
  const userLogin = { email: userCreds.email, password: 'password123' };
  const loginRes = await login(userLogin, userType);
  const token = loginRes.body.token;
  const sessionToken = loginRes.body.session_token;
  const args = [...params, token, sessionToken];

  it('Should NOT update user info. NO AUTHORIZATION HEADER', async () => {
    const response = await callback(cb, ...args);

    expect(response.status).to.equal(401);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please login to continue');
  });

  it('Should NOT update user info. NO SESSION AUTH HEADER', async () => {
    const response = await callback(cb, ...args);

    expect(response.status).to.equal(401);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please login to continue');
  });

  it('Should NOT update user info. INVALID SESSION AUTH VALUE', async () => {
    const response = await callback(cb, ...args);

    expect(response.status).to.equal(401);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Invalid session');
  });

  it('Should NOT update user info. DELETED USER', async () => {
    await deleteOneUser(userCreds._id);
    const response = await callback(cb, ...args);

    expect(response.status).to.equal(404);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal(
      'User no longer exist. Please login to continue'
    );
  });
};
