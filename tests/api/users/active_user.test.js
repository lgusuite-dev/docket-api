const { expect } = require('chai');
const {
  connect,
  disconnect,
  createSuperAdmin,
  createAdmin,
  createSuspendedUser,
  createSuspendedAdmin,
  deleteOneUser,
  deleteUsers,
  getAdminUsers,
} = require('../../utils/db');
const { login, patchUserAPI } = require('../../utils/response');
const { suspendActiveUsers } = require('../../constants/users');

describe('USER API ACTIVE USER ENDPOINT', () => {
  const act = 'active';
  let superAdmin;
  let admin;
  let suspendedAdmin;
  let user;
  let s_token;
  let s_session;
  let a_token;
  let a_session;

  before(async () => {
    await connect();

    superAdmin = await createSuperAdmin();
    admin = await createAdmin(superAdmin);
    suspendedAdmin = await createSuspendedAdmin(superAdmin);

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

  const suspendUserTest = ({ type, label, users }) => {
    it(`Should NOT active ${label} and its child users. INVALID USER TYPE`, async () => {
      if (type === 'users') {
        const superEmail = 'corps.superadmin@lgusuite.com';
        const superMobile = '09164521956';

        superAdmin = await createSuperAdmin(superEmail, superMobile);
        const superCreds = { email: superAdmin.email, password: 'password123' };
        const superLogin = await login(superCreds, 'super');
        s_token = superLogin.body.token;
        s_session = superLogin.body.session_token;
      }

      const id = admin._id;
      const token = type === 'admins' ? a_token : s_token;
      const session = type === 'admins' ? a_session : s_session;

      const response = await patchUserAPI(type, id, act, token, session);

      expect(response.status).to.equal(403);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal(
        'You do not have permission to perform this action'
      );
    });

    if (type === 'admins') {
      it(`Should active ${label} and its child users`, async () => {
        const id = suspendedAdmin._id;
        const token = s_token;
        const session = s_session;

        for (let user of users)
          await createSuspendedUser(
            superAdmin,
            suspendedAdmin,
            user.email,
            user.mobile
          );

        const response = await patchUserAPI(type, id, act, token, session);
        const adminUsers = await getAdminUsers(admin._tenantId);

        expect(response.status).to.equal(200);
        expect(response.body.status).to.equal('success');
        for (let user of adminUsers) expect(user.status).to.equal('Active');
      });

      it(`Should NOT active ${label} and its child users. ADMIN ALREADY ACTIVE`, async () => {
        const id = suspendedAdmin._id;
        const token = s_token;
        const session = s_session;

        const response = await patchUserAPI(type, id, act, token, session);

        expect(response.status).to.equal(400);
        expect(response.body.status).to.equal('fail');
        expect(response.body.message).to.equal(
          'This account is already active'
        );
      });
    } else {
      it(`Should active ${label}`, async () => {
        const adminEmail = 'admin.corps@lgusuite.com';
        const adminMobile = '09147421582';

        admin = await createAdmin(superAdmin, adminEmail, adminMobile);
        user = await createSuspendedUser(superAdmin, admin);

        const id = user._id;
        const adminCreds = { email: admin.email, password: 'password123' };
        const adminLogin = await login(adminCreds, 'tenant');

        const token = (a_token = adminLogin.body.token);
        const session = (a_session = adminLogin.body.session_token);

        const response = await patchUserAPI(type, id, act, token, session);

        expect(response.status).to.equal(200);
        expect(response.body.status).to.equal('success');
      });

      it(`Should NOT active ${label}. USER ALREADY ACTIVE`, async () => {
        const id = user._id;
        const token = a_token;
        const session = a_session;

        const response = await patchUserAPI(type, id, act, token, session);

        expect(response.status).to.equal(400);
        expect(response.body.status).to.equal('fail');
        expect(response.body.message).to.equal(
          'This account is already active'
        );
      });
    }

    it(`Should NOT active ${label}. NO AUTHORIZATION HEADER`, async () => {
      const session = type === 'admins' ? s_session : a_session;
      const id = type === 'admins' ? admin._id : superAdmin._id;

      const response = await patchUserAPI(type, id, act, '', session);

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please login to continue');
    });

    it(`Should NOT active ${label}. NO SESSION AUTH HEADER`, async () => {
      const token = type === 'admins' ? s_token : a_token;
      const id = type === 'admins' ? admin._id : superAdmin._id;

      const response = await patchUserAPI(type, id, act, token, '');

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please login to continue');
    });

    it(`Should NOT active ${label}. INVALID AUTH SESSION VALUE`, async () => {
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

      const response = await patchUserAPI(type, id, act, token, 'x_val');

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Invalid session');
    });

    it(`Should NOT active ${label}. DELETED USER`, async () => {
      const token = s_token;
      const session = s_session;
      const id = type === 'admins' ? admin._id : superAdmin._id;

      await deleteOneUser(superAdmin._id);

      const response = await patchUserAPI(type, id, act, token, session);

      expect(response.status).to.equal(404);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal(
        'User no longer exist. Please login to continue'
      );
    });
  };

  for (let user of suspendActiveUsers) suspendUserTest(user);
});
