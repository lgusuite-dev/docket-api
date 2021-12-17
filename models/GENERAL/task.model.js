const mongoose = require('mongoose');

const { sendMail } = require('../../utils/comms/email');
const { sendSMS } = require('../../utils/comms/sms');
const serviceAccount = require('../../docketmobile-firebase-adminsdk-jmzg1-d0dec12b77.json');
const admin = require('firebase-admin');

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

  const doc = await this.populate('_assigneeId _createdBy');

  const assignee = doc._assigneeId;
  const assigner = doc._createdBy;

  const tasksLink = 'https://www.lgudocket.com/portal/my-workflow';

  const mailOptions = {
    to: assignee.email,
    subject: `Task '${doc.name}' Assigned To You`,
    html: `<h3>Good day ${
      assignee.firstName
    }, you have a new task that is assigned to you.</h3>
    <h4>Task Details: </h4>
    <ul>
      <li>Task Name: ${doc.name}</li>
      <li>Instruction: ${doc.instruction}</li>
      <li>Assigner: ${assigner.firstName} ${assigner.lastName}</li>
      <li>Due Date: ${new Date(`${doc.dueDate}`).toLocaleString()}</li>
    </ul>

    <p>Click <strong><a href=${tasksLink} target="_blank">here</a></strong> to view all your tasks.</p>
    `,
  };

  const smsOptions = {
    to: assignee.mobileNumber,
    message: `Good day ${
      assignee.firstName
    }, you have a new task that is assigned to you.

    Task Details: 
      • Task Name: ${doc.name}
      • Instruction: ${doc.instruction}
      • Assigner: ${assigner.firstName} ${assigner.lastName}
      • Due Date: ${new Date(`${doc.dueDate}`).toLocaleString()}`,
  };
  const messages = [];
  for (let tok of assignee.firebase_token) {
    messages.push({
      notification: {
        title: `Task '${doc.name}' Assigned To You`,
        body: 'You have a new TASK Assigned to you!',
      },
      token: tok,
    });
  }
  if (messages.length) {
    await admin.messaging().sendAll(messages);
  }
  await sendMail(mailOptions);
  await sendSMS(smsOptions);

  next();
});

module.exports = mongoose.model('Task', TaskSchema);
