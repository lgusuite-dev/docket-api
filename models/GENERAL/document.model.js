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
      enum: ['Private', 'Other Government Agencies', 'Courts'],
    },
    senderFirstName: {
      type: String,
      trim: true,
    },
    senderLastName: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
    },
    email: String,
    controlNumber: {
      type: String,
      unique: [true, 'Control number already exist'],
    },
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
      ],
    },
    finalStatus: {
      type: String,
      enum: ['Approved', 'On Hold', 'Destroy'],
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
    },
    recipient: {
      firstName: {
        type: String,
        trim: true,
        required: [true, 'Please provide recipient first name'],
      },
      lastName: {
        type: String,
        trim: true,
        required: [true, 'Please provide recipient last name'],
      },
      mobileNumber: {
        type: String,
        trim: true,
        required: [true, 'Please provide recipient mobile number'],
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
