const mongoose = require('mongoose');
const { createMeeting } = require('../../utils/zoom');

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please provide Event Name'],
    },

    description: {
      type: String,
      trim: true,
      required: [true, 'Please provide Event Description'],
    },

    dateFrom: {
      type: Date,
      required: [true, 'Please provide Event Start Date'],
    },

    dateTo: {
      type: Date,
      required: [true, 'Please provide Event End Date'],
    },

    type: {
      type: String,
      trim: true,
      default: 'Once',
      enum: ['Once'], //To be enhance for reoccuring [Monthly, Yearly]
    },

    status: {
      type: String,
      trim: true,
      default: 'Active',
      enum: ['Active', 'Deleted', 'Postponed', 'Cancelled'],
    },

    guests: [
      {
        email: String,
        // _userId: {
        //   type: mongoose.Schema.Types.ObjectId,
        //   ref: 'User',
        // },
        response: {
          type: String,
          trim: true,
          default: '',
          enum: ['Yes', 'No', 'Maybe', ''],
        },
      },
    ],
    tags: String,
    attachments: [
      {
        type: Object,
      },
    ],
    zoomLink: String,
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
  },
  { timestamps: true }
);

EventSchema.pre('save', async function (next) {
  // if(!this.isNew) return next();

  // const {data: {join_url}} =  await createMeeting(this.name, this.dateFrom);
  // this.zoomLink = join_url;
  next();
})

module.exports = mongoose.model('Event', EventSchema);
