const sgMail = require('@sendgrid/mail');
const { expect } = require('chai');

const {
  connect,
  disconnect,
  createSuperAdmin,
  createAdmin,
  createUser,
  createSuspendedAdmin,
  createDeletedAdmin,
  createDeletedUser,
  deleteUsers,
} = require('../../utils/db');
const { login } = require('../../utils/response');
const { authData } = require('../../constants/auth');

require('dotenv').config();

describe('AUTH API LOGIN ENDPOINT', () => {
  let superAdmin;

  before(async () => {
    sgMail.setApiKey(process.env.SEND_GRID_APIKEY);
    await connect();
    superAdmin = await createSuperAdmin();
    await createAdmin(superAdmin);
    await createUser(superAdmin);
  });

  after(async () => {
    await deleteUsers();
    await disconnect();
  });

  const authUnitTest = (type, creds) => {
    it(`Should login the ${type}`, async () => {
      const response = await login(creds, type);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('token');
      expect(response.body).to.have.property('session_token');
      expect(response.body.status).to.equal('success');
    });

    it(`Should NOT login the ${type}. WRONG CREDENTIALS`, async () => {
      const user = { ...creds };
      user.password = 'wrong_password';

      const response = await login(user, type);

      expect(response.status).to.equal(401);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Incorrect email or password');
    });

    it(`Should NOT login the ${type}. NO EMAIL`, async () => {
      const user = { ...creds };
      user.email = undefined;

      const response = await login(user, type);

      expect(response.status).to.equal(400);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please provide email');
    });

    it(`Should NOT login the ${type}. NO PASSWORD`, async () => {
      const user = { ...creds };
      user.password = undefined;

      const response = await login(user, type);

      expect(response.status).to.equal(400);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Please provide password');
    });

    it(`Should NOT login the ${type}. INVALID LOGIN ENDPOINT`, async () => {
      const user = { ...creds };

      const response = await login(user, 'random');

      expect(response.status).to.equal(400);
      expect(response.body.status).to.equal('fail');
      expect(response.body.message).to.equal('Invalid type params');
    });

    if (type === 'admin' || type === 'user') {
      it(`Should NOT login the ${type}. DELETED ACCOUNT`, async () => {
        let deletedUser;

        if (type === 'admin')
          deletedUser = await createDeletedAdmin(superAdmin);
        else deletedUser = await createDeletedUser(superAdmin);

        const userCreds = {
          email: deletedUser.email,
          password: 'password123',
        };

        const response = await login(userCreds, type);

        expect(response.status).to.equal(401);
        expect(response.body.status).to.equal('fail');
        expect(response.body.message).to.equal('Incorrect email or password');
      });
    }

    if (type === 'admin') {
      it(`Should NOT login the ${type}. SUSPENDED ACCOUNT`, async () => {
        const suspendedAdmin = await createSuspendedAdmin(superAdmin);

        const adminCreds = {
          email: suspendedAdmin.email,
          password: 'password123',
        };

        const response = await login(adminCreds, 'admin');

        expect(response.status).to.equal(403);
        expect(response.body.status).to.equal('fail');
        expect(response.body.message).to.equal('Your Account is Suspended');
      });
    }
  };

  for (let data of authData) {
    authUnitTest(data.type, data.creds);
  }
});
