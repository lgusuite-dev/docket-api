const mongoose = require('mongoose');

const { sendMail } = require('../../utils/comms/email');

const TaskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please provide name'],
    },
    dueDate: { type: Date, required: true },
    description: {
      type: String,
      trim: true,
      required: [true, 'Please provide description'],
    },
    workflow: {
      type: String,
      trim: true,
      required: [true, 'Please provide workflow'],
      enums: [
        'One-Way',
        'Two-Way',
        'Complex with Approval',
        'Complex without Approval',
      ],
    },
    instruction: {
      type: String,
      trim: true,
      required: [true, 'Please provide instruction'],
    },
    remarks: {
      type: String,
      trim: true,
      // required: [true, 'Please provide remarks'], //remarks is required only when instruction == "Others"
    },
    _assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide assignee id'],
    },
    _documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    status: {
      type: String,
      trim: true,
      default: 'Pending',
      enum: [
        'Pending',
        'Completed',
        'Deleted',
        'Cancelled',
        'Declined',
        'For Approval',
        'Returned',
      ],
    },
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
    // tracker
    _mainTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    _previousTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    // default
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
    reply: {
      message: {
        type: String,
      },
      date: {
        type: Date,
      },
      _documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    },
    notification: {
      tenMinDueDate: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

TaskSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  const doc = await this.populate('_assigneeId');

  console.log(doc);

  next();
});

module.exports = mongoose.model('Task', TaskSchema);
