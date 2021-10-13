const sgMail = require('@sendgrid/mail');
const { expect } = require('chai');

const {
  connect,
  disconnect,
  createAdmin,
  createSuperAdmin,
  deleteOneUser,
  deleteUsers,
} = require('../../utils/db');
const { login, createUserAPI } = require('../../utils/response');
const { userCreds } = require('../../constants/users');
require('dotenv').config();

describe('USER API CREATE ADMIN ENDPOINT', () => {
  let superAdmin;
  let admin;
  let token;
  let sessionToken;
  let adminToken;
  let adminSessionToken;

  before(async () => {
    sgMail.setApiKey(process.env.SEND_GRID_APIKEY);
    await connect();
    superAdmin = await createSuperAdmin();
    const loginSuper = { email: superAdmin.email, password: 'password123' };
    admin = await createAdmin(superAdmin);
    const loginAdmin = { email: admin.email, password: 'password123' };
    const responseSuper = await login(loginSuper, 'super');
    const responseAdmin = await login(loginAdmin, 'admin');

    token = responseSuper.body.token;
    sessionToken = responseSuper.body.session_token;
    adminToken = responseAdmin.body.token;
    adminSessionToken = responseAdmin.body.session_token;
  });

  after(async () => {
    await deleteUsers();
    await disconnect();
  });

  const createUserUnitTest = ({ creds, type, label, key }) => {
    it(`Should create ${label}`, async () => {
      const newAdmin = { ...creds };
      const s_auth = type === 'admins' ? token : adminToken;
      const s_token = type === 'admins' ? sessionToken : adminSessionToken;

      const response = await createUserAPI(newAdmin, type, s_auth, s_token);

      expect(response.status).to.equal(201);
      expect(response.body.status).to.equal('success');
      expect(response.body.env).to.have.property('user');
    });

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

    it(`Should NOT create  ${label}. WRONG USER TYPE`, async () => {
      let user;
      let loginResponse;
      let token;
      let sessionToken;
      const newAdmin = { ...creds };

      if (type === 'admins') {
        const adminEmail = 'joshua.admin1@lgusuite.com';
        user = await createAdmin(superAdmin, adminEmail);
        const loginAdmin = { email: user.email, password: 'password123' };
        loginResponse = await login(loginAdmin, 'admin');
        token = loginResponse.body.token;
        sessionToken = loginResponse.body.session_token;
      } else {
        const superEmail = 'joshua.super@lgusuite.com';
        user = await createSuperAdmin(superEmail);
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

  for (let data of userCreds) {
    createUserUnitTest(data);
  }

  // it(`Should NOT create admin. NO FIRST NAME`, async () => {
  //   const newAdmin = { ...adminData };
  //   newAdmin.firstName = undefined;

  //   const response = await createUserAPI(
  //     newAdmin,
  //     'admins',
  //     token,
  //     sessionToken
  //   );

  //   expect(response.status).to.equal(400);
  //   expect(response.body.status).to.equal('fail');
  //   expect(response.body.message).to.equal('Please provide first name');
  // });

  // it(`Should NOT create admin. NO LAST NAME`, async () => {
  //   const newAdmin = { ...adminData };
  //   newAdmin.lastName = undefined;

  //   const response = await createUserAPI(
  //     newAdmin,
  //     'admins',
  //     token,
  //     sessionToken
  //   );

  //   expect(response.status).to.equal(400);
  //   expect(response.body.status).to.equal('fail');
  //   expect(response.body.message).to.equal('Please provide last name');
  // });

  // it(`Should NOT create admin. NO EMAIL`, async () => {
  //   const newAdmin = { ...adminData };
  //   newAdmin.email = undefined;

  //   const response = await createUserAPI(
  //     newAdmin,
  //     'admins',
  //     token,
  //     sessionToken
  //   );

  //   expect(response.status).to.equal(400);
  //   expect(response.body.status).to.equal('fail');
  //   expect(response.body.message).to.equal('Please provide email');
  // });

  // it(`Should NOT create admin. WRONG EMAIL FORMAT`, async () => {
  //   const newAdmin = { ...adminData };
  //   newAdmin.email = 'wrongemailformat.com';

  //   const response = await createUserAPI(
  //     newAdmin,
  //     'admins',
  //     token,
  //     sessionToken
  //   );

  //   expect(response.status).to.equal(400);
  //   expect(response.body.status).to.equal('fail');
  //   expect(response.body.message).to.equal('Please provide valid email');
  // });

  // it(`Should NOT create admin. WRONG USER TYPE`, async () => {
  //   const newAdmin = { ...adminData };
  //   const admin = await createAdmin(superAdmin);
  //   const loginCreds = { email: admin.email, password: 'password123' };
  //   const loginRes = await login(loginCreds, 'admin');
  //   const token = loginRes.body.token;
  //   const sessionToken = loginRes.body.session_token;

  //   const response = await createUserAPI(
  //     newAdmin,
  //     'admins',
  //     token,
  //     sessionToken
  //   );

  //   expect(response.status).to.equal(403);
  //   expect(response.body.status).to.equal('fail');
  //   expect(response.body.message).to.equal(
  //     'You do not have permission to perform this action'
  //   );
  // });

  // it(`Should NOT create user. NO AUTHORIZATION HEADER`, async () => {
  //   const newAdmin = { ...adminData };

  //   const response = await createUserAPI(newAdmin, 'admins', '', sessionToken);

  //   expect(response.status).to.equal(401);
  //   expect(response.body.status).to.equal('fail');
  //   expect(response.body.message).to.equal('Please login to continue');
  // });

  // it(`Should NOT create user. NO SESSION AUTH HEADER`, async () => {
  //   const newAdmin = { ...adminData };

  //   const response = await createUserAPI(newAdmin, 'admins', token, '');

  //   expect(response.status).to.equal(401);
  //   expect(response.body.status).to.equal('fail');
  //   expect(response.body.message).to.equal('Please login to continue');
  // });

  // it(`Should NOT create user. INVALID SESSION AUTH VALUE`, async () =>
  //   const newAdmin = { ...adminData };

  //   const response = await createUserAPI(newAdmin, 'admins', token, 'x_val');

  //   expect(response.status).to.equal(401);
  //   expect(response.body.status).to.equal('fail');
  //   expect(response.body.message).to.equal('Invalid session');
  // });

  // it(`Should NOT create user. DELETED USER`, async () => {
  //   const newAdmin = { ...adminData };

  //   await deleteOneUser(superAdmin._id);

  //   const response = await createUserAPI(
  //     newAdmin,
  //     'admins',
  //     token,
  //     sessionToken
  //   );

  //   expect(response.status).to.equal(404);
  //   expect(response.body.status).to.equal('fail');
  //   expect(response.body.message).to.equal(
  //     'User no longer exist. Please login to continue'
  //   );
  // });
});
