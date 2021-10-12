const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

const User = require('../../../models/GENERAL/user.model');

const createID = () => new mongoose.Types.ObjectId();
const mongoServer = new MongoMemoryServer();

const defaultUserInfo = {
  _id: '615d80fbbc0375a4178188a4',
  firstName: 'Joshua',
  lastName: 'Corpin',
  email: 'joshua.corpin@lgusuite.com',
  mobileNumber: '09123456789',
  password: 'password123',
  passwordConfirm: 'password123',
  status: 'Active',
  _createdBy: '615d80fbbc0375a4178188a4',
  _tenantId: '615d80fbbc0375a4178188a4',
};

exports.connect = async () => {
  await mongoServer.start();
  const mongoURI = mongoServer.getUri();
  await mongoose.connect(mongoURI);
};

exports.disconnect = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

exports.createSuperAdmin = async () => {
  const superadmin = { ...defaultUserInfo };
  superadmin.type = 'Superadmin';

  return await User.create(superadmin);
};

exports.createAdmin = async (superadmin, email = '') => {
  const admin = { ...defaultUserInfo };
  const _id = createID();

  admin._id = _id;
  admin.type = 'Admin';
  admin.email = !email ? 'joshua.admin@lgusuite.com' : email;
  admin._createdBy = superadmin._id;
  admin._tenantId = _id;

  return await User.create(admin);
};

exports.createDeletedAdmin = async (superadmin) => {
  const admin = { ...defaultUserInfo };
  const _id = createID();

  admin._id = _id;
  admin.type = 'Admin';
  admin.status = 'Deleted';
  admin.email = 'joshua.admindeleted@lgusuite.com';
  admin._createdBy = superadmin._id;
  admin._tenantId = _id;

  return await User.create(admin);
};

exports.createSuspendedAdmin = async (superadmin) => {
  const admin = { ...defaultUserInfo };
  const _id = createID();

  admin._id = _id;
  admin.type = 'Admin';
  admin.status = 'Suspended';
  admin.email = 'joshua.adminsuspended@lgusuite.com';
  admin._createdBy = superadmin._id;
  admin._tenantId = _id;

  return await User.create(admin);
};

exports.createUser = async (superadmin) => {
  const user = { ...defaultUserInfo };
  const adminEmail = 'joshua.admin1@lgusuite.com';
  const admin = await this.createAdmin(superadmin, adminEmail);
  const _id = createID();

  user._id = _id;
  user.type = 'User';
  user.email = 'joshua.user@lgusuite.com';
  user._createdBy = admin._id;
  user._tenantId = admin._id;

  return await User.create(user);
};

exports.createDeletedUser = async (superadmin) => {
  const user = { ...defaultUserInfo };
  const adminEmail = 'joshua.admin2@lgusuite.com';
  const admin = await this.createAdmin(superadmin, adminEmail);
  const _id = createID();

  user._id = _id;
  user.type = 'User';
  user.status = 'Deleted';
  user.email = 'joshua.deleteduser@lgusuite.com';
  user._createdBy = admin._id;
  user._tenantId = admin._id;

  return await User.create(user);
};

exports.deleteUsers = async () => {
  return await User.deleteMany();
};
