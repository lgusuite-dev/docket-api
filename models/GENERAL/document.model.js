const mongoose = require('mongoose');
const DocumentSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      trim: true,
      required: [true, 'Please provide the Subject'],
    },
    senderType: {
      type: String,
      trim: true,
      enum: ['Private', 'Other Government Agencies', 'Courts'],
    },
    senderFirstName: {
      type: String,
      trim: true,
      required: [true, 'Please provide sender first name'],
    },
    senderLastName: {
      type: String,
      trim: true,
      required: [true, 'Please provide sender last name'],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Please provide mobile number'],
    },
    email: {
      type: String,
      required: [true, 'Please provide email address'],
    },
    status: {
      type: String,
      default: 'Active',
      enum: ['Active', 'Deleted'],
    },
    _files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    _assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    _updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    classification: String,
    subClassification: String,
    department: String,
    position: String,
    remarks: String,
    others: Object,
    requestDate: Date,
    dateReceived: Date,
    receivedThru: String,
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', DocumentSchema);

module.exports = Document;
