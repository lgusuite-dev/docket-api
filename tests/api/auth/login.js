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
  deleteUsers,
} = require('../../utils/db');
const { login } = require('../../utils/response');

require('dotenv').config();

describe('AUTH API SUPERADMIN LOGIN ENDPOINT', () => {
  let superAdmin;
  const superadminCreds = {
    email: 'joshua.corpin@lgusuite.com',
    password: 'password123',
  };
  const adminCreds = {
    email: 'joshua.admin@lgusuite.com',
    password: 'password123',
  };

  before(async () => {
    sgMail.setApiKey(process.env.SEND_GRID_APIKEY);
    await connect();
    superAdmin = await createSuperAdmin();
    await createAdmin(superAdmin);
  });

  after(async () => {
    await deleteUsers();
    await disconnect();
  });

  // SUPERADMIN
  it('Should login the superadmin', async () => {
    const response = await login(superadminCreds, 'super');

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('token');
    expect(response.body).to.have.property('session_token');
    expect(response.body.status).to.equal('success');
  });

  it('Should NOT login the superadmin. WRONG CREDENTIALS', async () => {
    const superadmin = { ...superadminCreds };
    superadmin.password = 'wrong_password';

    const response = await login(superadmin, 'super');

    expect(response.status).to.equal(401);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Incorrect email or password');
  });

  it('Should NOT login the superadmin. NO EMAIL', async () => {
    const superadmin = { ...superadminCreds };
    superadmin.email = undefined;

    const response = await login(superadmin, 'super');

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please provide email');
  });

  it('Should NOT login the superadmin. NO PASSWORD', async () => {
    const superadmin = { ...superadminCreds };
    superadmin.password = undefined;

    const response = await login(superadmin, 'super');

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please provide password');
  });

  it('Should NOT login the superadmin. INVALID LOGIN ENDPOINT', async () => {
    const superadmin = { ...superadminCreds };

    const response = await login(superadmin, 'random');

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Invalid type params');
  });

  // ADMIN
  it('Should login the admin', async () => {
    const response = await login(adminCreds, 'admin');

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('token');
    expect(response.body).to.have.property('session_token');
    expect(response.body.status).to.equal('success');
  });

  it('Should NOT login the admin. WRONG CREDENTIALS', async () => {
    const admin = { ...adminCreds };
    admin.password = 'wrong_password';

    const response = await login(admin, 'admin');

    expect(response.status).to.equal(401);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Incorrect email or password');
  });

  it('Should NOT login the admin. NO EMAIL', async () => {
    const admin = { ...adminCreds };
    admin.email = undefined;

    const response = await login(admin, 'admin');

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please provide email');
  });

  it('Should NOT login the admin. NO PASSWORD', async () => {
    const admin = { ...adminCreds };
    admin.password = undefined;

    const response = await login(admin, 'admin');

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please provide password');
  });

  it('Should NOT login the admin. SUSPENDED ACCOUT', async () => {
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

  it('Should NOT login the admin. DELETED ACCOUT', async () => {
    const deletedAdmin = await createDeletedAdmin(superAdmin);

    const adminCreds = {
      email: deletedAdmin.email,
      password: 'password123',
    };

    const response = await login(adminCreds, 'admin');

    expect(response.status).to.equal(401);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Incorrect email or password');
  });

  it('Should NOT login the admin. INVALID LOGIN ENDPOINT', async () => {
    const admin = { ...adminCreds };

    const response = await login(admin, 'random');

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Invalid type params');
  });

  // USER
});
