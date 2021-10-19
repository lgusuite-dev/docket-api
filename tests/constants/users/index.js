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
  mobileNumber: '09987654322',
  password: 'password123',
  passwordConfirm: 'password123',
  type: 'User',
  status: 'Active',
};

exports.userCreds = [
  {
    type: 'admins',
    label: 'Admin',
    creds: adminData,
  },
  {
    type: 'users',
    label: 'User',
    creds: userData,
  },
];

exports.updateUserCreds = [
  {
    data: {
      firstName: 'JoshAdmin',
      lastName: 'CorpsAdmin',
      mobileNumber: '09894849102',
    },
    type: 'admins',
    label: 'Admin',
  },
  {
    data: {
      firstName: 'JoshUser',
      lastName: 'CorpsUser',
      mobileNumber: '09894849103',
    },
    type: 'users',
    label: 'User',
  },
];

exports.deleteUserCreds = [
  {
    type: 'admins',
    label: 'admin',
    users: [
      {
        email: 'deleted.one@lgusuite.com',
        mobile: '09314921451',
      },
      {
        email: 'deleted.two@lgusuite.com',
        mobile: '09314921452',
      },
    ],
  },
  {
    type: 'users',
    label: 'user',
  },
];
