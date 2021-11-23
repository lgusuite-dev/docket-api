const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema(
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
    coverageFrom: {
      type: Date,
      required: [true, 'Please provide the coverage from'],
    },
    coverageTo: {
      type: Date,
      required: [true, 'Please provide the coverage to'],
    },
    retensionPeriod: {
      type: String,
      enum: [
        '1 year',
        '2 years',
        '5 years',
        '10 years',
        '15 years',
        'Permanent',
      ],
    },
    status: {
      type: String,
      default: 'Empty',
      enum: ['Boxed', 'Open', 'Closed', 'Empty'],
    },
    serialNumber: String,
    _documentId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
    _boxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Box',
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
  },
  { timestamps: true }
);

const Book = mongoose.model('Book', BookSchema);

module.exports = Book;
