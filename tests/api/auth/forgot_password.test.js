const sgMail = require('@sendgrid/mail');
const { expect } = require('chai');
const {
  connect,
  disconnect,
  createSuperAdmin,
  createDeletedAdmin,
  createSuspendedAdmin,
  deleteUsers,
} = require('../../utils/db');
const { forgotPassword } = require('../../utils/response');
require('dotenv').config();

describe('AUTH FORGOT PASSWORD API ENDPOINT', () => {
  let superAdmin;
  let deletedAdmin;
  let suspendedAdmin;

  before(async () => {
    sgMail.setApiKey(process.env.SEND_GRID_APIKEY);
    await connect();
    superAdmin = await createSuperAdmin();
    deletedAdmin = await createDeletedAdmin(superAdmin);
    suspendedAdmin = await createSuspendedAdmin(superAdmin);
  });

  after(async () => {
    await deleteUsers();
    await disconnect();
  });

  it('Should sent password reset token to user email', async () => {
    const email = { email: superAdmin.email };

    const response = await forgotPassword(email);

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal('success');
    expect(response.body.message).to.equal(
      'Reset password token has been sent to email'
    );
  });

  it('Should NOT password reset token to user email. USER NOT FOUND', async () => {
    const email = { email: 'somerandomemail@lgusuite.com' };
    const response = await forgotPassword(email);

    expect(response.status).to.equal(404);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('User not found');
  });

  it('Should NOT password reset token to user email. DELETED USER', async () => {
    const email = { email: deletedAdmin.email };
    const response = await forgotPassword(email);

    expect(response.status).to.equal(404);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('User not found');
  });

  it('Should NOT password reset token to user email. SUSPENDED USER', async () => {
    const email = { email: suspendedAdmin.email };
    const response = await forgotPassword(email);

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('This account is suspended');
  });

  it('Should NOT password reset token to user email. NO PROVIDED EMAIL', async () => {
    const email = {};
    const response = await forgotPassword(email);

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please provide email');
  });
});
