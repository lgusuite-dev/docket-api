const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please provide a name'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'Please provide description'],
    },
    _tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide tenant id'],
    },
    _createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user _id'],
    },
    status: {
      type: String,
      trim: true,
      default: 'Active',
      enum: ['Active', 'Deleted'],
    },
    access: [{ type: Object }],
  },
  { timestamps: true }
);

RoleSchema.index({ name: 1, _tenantId: 1 }, { unique: true });

module.exports = mongoose.model('Role', RoleSchema);
