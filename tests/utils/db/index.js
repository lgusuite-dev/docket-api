const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../../../models/GENERAL/user.model');

const createID = new mongoose.Types.ObjectId();
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

exports.connect = () => {
  const mongoURI = await mongoServer.getUri();
  await mongoose.connect(mongoURI);
};

exports.disconnect = () => {
  await mongoose.disconnect();
};

exports.createSuperAdmin = () => {
  const superadmin = { ...defaultUserInfo };
  superadmin.type = 'Superadmin';

  return await User.create(superadmin);
};

exports.createAdmin = () => {
  const admin = { ...defaultUserInfo };
  const superadmin = this.createSuperAdmin();
  const _id = createID();

  admin._id = _id;
  admin.type = 'Admin';
  admin.email = 'joshua.admin@lgusuite.com';
  admin._createdBy = superadmin._id;
  admin._tenantId = _id;

  return await User.create(admin);
};

exports.createDeletedAdmin = () => {
  const admin = { ...defaultUserInfo };
  const superadmin = this.createSuperAdmin();
  const _id = createID();

  admin._id = _id;
  admin.type = 'Admin';
  admin.status = 'Deleted';
  admin.email = 'joshua.admindeleted@lgusuite.com';
  admin._createdBy = superadmin._id;
  admin._tenantId = _id;

  return await User.create(admin);
};

exports.createSuspendedAdmin = () => {
  const admin = { ...defaultUserInfo };
  const superadmin = this.createSuperAdmin();
  const _id = createID();

  admin._id = _id;
  admin.type = 'Admin';
  admin.status = 'Deleted';
  admin.email = 'joshua.adminasuspended@lgusuite.com';
  admin._createdBy = superadmin._id;
  admin._tenantId = _id;

  return await User.create(admin);
};

exports.createUser = () => {
  const user = { ...defaultUserInfo };
  const admin = this.createAdmin();
  const _id = createID();

  user._id = _id;
  user.type = 'User';
  user.email = 'joshua.user@lgusuite.com';
  user._createdBy = admin._id;
  user._tenantId = admin._id;

  return await User.create(user);
};

exports.createDeletedUser = () => {
  const user = { ...defaultUserInfo };
  const admin = this.createAdmin();
  const _id = createID();

  user._id = _id;
  user.type = 'User';
  user.status = 'Deleted';
  user.email = 'joshua.user@lgusuite.com';
  user._createdBy = admin._id;
  user._tenantId = admin._id;

  return await User.create(user);
};
