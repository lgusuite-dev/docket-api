const _ = require('lodash');
const Event = require('../../models/GENERAL/event.model');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.getAllEvents = catchAsync(async (req, res, next) => {
  const initialQuery = {
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
    status: { $ne: 'Deleted' },
  };

  const queryFeatures = new QueryFeatures(Event.find(initialQuery), req.query)
    .sort()
    .limitFields()
    .filter()
    .paginate()
    .populate();
  const countEvents = new QueryFeatures(Event.find(initialQuery), req.query)
    .filter()
    .count();

  const total = await countEvents.query;
  const events = await queryFeatures.query;

  res.status(200).json({
    status: 'Success',
    total,
    env: {
      events,
    },
  });
});

exports.getEvent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const queryFeatures = new QueryFeatures(Event.find(initialQuery), req.query)
    .limitFields()
    .populate();

  const event = await queryFeatures.query;
  if (!event) return next(new AppError('Event not found', 404));

  res.status(200).json({
    status: 'success',
    env: {
      event,
    },
  });
});

exports.createEvent = catchAsync(async (req, res, next) => {
  const pickFields = [
    'name',
    'description',
    'dateFrom',
    'dateTo',
    'type',
    'guests',
    'tags',
    'attachments',
    'zoomLink',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  filteredBody._createdBy = req.user._id;
  filteredBody._tenantId = req.user._tenantId;

  const event = await Event.create(filteredBody);

  res.status(201).json({
    status: 'success',
    env: {
      event,
    },
  });
});

exports.updateEvent = catchAsync(async (req, res, next) => {
  const pickFields = [
    'name',
    'description',
    'dateFrom',
    'dateTo',
    'type',
    'guests',
    'tags',
    'attachments',
    'zoomLink',
  ];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const event = await Event.findOneAndUpdate(initialQuery, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!event) return next(new AppError('Event not found!'));

  res.status(201).json({
    status: 'success',
    env: {
      event,
    },
  });
});

exports.updateEventStatus = catchAsync(async (req, res, next) => {
  const pickFields = ['status'];
  const allowedStatus = ['Active', 'Postponed', 'Cancelled'];
  const filteredBody = _.pick(req.body, pickFields);
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  if (!filteredBody.status || !allowedStatus.includes(filteredBody.status))
    return next(new AppError('Invalid Status', 401));

  const event = await Event.findOneAndUpdate(initialQuery, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!event) return next(new AppError('Event not found'));

  res.status(201).json({
    status: 'success',
    env: {
      event,
    },
  });
});

exports.deleteEvent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };
  const event = await Event.findOneAndUpdate(initialQuery, {
    status: 'Deleted',
  });

  if (!event) return next(new AppError('Event not found!', 400));

  res.status(204).json({
    status: 'success',
  });
});
