const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');

const { _createSessionToken } = require('../../utils/tokens');
const { sendMail } = require('../../utils/comms/email');

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, 'Please provide first name'],
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, 'Please provide last name'],
    },
    middleName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: [
        true,
        'The Email you provided is currently used by another account or you can check the deleted tab if the account is already deleted.',
      ],
      validate: [validator.isEmail, 'Please provide valid email'],
      required: [true, 'Please provide email'],
    },
    mobileNumber: {
      type: String,
      unique: [
        true,
        'The Mobile Number you provided is currently used by another account or you can check the deleted tab if the account is already deleted.',
      ],
      required: [true, 'Please provide mobile number'],
    },
    address: {
      type: String,
      trim: true,
      required: [true, 'Please provide address'],
    },
    password: {
      type: String,
      select: false,
      minlength: [
        8,
        'Password length must be greater or equal to 8 characters',
      ],
      required: [true, 'Please provide password'],
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (inputPassword) {
          return this.password === inputPassword;
        },
        message: "Password don't match",
      },
    },
    access_level: {
      type: Number,
      enum: [0, 1, 2, 3, 4],
    },
    type: {
      type: String,
      default: 'Admin',
      enum: ['Superadmin', 'Admin', 'User'],
    },
    sex: {
      type: String,
      trim: true,
      required: [true, 'Please provide sex'],
      enum: ['Male', 'Female'],
    },
    status: {
      type: String,
      default: 'Active',
      enum: ['Active', 'Suspended', 'Deleted'],
    },
    isNewUser: {
      type: Boolean,
      default: true,
    },
    hasMobileAppAccess: {
      type: Boolean,
      default: false,
    },
    _teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],
    _role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    },
    _tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide tenant id'],
    },
    _createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user id'],
    },
    others: Object,
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
    passwordChangedAt: Date,
    firebase_token: Array,
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isNew || process.env.NODE_ENV === 'test') return next();

  if (this.type !== 'Superadmin') {
    const user = await User.findOne({ email: this.email });

    if (!user) {
      const mailOptions = {
        to: this.email,
        subject: 'New Docket Account Created',
        html: `<h1>Good day ${this.firstName}, this is your new docket account:</h1> <p>email: ${this.email}</p> <p>password:${this.password}</p>`,
      };

      await sendMail(mailOptions);
    }
  }

  next();
});

UserSchema.pre('save', async function (next) {
  if (this.isNew && this.isNewUser) return next();

  this.isNewUser = false;

  next();
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now();

  next();
});

UserSchema.methods.isPasswordCorrect = async (inputPassword, userPassword) =>
  await bcrypt.compare(inputPassword, userPassword);

UserSchema.methods.verifySession = function (sessionToken, token) {
  return sessionToken === _createSessionToken(this, token);
};

UserSchema.methods.createPasswordResetToken = function () {
  let resetToken = crypto.randomBytes(16).toString('hex');

  if (process.env.NODE_ENV === 'test')
    resetToken = process.env.TEST_RESET_TOKEN;

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
