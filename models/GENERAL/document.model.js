const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      trim: true,
      required: [true, 'Please provide the Subject'],
    },
    sender: {
      firstName: {
        type: String,
        trim: true,
        required: [true, 'Please provide the sender first name'],
      },
      lastName: {
        type: String,
        trim: true,
        required: [true, 'Please provide the sender last name'],
      },
      mobileNumber: {
        type: String,
        trim: true,
        required: [true, 'Please provide the sender mobile number'],
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
      required: [true, 'Please provide the sender type'],
      enum: ['Private', 'Other Government Agencies', 'Courts'],
    },
    requestDate: Date,
    dateReceived: Date,
    receivedThru: String,

    status: {
      type: String,
      default: 'Incoming',
      enum: [
        'Incoming',
        'Outgoing',
        'Internal',
        'Archived',
        'Personal',
        'Deleted',
        'My Documents',
      ],
    },
    controlNumber: {
      type: String,
      unique: [true, 'Control number already exist'],
    },
    finalStatus: {
      type: String,
      enum: ['Approved', 'On Hold', 'Destroy'],
    },
    fileLength: {
      type: Number,
      default: 0,
    },
    isMyDocuments: {
      type: Boolean,
      default: false,
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
    },
    ocrStatus: {
      type: String,
      default: 'No',
      enum: ['No', 'Scanning', 'Done'],
    },
    recipient: {
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
      dateReleased: Date,
      prefix: String,
      suffix: String,
    },
    includedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    excludedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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
    _taskId: {
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
    classification: String,
    subClassification: String,
    remarks: String,
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', DocumentSchema);

module.exports = Document;
