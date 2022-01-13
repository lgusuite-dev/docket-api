const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema(
  {
    _userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user'],
    },
    type: {
      type: String,
      required: [true, 'Please provide a type'],
    },
    action: {
      type: String,
      required: [true, 'Please provide an action'],
    },
    _tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a tenant ID'],
    },
    requestBody: Object,
  },
  { timestamps: true }
);

const Audit = mongoose.model('Audit', AuditSchema);

module.exports = Audit;
