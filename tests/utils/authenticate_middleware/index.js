const { expect } = require('chai');
const { login } = require('../response');
const { callback } = require('../callbacks');
const { deleteOneUser } = require('../db');

exports.authenticateTest = (userCreds, userType, cb, ...params) => {
  const userLogin = { email: userCreds.email, password: 'password123' };

  const loginRes = login(userLogin, userType).then((res) => res);
  const token = loginRes.body.token;
  const sessionToken = loginRes.body.session_token;

  return {
    a: it('Should NOT update user info. NO AUTHORIZATION HEADER', async () => {
      const args = [...params, token, sessionToken];
      const response = await callback(cb, ...args);

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please login to continue');
    }),

    b: it('Should NOT update user info. NO SESSION AUTH HEADER', async () => {
      const args = [...params, token, sessionToken];
      const response = await callback(cb, ...args);

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please login to continue');
    }),

    c: it('Should NOT update user info. INVALID SESSION AUTH VALUE', async () => {
      const args = [...params, token, sessionToken];
      const response = await callback(cb, ...args);

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Invalid session');
    }),

    d: it('Should NOT update user info. DELETED USER', async () => {
      await deleteOneUser(userCreds._id);

      const args = [...params, token, sessionToken];
      const response = await callback(cb, ...args);

      expect(response.status).to.equal(404);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal(
        'User no longer exist. Please login to continue'
      );
    }),
  };
};
