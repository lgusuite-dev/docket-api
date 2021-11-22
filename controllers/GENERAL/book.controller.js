const _ = require('lodash');

const Book = require('../../models/GENERAL/book.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.createBook = catchAsync(async (req, res, next) => {
  const pickFields = [
    'name',
    'description',
    'coverageFrom',
    'coverageTo',
    'retensionPeriod',
  ];

  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;

  //serial number generator
  filteredBody.serialNumber = Math.floor(Math.random() * 1000000000).toString();

  const book = await Book.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      book,
    },
  });
});

exports.getAllBooks = catchAsync(async (req, res, next) => {
  const initialQuery = {
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(Book.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nQueryFeatures = new QueryFeatures(Book.find(initialQuery), req.query)
    .filter()
    .count();

  const books = await queryFeatures.query;
  const nBooks = await nQueryFeatures.query;

  res.status(200).json({
    status: 'Success',
    total_docs: nBooks,
    env: {
      books,
    },
  });
});

exports.getBook = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(Book.findOne(initialQuery), req.query)
    .limitFields()
    .populate();

  const book = await queryFeatures.query;
  if (!book) return next(new AppError('Book not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      book,
    },
  });
});

exports.updateBook = catchAsync(async (req, res, next) => {
  const pickFields = [
    'name',
    'description',
    'coverageFrom',
    'coverageTo',
    'retensionPeriod',
    '_documentId',
    '_boxId',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  filteredBody._updatedBy = req.user._id;
  const initialQuery = {
    _id: id,
    _tenantId: req.user._tenantId,
  };

  const book = await Book.findOne(initialQuery);
  if (!book) return next(new AppError('Book not found', 404));

  if (filteredBody._documentId) {
    const bookDocuments = book._documentId;
    filteredBody._documentId = [...filteredBody._documentId, ...bookDocuments];
  }

  const updatedBook = await Book.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (filteredBody._documentId) {
    for (const documentId of filteredBody._documentId) {
      const documentQuery = {
        _id: documentId,
        status: { $ne: 'Deleted' },
        _tenantId: req.user._tenantId,
      };

      const document = await Document.findOne(documentQuery);
      document.storage['_bookId'] = id;
    }
  }

  res.status(200).json({
    status: 'success',
    env: {
      updatedBook,
    },
  });
});

exports.patchBook = catchAsync(async (req, res, next) => {
  const pickFields = ['status'];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;

  const initialQuery = {
    _id: id,
    _tenantId: req.user._tenantId,
  };

  const book = await Book.findOne(initialQuery);
  if (!book) return next(new AppError('Book not found', 404));

  book.status = filteredBody.status;
  const updatedBook = await book.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    env: {
      book: updatedBook,
    },
  });
});
