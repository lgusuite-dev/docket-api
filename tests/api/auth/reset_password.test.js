const { expect } = require('chai');

const {
  connect,
  disconnect,
  createSuperAdmin,
  deleteUsers,
} = require('../../utils/db');
const { forgotPassword, resetPassword } = require('../../utils/response');
require('dotenv').config();

describe('AUTH FORGOT PASSWORD API ENDPOINT', () => {
  let superAdmin;
  const passCreds = {
    password: '123password',
    passwordConfirm: '123password',
  };

  before(async () => {
    await connect();
    superAdmin = await createSuperAdmin();
    await forgotPassword({ email: superAdmin.email });
  });

  after(async () => {
    await deleteUsers();
    await disconnect();
  });

  it('Should reset user password', async () => {
    const resetToken = process.env.TEST_RESET_TOKEN;
    const response = await resetPassword(passCreds, resetToken);

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal('success');
    expect(response.body.env).to.have.property('user');
  });

  it('Should NOT reset user password. WRONG PASSWORD RESET TOKEN', async () => {
    const resetToken = 'x_token_val';
    const response = await resetPassword(passCreds, resetToken);

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal(
      'Password reset token is invalid or has expired'
    );
  });

  it('Should NOT reset user password. NO PROVIDED NEW PASSWORD', async () => {
    const newPass = { ...passCreds };
    newPass.password = undefined;

    const resetToken = process.env.TEST_RESET_TOKEN;
    const response = await resetPassword(newPass, resetToken);

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please provide new password');
  });

  it('Should NOT reset user password. NEW PASSWORD NOT CONFIRM', async () => {
    const newPass = { ...passCreds };
    newPass.passwordConfirm = undefined;

    const resetToken = process.env.TEST_RESET_TOKEN;
    const response = await resetPassword(newPass, resetToken);

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Please confirm new password');
  });
});
