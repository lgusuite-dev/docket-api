const { expect } = require('chai');
const {
  connect,
  disconnect,
  createSuperAdmin,
  deleteUsers,
} = require('../../utils/db');
const { forgotPassword, verifyRPToken } = require('../../utils/response');
require('dotenv').config();

describe('AUTH API VERIFY PASSWORD RESET PASSWORD TOKEN API ENDPOINT', () => {
  let superAdmin;

  before(async () => {
    await connect();
    superAdmin = await createSuperAdmin();
    await forgotPassword({ email: superAdmin.email });
  });

  after(async () => {
    await deleteUsers();
    await disconnect();
  });

  it('Should verify password reset token', async () => {
    const resetToken = process.env.TEST_RESET_TOKEN;
    const response = await verifyRPToken(resetToken);

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal('success');
    expect(response.body.env).to.have.property('user');
  });

  it('Should NOT reset user password. WRONG PASSWORD RESET TOKEN', async () => {
    const resetToken = 'x_token_val';
    const response = await verifyRPToken(resetToken);

    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.message).to.equal('Invalid password reset token');
  });
});
