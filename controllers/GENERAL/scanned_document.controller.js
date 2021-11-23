const ScannedDocument = require('../../models/GENERAL/scanned_document.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');

exports.searchDocument = catchAsync(async (req, res, next) => {
  const { search } = req.params;

  const searchedDocuments = await ScannedDocument.find(
    { $text: { $search: `${searchVal}` } },
    { score: { $meta: 'textScore' } },
    { lean: true }
  ).sort({ score: { $meta: 'textScore' } });

  console.log(search);
});
