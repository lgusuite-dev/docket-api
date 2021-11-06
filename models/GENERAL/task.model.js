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
      required: [true, 'Please provide instruction'],
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      trim: true,
      default: 'Todo',
      enum: ['Pending', 'Todo', 'Completed', 'Deleted'],
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
    _mainTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    _fromTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    attachments: Object,
    _references: Object,
    startDate: Date,
    dueDate: Date,
  },

  { timestamps: true }
);

TaskSchema.index({ name: 1, _tenantId: 1 }, { unique: true });

module.exports = mongoose.model('Task', TaskSchema);
