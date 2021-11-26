const mongoose = require('mongoose');

const BoxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please provide the book name'],
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      enum: [
        'On-Premise',
        'Warehouse A',
        'Warehouse B',
        'Warehouse C',
        'Warehouse D',
      ],
    },
    remarks: String,
    serialNumber: String,
    _books: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
    ],
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

const Box = mongoose.model('Box', BoxSchema);

module.exports = Box;
