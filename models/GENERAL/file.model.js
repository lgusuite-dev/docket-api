const mongoose = require('mongoose');
const FileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please provide the file name'],
    },
    status: {
      type: String,
      default: 'Active',
      enum: ['Active', 'Deleted'],
    },
    dropbox: {
      type: Object,
      required: [true, 'Please provide the file'],
    },
    _documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Please provide document id'],
    },
    _tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide tenant id'],
    },
    _createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide tenant id'],
    },
    description: String,
  },
  { timestamps: true }
);

const File = mongoose.model('File', FileSchema);

module.exports = File;
