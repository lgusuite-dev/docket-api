const _ = require('lodash');
const ScannedDocument = require('../../models/GENERAL/scanned_document.model');
const Document = require('../../models/GENERAL/document.model');

const catchAsync = require('../../utils/errors/catchAsync');
const QueryFeatures = require('../../utils/query/queryFeatures');

const createPreview = (text, keyword = '') => {
  const splitDocText = text.split(' ');
  let preview = '';

  for (let [index, text] of splitDocText.entries()) {
    let nextValue = splitDocText[index + 1]
      ? // if truthy, get right side value
        splitDocText[index + 1]
      : // if falsy, get left side value
        splitDocText[index - 2];

    // if (
    //   text.includes('<strong>') &&
    //   !nextValue.includes('<strong>') &&
    //   !preview
    // ) {

    if (text.includes(keyword) && !preview) {
      // number of text from keyword to left
      let start = index - 20;
      // number of text from keyword to right
      let end = index + 20;

      if (start <= 0) {
        for (let i = index; i >= 0; i--) {
          preview = splitDocText[i] + ' ' + preview;
        }
      } else {
        for (let i = index; i >= start; i--) {
          const word =
            i === start
              ? splitDocText[i][0].toUpperCase() + splitDocText[i].slice(1)
              : splitDocText[i];

          if (splitDocText[i].includes('.')) break;

          preview = word + ' ' + preview;
        }
      }

      if (end >= splitDocText.length - 1) {
        for (let i = index + 1; i <= splitDocText.length - 1; i++) {
          const word = i === end ? splitDocText[i] + '...' : splitDocText[i];
          preview += word + ' ';
        }
      } else {
        for (let i = index + 1; i <= end; i++) {
          const word = i === end ? splitDocText[i] + '...' : splitDocText[i];
          preview += word + ' ';
        }
      }
    }
  }

  return preview ? preview : 'No preview available.';
};

exports.searchDocument = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  let filteredQuery = _.omit(req.query, ['confidentialityLevel']);
  const extractWords = search ? search.split(' ') : [];
  let sorter;
  // priority of searching
  // inclusion and exclusion
  // access level
  // status [inbound, outbound, archived]
  let qry = {
    $or: [
      { _includes: req.user._id },
      { confidentialityLevel: { $lte: req.user.access_level } },
    ],
    _excludes: { $ne: req.user._id },
    _tenantId: req.user._tenantId,
    status: { $ne: 'Deleted' },
  };

  let searchedDocuments = [];
  let scannedDocCounts = [];
  if (search) {
    console.log('no scanned files');
    filteredQuery = _.omit(filteredQuery, ['populate']);

    const query = {
      $and: [
        {
          $or: [
            { _includes: req.user._id },
            { confidentialityLevel: { $lte: req.user.access_level } },
          ],
        },
        {
          $or: [
            { remarks: { $regex: search || '', $options: 'i' } },
            { subject: { $regex: search || '', $options: 'i' } },
            { controlNumber: search || '' },
          ],
        },
      ],
      _excludes: { $ne: req.user._id },
      _tenantId: req.user._tenantId,
      status: { $ne: 'Deleted' },
    };

    const documentSearch = new QueryFeatures(
      Document.find(query).populate({
        path: '_files _assignedTo',
      }),
      filteredQuery
    )
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .populate();

    const nDocumentSearch = new QueryFeatures(
      Document.find(query),
      filteredQuery
    )
      .filter()
      .count();

    searchedDocuments = await documentSearch.query;
    scannedDocCounts = await nDocumentSearch.query;
  }

  if (search) {
    qry['$text'] = { $search: `${search}` };
    qry['score'] = { $meta: 'textScore' };
    qry['lean'] = true;
    sorter = { score: { $meta: 'textScore' } };
  }
  if (!searchedDocuments.length) {
    const searchedDocumentsQuery = new QueryFeatures(
      ScannedDocument.find(qry)
        .sort(sorter)
        .populate({
          path: '_documentId',
          populate: {
            path: '_files',
          },
        }),
      filteredQuery
    )
      .sort()
      .limitFields()
      .filter()
      .paginate()
      .populate();

    const nQueryFeatures = new QueryFeatures(
      ScannedDocument.find(qry)
        .sort(sorter)
        .populate({
          path: '_documentId',
          populate: {
            path: '_files',
          },
        }),
      filteredQuery
    )
      .filter()
      .count();

    searchedDocuments = await searchedDocumentsQuery.query;
    scannedDocCounts = await nQueryFeatures.query;

    for (let document of searchedDocuments) {
      const origText = document.text;

      for (let word of extractWords) {
        const regex = new RegExp(word, 'ig');

        document.text = document.text.replace(
          regex,
          `<strong>${word}</strong>`
        );
      }

      const preview = createPreview(document.text);

      document.preview =
        preview !== 'No preview available.'
          ? `Page ${document.page} - ${preview}`
          : preview;
      document.text = origText;
    }
  }

  res.status(200).json({
    status: 'success',
    results: searchedDocuments.length,
    'total-docs': scannedDocCounts,
    env: {
      documents: searchedDocuments,
    },
  });
});

exports.search = catchAsync(async (req, res, next) => {
  var queryFromBody = JSON.parse(req.body.query || '{}');
  var query = {
    $and: [
      {
        $or: [
          { _includes: req.user._id },
          { confidentialityLevel: { $lte: req.user.access_level } },
        ],
      },
    ],
    _excludes: { $ne: req.user._id },
    _tenantId: req.user._tenantId,
    status: { $ne: 'Deleted' },
  };

  if (queryFromBody.$or.length) {
    query.$and.push({ $and: queryFromBody.$or });
  }

  const { ocrpage, ocrlimit, docpage, doclimit } = queryFromBody;

  // OCR PAGINATION
  const oPage = +ocrpage || 1;
  const oLimit = +ocrlimit || 1500;
  const oSkip = (oPage - 1) * oLimit;

  // DOCUMENT PAGINATION
  const dPage = +docpage || 1;
  const dLimit = +doclimit || 1500;
  const dSkip = (dPage - 1) * dLimit;

  var documentQuery = { ...query };

  query['$text'] = { $search: `${req.body.keyword}` };
  query['score'] = { $meta: 'textScore' };
  query['lean'] = true;
  const sorter = { score: { $meta: 'textScore' } };

  const count = await ScannedDocument.find(query).count();

  const ocrs = await ScannedDocument.find(query)
    .sort(sorter)
    .limit(oLimit)
    .skip(oSkip)
    .lean()
    .populate({
      path: '_documentId',
      populate: {
        path: '_files',
      },
    });

  documentQuery['$or'] = [
    {
      subject: { $regex: req.body.keyword, $options: 'i' },
    },
    {
      controlNumber: { $regex: req.body.keyword, $options: 'i' },
    },
  ];

  if (
    req.user.type === 'Admin' ||
    (req.user.access_level > 1 && req.user.type === 'User')
  ) {
    documentQuery['$or'].push({
      type: 'Internal',
      confidentialityLevel: { $gt: 1 },
    });

    delete documentQuery['$and'];
  }

  const documents = await Document.find(documentQuery)
    .limit(dLimit)
    .skip(dSkip);

  const documentCount = await Document.find(documentQuery).count();

  res.status(200).json({
    status: 'success',
    query,
    documentQuery,
    count: count,
    ocrs: ocrs,
    documents: documents,
    documentCount: documentCount,
  });
});
