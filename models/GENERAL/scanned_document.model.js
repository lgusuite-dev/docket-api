const mongoose = require('mongoose');

const ScannedDocumentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Please provide scanned text'],
    },
    controlNumber: {
      type: String,
      required: [true, 'Please provide document control number'],
    },
    page: {
      type: Number,
      required: [true, 'Please provide page number'],
    },
    fileType: {
      type: String,
      required: [true, 'Please provide file type'],
    },
    confidentialityLevel: {
      type: Number,
      required: [true, 'Please provide confidentiality level'],
      enum: [1, 2, 3, 4],
    },
    classification: {
      type: String,
      required: [true, 'Please provide classification'],
    },
    subClassification: {
      type: String,
      required: [true, 'Please provide classification'],
    },
    senderType: {
      type: String,
      required: [true, 'Please provide the sender type'],
      enum: ['Private', 'Other Government Agencies', 'Courts'],
    },
    dateReceived: {
      type: Date,
      required: [true, 'Please provide date received'],
    },
    dateReleased: {
      type: Date,
      required: [true, 'Please provide date released  '],
    },
    type: {
      type: String,
      required: [true, 'Please provide document type'],
      enum: [
        'Incoming',
        'Outgoing',
        'Internal',
        'Archived',
        'Personal',
        'Not Defined',
      ],
    },
    status: {
      type: String,
      default: 'Active',
      enum: ['Active', 'Deleted'],
    },
    _assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    _includes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    _excludes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    _fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please provide file id'],

      ref: 'File',
    },
    _documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please provide document id'],
      ref: 'Document',
    },
    _tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please provide tenant id'],
      ref: 'User',
    },
  },
  { timestamps: true }
);

ScannedDocumentSchema.index({ text: 'text' });

module.exports = mongoose.model('Scanned Document', ScannedDocumentSchema);
