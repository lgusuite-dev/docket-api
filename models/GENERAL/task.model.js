const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please provide name'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'Please provide description'],
    },
    instruction: {
      type: String,
      trim: true,
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
    remarks: {
      type: String,
      trim: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      trim: true,
      default: 'Todo',
      enum: ['Pending', 'Completed', 'Deleted', 'Declined'],
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    dueDate: Date,
    reference: {
      type: String,
      trim: true,
    },

    // _mainTaskId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Task',
    // },
    // _fromTaskId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Task',
    // },
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
  },

  { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);
