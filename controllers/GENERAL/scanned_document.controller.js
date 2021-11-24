const ScannedDocument = require('../../models/GENERAL/scanned_document.model');
const Document = require('../../models/GENERAL/document.model');

const catchAsync = require('../../utils/errors/catchAsync');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.searchDocument = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  console.log(req.query)

  const searchedDocuments = await ScannedDocument.find(
    {
      $text: { $search: `${search}` },
      confidentialityLevel: { $lte: req.user.access_level },
      _tenantId: req.user._tenantId,
    },
    { score: { $meta: 'textScore' } },
    { lean: true }
  ).sort({ score: { $meta: 'textScore' } });

  // get unique document ids
  const documentIds = searchedDocuments.map((document) =>
    document._documentId.toString()
  );

  const queryFeature = new QueryFeatures(
    Document.find({ _id: { $in: documentIds } }).populate('_files'),
    req.query
  )
    .limitFields()
    .populate()
    .sort()
    .paginate();

  const documents = await queryFeature.query;

  console.log(documentIds);

  res.status(200).json({
    status: 'success',
    env: {
      documents,
    },
  });
});
