const { expect } = require('chai');
const {
  connect,
  disconnect,
  createSuperAdmin,
  createAdmin,
  createUser,
  deleteOneUser,
  deleteUsers,
  getAdminUsers,
} = require('../../utils/db');
const { login, deleteUserAPI } = require('../../utils/response');
const { deleteUserCreds } = require('../../constants/users');

describe('USER API DELETE USER ENDPOINT', () => {
  let superAdmin;
  let admin;
  let user;
  let s_token;
  let s_session;
  let a_token;
  let a_session;

  before(async () => {
    await connect();

    superAdmin = await createSuperAdmin();
    admin = await createAdmin(superAdmin);

    const superCreds = { email: superAdmin.email, password: 'password123' };
    const adminCreds = { email: admin.email, password: 'password123' };
    const superLogin = await login(superCreds, 'super');
    const adminLogin = await login(adminCreds, 'tenant');

    s_token = superLogin.body.token;
    s_session = superLogin.body.session_token;
    a_token = adminLogin.body.token;
    a_session = adminLogin.body.session_token;
  });

  after(async () => {
    await deleteUsers();
    await disconnect();
  });

  const deleteUserTest = ({ type, label, users }) => {
    if (type === 'admins') {
      it(`Should delete ${label} and its child users`, async () => {
        const id = admin._id;

        for (let user of users)
          await createUser(superAdmin, admin, user.email, user.mobile);

        const response = await deleteUserAPI(type, id, s_token, s_session);
        const adminUsers = await getAdminUsers(admin._tenantId);

        expect(response.status).to.equal(204);
        for (let user of adminUsers) expect(user.status).to.equal('Suspended');
      });

      it(`Should NOT delete ${label} and its child users. DELETED PARENT(ADMIN)`, async () => {
        const id = admin._id;
        const response = await deleteUserAPI(type, id, s_token, s_session);

        expect(response.status).to.equal(404);
        expect(response.body.status).to.equal('fail');
        expect(response.body.message).to.equal('User not found');
      });
    } else {
      it(`Should delete ${label}`, async () => {
        const adminEmail = 'admin.corps@lgusuite.com';
        const adminMobile = '09147421582';

        admin = await createAdmin(superAdmin, adminEmail, adminMobile);
        user = await createUser(superAdmin, admin);

        const id = user._id;
        const adminCreds = { email: admin.email, password: 'password123' };
        const adminLogin = await login(adminCreds, 'tenant');

        a_token = adminLogin.body.token;
        a_session = adminLogin.body.session_token;

        const response = await deleteUserAPI(type, id, a_token, a_session);

        expect(response.status).to.equal(204);
      });

      it(`Should NOT update ${label}. DELETED ACCOUNT`, async () => {
        const id = user._id;
        const response = await deleteUserAPI(type, id, a_token, a_session);

        expect(response.status).to.equal(404);
        expect(response.body.status).to.equal('fail');
        expect(response.body.message).to.equal('User not found');
      });
    }

    it(`Should NOT create ${label}. NO AUTHORIZATION HEADER`, async () => {
      const session = type === 'admins' ? s_session : a_session;
      const id = type === 'admins' ? admin._id : superAdmin._id;

      const response = await deleteUserAPI(type, id, '', session);

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please login to continue');
    });

    it(`Should NOT create ${label}. NO SESSION AUTH HEADER`, async () => {
      const token = type === 'admins' ? s_token : a_token;
      const id = type === 'admins' ? admin._id : superAdmin._id;

      const response = await deleteUserAPI(type, id, token, '');

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please login to continue');
    });

    it(`Should NOT create ${label}. INVALID AUTH SESSION VALUE`, async () => {
      if (type === 'users') {
        const superEmail = 'super.corps@lgusuite.com';
        const superMobile = '09147421581';
        superAdmin = await createSuperAdmin(superEmail, superMobile);

        const superCreds = { email: superAdmin.email, password: 'password123' };
        const superLogin = await login(superCreds, 'super');

        s_token = superLogin.body.token;
        s_session = superLogin.body.session_token;
      }

      const token = s_token;
      const id = type === 'admins' ? admin._id : superAdmin._id;

      const response = await deleteUserAPI(type, id, token, 'x_val');

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Invalid session');
    });

    it(`Should NOT create ${label}. DELETED USER`, async () => {
      const token = s_token;
      const session = s_session;
      const id = type === 'admins' ? admin._id : superAdmin._id;

      await deleteOneUser(superAdmin._id);

      const response = await deleteUserAPI(type, id, token, session);

      expect(response.status).to.equal(404);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal(
        'User no longer exist. Please login to continue'
      );
    });
  };

  for (let user of deleteUserCreds) {
    deleteUserTest(user);
  }
});
