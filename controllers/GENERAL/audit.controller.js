const _ = require('lodash');

const Audit = require('../../models/GENERAL/audit.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.getAllAudit = catchAsync(async (req, res, next) => {
  const initialQuery = {
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(
    Audit.find(initialQuery)
      .populate({
        path: '_userId',
      })
      .populate({
        path: 'requestBody',
        populate: {
          path: 'document',
          model: 'Document',
          populate: {
            path: '_createdBy',
            model: 'User',
          },
        },
      })
      .populate({
        path: 'requestBody',
        populate: {
          path: 'task',
          model: 'Task',
          populate: {
            path: '_createdBy',
            model: 'User',
          },
        },
      }),
    req.query
  )
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();

  const nQueryFeatures = new QueryFeatures(Audit.find(initialQuery), req.query)
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

exports.onCreateAudit = catchAsync(async (req, res, next) => {
  const pickFields = ['_userId', 'requestBody', 'action', 'type'];

  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._tenantId = req.user._tenantId;

  const audit = await Audit.create(filteredBody);

  res.status(200).json({
    status: 'success',
    env: {
      audit,
    },
  });
});
