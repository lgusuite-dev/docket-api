const File = require('../../models/GENERAL/file.model');

const catchAsync = require('../../utils/errors/catchAsync');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.getFiles = catchAsync(async (req, res, next) => {
  const initialQuery = { status: 'Active', _tenantId: req.user._tenantId };

  const queryFeatures = new QueryFeatures(File.find(initialQuery), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate();

  const nQueryFeatures = new QueryFeatures(File.find(initialQuery), req.query)
    .filter()
    .count();

  const files = await queryFeatures.query;
  const nFiles = await nQueryFeatures.query;

  res.status(200).json({
    status: 'success',
    total_docs: nFiles,
    env: {
      files,
    },
  });
});
