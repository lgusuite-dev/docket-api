const { expect } = require('chai');

const {
  connect,
  disconnect,
  createAdmin,
  createUser,
  createSuperAdmin,
  deleteOneUser,
  deleteUsers,
} = require('../../utils/db');
const { login, createUserAPI } = require('../../utils/response');
const { userCreds } = require('../../constants/users');
require('dotenv').config();

describe('USER API CREATE USER ENDPOINT', () => {
  let superAdmin;
  let admin;
  let token;
  let sessionToken;
  let adminToken;
  let adminSessionToken;

  before(async () => {
    await connect();
    superAdmin = await createSuperAdmin();
    const loginSuper = { email: superAdmin.email, password: 'password123' };
    admin = await createAdmin(superAdmin);
    const loginAdmin = { email: admin.email, password: 'password123' };
    const responseSuper = await login(loginSuper, 'super');
    const responseAdmin = await login(loginAdmin, 'tenant');

    token = responseSuper.body.token;
    sessionToken = responseSuper.body.session_token;
    adminToken = responseAdmin.body.token;
    adminSessionToken = responseAdmin.body.session_token;
  });

  after(async () => {
    await deleteUsers();
    await disconnect();
  });

  const createUserUnitTest = ({ creds, type, label }) => {
    it(`Should create ${label}`, async () => {
      const newAdmin = { ...creds };
      const s_auth = type === 'admins' ? token : adminToken;
      const s_token = type === 'admins' ? sessionToken : adminSessionToken;

      const response = await createUserAPI(newAdmin, type, s_auth, s_token);

      expect(response.status).to.equal(201);
      expect(response.body.status).to.equal('success');
      expect(response.body.env).to.have.property('user');
    });

    if (type === 'users') {
      it(`Type ${label} can create another User`, async () => {
        const newAdmin = { ...creds };
        newAdmin.email = 'corps.user10@lgusuite.com';
        newAdmin.mobileNumber = '09473938294';

        const user = await createUser(superAdmin, admin);
        const userCreds = { email: user.email, password: 'password123' };
        const userLogin = await login(userCreds, 'tenant');
        const token = userLogin.body.token;
        const s_token = userLogin.body.session_token;

        const response = await createUserAPI(newAdmin, type, token, s_token);

        expect(response.status).to.equal(201);
        expect(response.body.status).to.equal('success');
        expect(response.body.env).to.have.property('user');
      });
    }

    it(`Should NOT create  ${label}. NO FIRST NAME`, async () => {
      const newAdmin = { ...creds };
      const s_auth = type === 'admins' ? token : adminToken;
      const s_token = type === 'admins' ? sessionToken : adminSessionToken;
      newAdmin.firstName = undefined;

      const response = await createUserAPI(newAdmin, type, s_auth, s_token);

      expect(response.status).to.equal(400);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please provide first name');
    });

    it(`Should NOT create  ${label}. NO LAST NAME`, async () => {
      const newAdmin = { ...creds };
      const s_auth = type === 'admins' ? token : adminToken;
      const s_token = type === 'admins' ? sessionToken : adminSessionToken;
      newAdmin.lastName = undefined;

      const response = await createUserAPI(newAdmin, type, s_auth, s_token);

      expect(response.status).to.equal(400);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please provide last name');
    });

    it(`Should NOT create  ${label}. NO EMAIL`, async () => {
      const newAdmin = { ...creds };
      const s_auth = type === 'admins' ? token : adminToken;
      const s_token = type === 'admins' ? sessionToken : adminSessionToken;
      newAdmin.email = undefined;

      const response = await createUserAPI(newAdmin, type, s_auth, s_token);

      expect(response.status).to.equal(400);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please provide email');
    });

    it(`Should NOT create  ${label}. WRONG EMAIL FORMAT`, async () => {
      const newAdmin = { ...creds };
      const s_auth = type === 'admins' ? token : adminToken;
      const s_token = type === 'admins' ? sessionToken : adminSessionToken;
      newAdmin.email = 'wrongemailformat.com';

      const response = await createUserAPI(newAdmin, type, s_auth, s_token);

      expect(response.status).to.equal(400);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please provide valid email');
    });

    it(`Should NOT create  ${label}. NO SEX`, async () => {
      const newAdmin = { ...creds };
      const s_auth = type === 'admins' ? token : adminToken;
      const s_token = type === 'admins' ? sessionToken : adminSessionToken;
      newAdmin.sex = undefined;

      const response = await createUserAPI(newAdmin, type, s_auth, s_token);

      expect(response.status).to.equal(400);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please provide sex');
    });

    it(`Should NOT create  ${label}. INVALID SEX VALUE`, async () => {
      const newAdmin = { ...creds };
      const s_auth = type === 'admins' ? token : adminToken;
      const s_token = type === 'admins' ? sessionToken : adminSessionToken;
      newAdmin.sex = '123';
      const message =
        '`' + newAdmin.sex + '`' + ' is not a valid enum value for path `sex`.';

      const response = await createUserAPI(newAdmin, type, s_auth, s_token);

      expect(response.status).to.equal(400);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal(message);
    });

    it(`Should NOT create ${label}. INVALID USER TYPE`, async () => {
      let user;
      let loginResponse;
      let token;
      let sessionToken;
      const newAdmin = { ...creds };

      if (type === 'admins') {
        const adminEmail = 'joshua.admin1@lgusuite.com';
        const adminMobile = '09341958481';
        user = await createAdmin(superAdmin, adminEmail, adminMobile);
        const loginAdmin = { email: user.email, password: 'password123' };
        loginResponse = await login(loginAdmin, 'tenant');
        token = loginResponse.body.token;
        sessionToken = loginResponse.body.session_token;
      } else {
        const superEmail = 'joshua.super@lgusuite.com';
        const superMobile = '09487462194';
        user = await createSuperAdmin(superEmail, superMobile);
        const loginSuper = { email: user.email, password: 'password123' };
        loginResponse = await login(loginSuper, 'super');
        token = loginResponse.body.token;
        sessionToken = loginResponse.body.session_token;
      }

      const response = await createUserAPI(newAdmin, type, token, sessionToken);

      expect(response.status).to.equal(403);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal(
        'You do not have permission to perform this action'
      );
    });

    it(`Should NOT create ${label}. NO AUTHORIZATION HEADER`, async () => {
      const newAdmin = { ...creds };

      const response = await createUserAPI(newAdmin, type, '', sessionToken);

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please login to continue');
    });

    it(`Should NOT create ${label}. NO SESSION AUTH HEADER`, async () => {
      const newAdmin = { ...creds };

      const response = await createUserAPI(newAdmin, type, token, '');

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please login to continue');
    });

    it(`Should NOT create ${label}. INVALID AUTH SESSION VALUE`, async () => {
      const newAdmin = { ...creds };
      const s_auth = type === 'admins' ? token : adminToken;

      const response = await createUserAPI(newAdmin, type, s_auth, 'x_val');

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Invalid session');
    });

    it(`Should NOT create ${label}. DELETED USER`, async () => {
      const newAdmin = { ...creds };

      await deleteOneUser(superAdmin._id);

      const response = await createUserAPI(newAdmin, type, token, sessionToken);

      expect(response.status).to.equal(404);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal(
        'User no longer exist. Please login to continue'
      );
    });
  };

  for (let data of userCreds) createUserUnitTest(data);
});
