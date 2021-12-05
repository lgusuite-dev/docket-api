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
    ocrStatus: {
      type: String,
      default: 'No',
      enum: ['No', 'Scanning', 'Done'],
    },
    versionsLength: {
      type: Number,
      default: 0,
    },
    _currentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    _parentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    _versions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
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
    isAcknowledgementReceipt: {
      type: Boolean,
      default: false,
    },
    description: String,
    versionNumber: String,
  },
  { timestamps: true }
);

FileSchema.pre('save', function (next) {
  if (!this.isNew) return next();

  this._currentVersionId = this._id;

  return next();
});

const File = mongoose.model('File', FileSchema);

module.exports = File;
