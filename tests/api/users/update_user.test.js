const { expect } = require('chai');
const {
  connect,
  disconnect,
  createSuperAdmin,
  createAdmin,
  createUser,
  deleteOneUser,
  deleteUsers,
} = require('../../utils/db');
const { login, updateUserAPI } = require('../../utils/response');
const { updateUserCreds } = require('../../constants/users');
require('dotenv').config();

describe('USER API UPDATE USER ENDPOINT', () => {
  let superAdmin;
  let admin;
  let user;
  let superToken;
  let superSession;
  let adminToken;
  let adminSession;

  before(async () => {
    await connect();
    superAdmin = await createSuperAdmin();
    const superCreds = { email: superAdmin.email, password: 'password123' };
    admin = await createAdmin(superAdmin);
    const adminCreds = { email: admin.email, password: 'password123' };
    user = await createUser(superAdmin, admin);
    const superLogin = await login(superCreds, 'super');
    const adminLogin = await login(adminCreds, 'tenant');

    superToken = superLogin.body.token;
    superSession = superLogin.body.session_token;
    adminToken = adminLogin.body.token;
    adminSession = adminLogin.body.session_token;
  });

  after(async () => {
    await deleteUsers();
    await disconnect();
  });

  const updateUserUnitTest = ({ data, type, label }) => {
    it(`Should update ${label}`, async () => {
      const token = type === 'admins' ? superToken : adminToken;
      const session = type === 'admins' ? superSession : adminSession;
      const id = type === 'admins' ? admin._id : user._id;

      const response = await updateUserAPI(data, type, id, token, session);

      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('success');
      expect(response.body.env).to.have.property('user');
    });

    it(`Should NOT update ${label}. USER NOT FOUND`, async () => {
      const token = type === 'admins' ? superToken : adminToken;
      const session = type === 'admins' ? superSession : adminSession;
      const id = type === 'admins' ? admin._id.toString() : user._id.toString();

      const wrongID = `${id.slice(0, id.length - 3)}cef`;

      const response = await updateUserAPI(data, type, wrongID, token, session);

      expect(response.status).to.equal(404);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('User not found');
    });

    it(`Should NOT update ${label}. WRONG USER TYPE`, async () => {
      let token;
      let session;
      let id;

      if (type === 'admins') {
        id = admin._id;
        const userCreds = { email: user.email, password: 'password123' };
        const userLogin = await login(userCreds, 'tenant');
        token = userLogin.body.token;
        session = userLogin.body.session_token;
      } else {
        id = user._id;
        const superEmail = 'super.corps@lgusuite.com';
        const superMobile = '09471829451';
        const newSuper = await createSuperAdmin(superEmail, superMobile);
        const superCreds = { email: newSuper.email, password: 'password123' };
        const superLogin = await login(superCreds, 'super');
        token = superLogin.body.token;
        session = superLogin.body.session_token;
      }

      const response = await updateUserAPI(data, type, id, token, session);

      expect(response.status).to.equal(403);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal(
        'You do not have permission to perform this action'
      );
    });

    it(`Should NOT create ${label}. NO AUTHORIZATION HEADER`, async () => {
      const session = type === 'admins' ? superSession : adminSession;
      const id = type === 'admins' ? admin._id : user._id;

      const response = await updateUserAPI(data, type, id, '', session);

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please login to continue');
    });

    it(`Should NOT create ${label}. NO SESSION AUTH HEADER`, async () => {
      const token = type === 'admins' ? superToken : adminToken;
      const id = type === 'admins' ? admin._id : user._id;

      const response = await updateUserAPI(data, type, id, token, '');

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please login to continue');
    });

    it(`Should NOT create ${label}. INVALID AUTH SESSION VALUE`, async () => {
      const token = type === 'admins' ? superToken : adminToken;
      const id = type === 'admins' ? admin._id : user._id;

      const response = await updateUserAPI(data, type, id, token, 'x_val');

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Invalid session');
    });

    it(`Should NOT create ${label}. DELETED USER`, async () => {
      const token = superToken;
      const session = superSession;
      const id = type === 'admins' ? admin._id : user._id;

      await deleteOneUser(superAdmin._id);

      const response = await updateUserAPI(data, type, id, token, session);

      expect(response.status).to.equal(404);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal(
        'User no longer exist. Please login to continue'
      );
    });
  };

  for (let data of updateUserCreds) {
    const userData = { ...data };

    updateUserUnitTest(userData);
  }
});
