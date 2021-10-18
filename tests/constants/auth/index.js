const superadminCreds = {
  email: 'joshua.corpin@lgusuite.com',
  password: 'password123',
};

const adminCreds = {
  email: 'joshua.admin@lgusuite.com',
  password: 'password123',
};

const userCreds = {
  email: 'joshua.user@lgusuite.com',
  password: 'password123',
};

exports.authData = [
  {
    type: 'super',
    creds: superadminCreds,
  },
  {
    type: 'tenant',
    creds: adminCreds,
  },
  {
    type: 'tenant',
    creds: userCreds,
  },
];

exports.newUserInfo = {
  firstName: 'newfirst',
  lastName: 'newlast',
  mobileNumber: '09987654324',
};

exports.userPassData = {
  currentPassword: 'password123',
  newPassword: '123password',
  confirmNewPassword: '123password',
};

exports.passCreds = {
  password: '123password',
  passwordConfirm: '123password',
};
