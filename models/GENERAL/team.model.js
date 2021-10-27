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
      },
    ],
    status: {
      type: String,
      trim: true,
      default: 'Active',
      enum: ['Active', 'Deleted'],
    },
    _tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide tenant id'],
    },
    _createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide _id'],
    },
  },
  { timestamps: true }
);

TeamSchema.index({ name: 1, _tenantId: 1 }, { unique: true });

module.exports = mongoose.model('Team', TeamSchema);
