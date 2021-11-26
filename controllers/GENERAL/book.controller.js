const _ = require('lodash');

const Book = require('../../models/GENERAL/book.model');
const Document = require('../../models/GENERAL/document.model');

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
    '_documents',
    '_boxId',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const documentIds = [...filteredBody._documents];
  const { id } = req.params;
  filteredBody._updatedBy = req.user._id;
  const initialQuery = {
    _id: id,
    _tenantId: req.user._tenantId,
  };

  const book = await Book.findOne(initialQuery);
  if (!book) return next(new AppError('Book not found', 404));

  if (book.status === 'Empty') filteredBody.status = 'Open';

  if (documentIds) {
    if (book.status === 'Closed' || book.status === 'Boxed')
      return next(
        new AppError(`Cannot add documents on ${box.status} book`, 404)
      );
    const bookDocuments = book._documents;
    filteredBody._documents = filteredBody._documents.concat(bookDocuments);

    for (const documentId of documentIds) {
      const documentQuery = {
        _id: documentId,
        status: { $ne: 'Deleted' },
        _tenantId: req.user._tenantId,
      };

      const document = await Document.findOne(documentQuery);

      console.log(documentQuery);
      document['storage']['_bookId'] = id;
      await document.save({ validateBeforeSave: false });
    }
  }

  const updatedBook = await Book.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    env: {
      book: updatedBook,
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

exports.getBookDocuments = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    _tenantId: req.user._tenantId,
  };

  const book = await Book.findOne(initialQuery);
  if (!book) return next(new AppError('Book not found', 404));

  const documentQuery = {
    'storage._bookId': id,
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(
    Document.find(documentQuery),
    req.query
  )
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nQueryFeatures = new QueryFeatures(
    Document.find(documentQuery),
    req.query
  )
    .filter()
    .count();

  const documents = await queryFeatures.query;
  const nDocument = await nQueryFeatures.query;

  res.status(200).json({
    status: 'Success',
    total_docs: nDocument,
    env: {
      documents,
    },
  });
});

exports.removeDocumentFromBook = catchAsync(async (req, res, next) => {
  const pickFields = ['_documents'];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    _tenantId: req.user._tenantId,
  };

  const book = await Book.findOne(initialQuery);
  if (!book) return next(new AppError('Book not found', 404));

  if (book.status === 'Boxed' || book.status === 'Closed')
    return next(
      new AppError(`Cannot remove document on ${box.status} book`, 404)
    );

  const documentQuery = {
    _id: filteredBody._documents,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const document = await Document.findOne(documentQuery);
  if (!document) return next(new AppError('Document not found', 404));

  const updateDocumentStorage = { ...document.storage };
  delete updateDocumentStorage._bookId;

  await Document.findByIdAndUpdate(
    document._id,
    {
      storage: updateDocumentStorage,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  book._documents.splice(book._documents.indexOf(document._id), 1);
  const updateBookBody = {
    _documents: book._documents,
  };

  if (book._documents.length === 0) updateBookBody['status'] = 'Empty';

  const updatedBook = await Book.findByIdAndUpdate(id, updateBookBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    env: {
      book: updatedBook,
    },
  });
});
