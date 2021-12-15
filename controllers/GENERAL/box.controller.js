const _ = require('lodash');

const Box = require('../../models/GENERAL/box.model');
const Book = require('../../models/GENERAL/book.model');
const Document = require('../../models/GENERAL/document.model');

const ControlNumber = require('../../utils/control-number/controlNumber');
const settings = require('../../mock/settings');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.createBox = catchAsync(async (req, res, next) => {
  const pickFields = ['name', 'description', 'location', 'remarks'];

  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;

  //serial number generator
  const tempBox = await Box.findOne({
    _tenantId: req.user._tenantId,
  }).sort({
    createdAt: -1,
  });

  let finalSN = 1;
  if (tempBox.serialNumber) {
    if (tempBox.serialNumber < 10000) {
      let serialNumber = parseInt(tempBox.serialNumber);
      finalSN = serialNumber + 1;
    }
  }

  filteredBody.serialNumber = finalSN.toString().padStart(4, '0');

  //Control Number Generator
  const configs = settings.ALGORITHM;
  filteredBody.controlNumber = await new ControlNumber(
    {},
    configs,
    req.user._tenantId
  )
    .fieldBased('type')
    .sequence('monthly', 'box')
    .month()
    .year()
    .sequence('yearly', 'box')
    .generate();

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
  const bookIds = [filteredBody._books];
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
      const bookDocuments = book._documents;
      book.status = 'Boxed';
      book._boxId = id;
      await book.save({ validateBeforeSave: false });
      console.log(bookDocuments);
      for (const documentId of bookDocuments) {
        const documentQuery = {
          _id: documentId,
          status: { $ne: 'Deleted' },
          _tenantId: req.user._tenantId,
        };

        const document = await Document.findOne(documentQuery);

        document.storage['_boxId'] = id;
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

exports.removeBookFromBox = catchAsync(async (req, res, next) => {
  const pickFields = ['_books'];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    _tenantId: req.user._tenantId,
  };

  const box = await Box.findOne(initialQuery);
  if (!box) return next(new AppError('Box not found', 404));

  const bookQuery = {
    _id: filteredBody._books,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const book = await Book.findOne(bookQuery);
  if (!book) return next(new AppError('Book not found', 404));
  await Book.findByIdAndUpdate(
    book._id,
    {
      status: 'Closed',
      _boxId: null,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  const bookDocuments = book._documents;
  await book.save({ validateBeforeSave: false });
  for (const documentId of bookDocuments) {
    const documentQuery = {
      _id: documentId,
      status: { $ne: 'Deleted' },
      _tenantId: req.user._tenantId,
    };
    const document = await Document.findOne(documentQuery);

    document.storage['_boxId'] = null;
    await document.save({ validateBeforeSave: false });
  }
  box._books.splice(box._books.indexOf(book._id), 1);

  const updatedBoxBody = {
    _books: box._books,
  };

  const updatedBox = await Box.findByIdAndUpdate(id, updatedBoxBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    env: {
      book: updatedBox,
    },
  });
});

exports.transferBookToBox = catchAsync(async (req, res, next) => {
  const { id, bookId } = req.params;

  const bookQuery = {
    _id: bookId,
    _tenantId: req.user._tenantId,
  };

  const book = await Book.findOne(bookQuery);
  if (!book) return next(new AppError('Book not found', 404));

  const bookDocuments = book._documents;
  await book.save({ validateBeforeSave: false });
  for (const documentId of bookDocuments) {
    const documentQuery = {
      _id: documentId,
      status: { $ne: 'Deleted' },
      _tenantId: req.user._tenantId,
    };
    const document = await Document.findOne(documentQuery);

    document.storage['_boxId'] = id;
    await document.save({ validateBeforeSave: false });
  }

  const initialQuery = {
    _id: book._boxId,
    _tenantId: req.user._tenantId,
  };

  const box = await Box.findOne(initialQuery);
  if (!box) return next(new AppError('Box not found', 404));

  box._books.splice(box._books.indexOf(bookId), 1);

  const updateBoxBody = {
    _book: box._books,
  };

  const updatedBox = await Box.findByIdAndUpdate(
    initialQuery._id,
    updateBoxBody,
    {
      new: true,
      runValidators: true,
    }
  );

  initialQuery._id = id;

  const transferedBox = await Box.findOne(initialQuery);
  if (!box) return next(new AppError('Box not found', 404));

  console.log(book);

  const updatedBookId = {
    _boxId: id,
  };

  const updatedBook = await Book.findByIdAndUpdate(bookId, updatedBookId);

  const updateTransferedBoxBody = {
    _books: [transferedBox._book, updatedBook],
  };

  const updatedTransferedBox = await Box.findByIdAndUpdate(
    id,
    updateTransferedBoxBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    env: {
      initialBox: updatedBox,
      transferedbox: updatedTransferedBox,
      book: updatedBook,
    },
  });
});
