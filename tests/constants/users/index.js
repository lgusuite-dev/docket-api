const adminData = {
  firstName: 'Joshua',
  lastName: 'Corpin',
  email: 'joshua.corpin23@gmail.com',
  mobileNumber: '09987654321',
  password: 'password123',
  passwordConfirm: 'password123',
  type: 'Admin',
  status: 'Active',
};

const userData = {
  firstName: 'Joshua',
  lastName: 'Corpin',
  email: 'joshua.corpin25@gmail.com',
  mobileNumber: '09987654321',
  password: 'password123',
  passwordConfirm: 'password123',
  type: 'User',
  status: 'Active',
};

exports.userCreds = [
  {
    type: 'admins',
    label: 'admin',
    creds: adminData,
  },
  {
    type: 'users',
    label: 'user',
    creds: userData,
  },
];
