const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      trim: true,
    },
    sender: {
      firstName: {
        type: String,
        trim: true,
      },
      lastName: {
        type: String,
        trim: true,
      },
      mobileNumber: {
        type: String,
        trim: true,
      },
      middleInitial: String,
      department: String,
      position: String,
      email: String,
      prefix: String,
      suffix: String,
    },
    senderType: {
      type: String,
      enum: ['QC Department', 'Private', 'Other Government Agencies', 'Courts'],
    },
    requestDate: Date,
    dateReceived: Date,
    receivedThru: String,
    type: {
      type: String,
      default: 'Incoming',
      enum: [
        'Incoming',
        'Outgoing',
        'Internal',
        'Archived',
        'Personal',
        'Not Defined',
        'Initial',
      ],
    },
    status: {
      type: String,
      default: 'Active',
      enum: ['Active', 'Deleted', 'Suspended'],
    },
    controlNumber: String,
    dateClassified: Date,

    finalStatus: {
      type: String,
      enum: ['Approved', 'On Hold', 'Destroy', 'Library'],
    },
    fileLength: {
      type: Number,
      default: 0,
    },
    confidentialityLevel: {
      type: Number,
      enum: [1, 2, 3, 4],
    },
    process: {
      printed: {
        type: Boolean,
        default: false,
      },
      signed: {
        type: Boolean,
        default: false,
      },
      released: {
        type: Boolean,
        default: false,
      },
      uploaded: {
        type: Boolean,
        default: false,
      },
      receipt: {
        type: Boolean,
        default: false,
      },
      acknowledged: {
        type: Boolean,
        default: false,
      },
    },
    ocrStatus: {
      type: String,
      default: 'No',
      enum: ['No', 'Scanning', 'Done'],
    },
    recipients: [
      {
        firstName: {
          type: String,
          trim: true,
        },
        lastName: {
          type: String,
          trim: true,
        },
        mobileNumber: {
          type: String,
          trim: true,
        },
        middleInitial: String,
        department: String,
        position: String,
        email: String,
        prefix: String,
        suffix: String,
      },
    ],
    dateReleased: Date,
    dateConfirmed: Date,
    message: {
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      like: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      text: String,
    },
    storage: {
      status: {
        type: String,
        enum: ['Active', 'Inactive'],
      },
      _bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
      _boxId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Box',
      },
    },
    isAssigned: {
      type: Boolean,
    },
    dateApproved: Date,
    _fromTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },

    _files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    _folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
    },
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
    _includes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    _excludes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    _sharedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    classification: String,
    subClassification: String,
    remarks: String,
    migrated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', DocumentSchema);

module.exports = Document;
