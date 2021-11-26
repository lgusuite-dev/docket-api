const _ = require('lodash');

const Box = require('../../models/GENERAL/box.model');
const Book = require('../../models/GENERAL/book.model');
const Document = require('../../models/GENERAL/document.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.createBox = catchAsync(async (req, res, next) => {
  const pickFields = ['name', 'description', 'location', 'remarks'];

  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;

  //serial number generator
  filteredBody.serialNumber = Math.floor(Math.random() * 1000000000).toString();

  const box = await Box.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      box,
    },
  });
});

exports.getAllBoxes = catchAsync(async (req, res, next) => {
  const initialQuery = {
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(Box.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nQueryFeatures = new QueryFeatures(Box.find(initialQuery), req.query)
    .filter()
    .count();

  const boxes = await queryFeatures.query;
  const nBoxes = await nQueryFeatures.query;

  res.status(200).json({
    status: 'Success',
    total_docs: nBoxes,
    env: {
      boxes,
    },
  });
});

exports.getBox = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(Box.findOne(initialQuery), req.query)
    .limitFields()
    .populate();

  const box = await queryFeatures.query;
  if (!box) return next(new AppError('Box not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      box,
    },
  });
});

exports.updateBox = catchAsync(async (req, res, next) => {
  const pickFields = ['name', 'description', 'location', 'remarks', '_books'];
  const filteredBody = _.pick(req.body, pickFields);
  const bookIds = [...filteredBody._books];
  const { id } = req.params;
  filteredBody._updatedBy = req.user._id;
  const initialQuery = {
    _id: id,
    _tenantId: req.user._tenantId,
  };

  const box = await Box.findOne(initialQuery);
  if (!box) return next(new AppError('Box not found', 404));

  if (filteredBody._books) {
    const boxBooks = box._books;
    filteredBody._books = filteredBody._books.concat(boxBooks);

    for (const bookId of bookIds) {
      const bookQuery = {
        _id: bookId,
        _tenantId: req.user._tenantId,
      };

      const book = await Book.findOne(bookQuery);
      const bookDocuments = book._documentId;
      book.status = 'Boxed';
      book._boxId = id;
      await book.save({ validateBeforeSave: false });
      for (const documentId of bookDocuments) {
        const documentQuery = {
          _id: documentId,
          status: { $ne: 'Deleted' },
          _tenantId: req.user._tenantId,
        };

        const document = await Document.findOne(documentQuery);
        document['storage']['_boxId'] = id;
        await document.save({ validateBeforeSave: false });
      }
    }
  }

  const updatedBox = await Box.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    env: {
      box: updatedBox,
    },
  });
});

exports.getBoxBooks = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    _tenantId: req.user._tenantId,
  };

  const box = await Box.findOne(initialQuery);
  if (!box) return next(new AppError('Box not found', 404));

  const bookQuery = {
    _boxId: id,
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(Book.find(bookQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nQueryFeatures = new QueryFeatures(Book.find(bookQuery), req.query)
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
