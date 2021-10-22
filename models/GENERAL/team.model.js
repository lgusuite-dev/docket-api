const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please provide name'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'Please provide description'],
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: [true, 'User already in the team'],
      },
    ],
    status: {
      type: String,
      trim: true,
      default: 'Active',
      enum: ['Active', 'Deleted'],
    },
    _createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide _id'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', TeamSchema);
