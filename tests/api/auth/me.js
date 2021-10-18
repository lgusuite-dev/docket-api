const { expect } = require('chai');
const {
  connect,
  disconnect,
  createSuperAdmin,
  deleteUsers,
} = require('../../utils/db');
const { getMe } = require('../../utils/response');

describe('AUTH API GET ME ENDPOINT', () => {
  let superAdmin;
  let token;
  let session;

  before(async () => {
    await connect();
  });
});
