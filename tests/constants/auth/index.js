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
    type: 'admin',
    creds: adminCreds,
  },
  {
    type: 'user',
    creds: userCreds,
  },
];
