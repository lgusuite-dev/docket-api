const mongoose = require('mongoose');
const validator = require('validator');

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
      unique: [true, 'Email already exist'],
      validate: [validator.isEmail, 'Please provide valid email'],
      required: [true, 'Please provide email'],
    },
    mobileNumber: {
      type: String,
    },
    password: {
      type: String,
      min: [8, 'Password length must be greater or equal 8 characters'],
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
    type: {
      type: String,
      default: 'Admin',
      enum: ['Superadmin', 'Admin', 'User'],
    },
    status: {
      type: String,
      default: 'Active',
      enum: ['Active', 'Suspended', 'Deleted'],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
