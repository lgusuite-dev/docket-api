const _ = require('lodash');

const Audit = require('../../models/GENERAL/audit.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.getAllAudit = catchAsync(async (req, res, next) => {
  const queryFeatures = new QueryFeatures(Audit.find({}), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nQueryFeatures = new QueryFeatures(Audit.find({}), req.query)
    .filter()
    .count();

  const audits = await queryFeatures.query;
  const nAudits = await nQueryFeatures.query;

  res.status(200).json({
    status: 'Success',
    total_audits: nAudits,
    env: {
      audits,
    },
  });
});

exports.getAudit = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = { _id: id };
  const queryFeatures = new QueryFeatures(
    Audit.findOne(initialQuery),
    req.query
  )
    .limitFields()
    .populate();

  const audit = await queryFeatures.query;
  if (!audit) return next(new AppError('Log not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      audit,
    },
  });
});
