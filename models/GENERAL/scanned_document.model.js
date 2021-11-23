const mongoose = require('mongoose');

const ScannedDocumentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Please provide scanned text'],
    },
    fileType: {
      type: String,
      required: [true, 'Please provide file type'],
    },
    status: {
      type: String,
      default: 'Active',
      enum: ['Active', 'Deleted'],
    },
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

module.exports = mongoose.model('Scanned Document', ScannedDocumentSchema);
