const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('./../../utils/errors/AppError');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');

exports.createSignature = catchAsync(async (req, res, next) => {
  const { meetingNumber, role } = req.body;
  if (!meetingNumber)
    return next(new AppError('please provide meetingNumber', 400));
  if (!role) return next(new AppError('please provide role', 400));
  const timestamp = new Date().getTime() - 30000;
  const msg = Buffer.from(
    process.env.ZOOM_JWT_API_KEY + meetingNumber + timestamp + role
  ).toString('base64');
  if (!msg) return next(new AppError('error in msg', 400));
  const hash = crypto
    .createHmac('sha256', process.env.ZOOM_JWT_API_SECRET)
    .update(msg)
    .digest('base64');
  if (!hash) return next(new AppError('error in hash', 400));
  const signature = Buffer.from(
    `${process.env.ZOOM_JWT_API_KEY}.${meetingNumber}.${timestamp}.${role}.${hash}`
  ).toString('base64');
  if (!signature) return next(new AppError('error in signature', 400));

  res.status(201).json({
    signature: signature,
  });
});

exports.createMeeting = catchAsync(async (req, res, next) => {
  // const { email } = req.body;
  const { topic, start_time } = req.body;
  const email = 'nico@lgusuite.com';
  const token = jwt.sign(
    {
      iss: process.env.ZOOM_JWT_API_KEY,
      exp: new Date().getTime() + 5000,
    },
    process.env.ZOOM_JWT_API_SECRET
  );
  console.log(token);

  const zoomMtng = await axios({
    method: 'POST',
    url: `https://api.zoom.us/v2/users/${email}/meetings`,
    data: {
      topic: topic,
      type: 2,
      start_time: start_time,
      duration: 60,
      // schedule_for: '',
      timezone: 'Asia/Hong_Kong',
      // password: '',
      // agenda: "AGENDA TEST",
      // recurrence: {
      // type: ,
      // repeat_interval: ,
      // weekly_days: '',
      // monthly_day: ,
      // monthly_week: ,
      // monthly_week_day: ,
      // end_times: ,
      // end_date_time: new Date().setHours(new Date().getHours() + 1),
      // },
      settings: {
        host_video: true,
        participant_video: true,
        // cn_meeting: boolean,
        // in_meeting: boolean,
        join_before_host: true,
        // mute_upon_entry: boolean,
        // watermark: boolean,
        // use_pmi: boolean,
        // approval_type: ,
        // registration_type: ,
        // audio: '',
        // auto_recording: '',
        enforce_login: false,
        // enforce_login_domains: '',
        // alternative_hosts: '',
        // global_dial_in_countries: [
        // ''
        // ],
        // registrants_email_notification: boolean
      },
    },
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Zoom-api-Jwt-Request', //zoom-angular-integration
      'content-type': 'application/json',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  });
  console.log(zoomMtng.data);

  res.status(201).json({
    status: 'success',
    env: zoomMtng.data,
  });
});

exports.getAllMeetings = catchAsync(async (req, res, next) => {
  // const { email } = req.body;
  const email = 'nico@lgusuite.com';
  const token = jwt.sign(
    {
      iss: process.env.ZOOM_JWT_API_KEY,
      exp: new Date().getTime() + 5000,
    },
    process.env.ZOOM_JWT_API_SECRET
  );
  console.log(token);

  const zoomMtng = await axios({
    method: 'GET',
    url: `https://api.zoom.us/v2/users/${email}/meetings`,
    data: {},
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Zoom-api-Jwt-Request',
      'content-type': 'application/json',
    },
  });
  console.log(zoomMtng.data);

  res.status(201).json({
    status: 'success',
    env: zoomMtng.data,
  });
});

exports.getMeeting = catchAsync(async (req, res, next) => {
  const meetingId = req.params.meetingId;
  const token = jwt.sign(
    {
      iss: process.env.ZOOM_JWT_API_KEY,
      exp: new Date().getTime() + 5000,
    },
    process.env.ZOOM_JWT_API_SECRET
  );
  console.log(token);

  const zoomMtng = await axios({
    method: 'GET',
    url: `https://api.zoom.us/v2/meetings/${meetingId}`,
    data: {},
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Zoom-api-Jwt-Request',
      'content-type': 'application/json',
    },
  });
  console.log(zoomMtng.data);

  res.status(201).json({
    status: 'success',
    env: zoomMtng.data,
  });
});

exports.deleteMeeting = catchAsync(async (req, res, next) => {
  const meetingId = req.params.meetingId;
  const token = jwt.sign(
    {
      iss: process.env.ZOOM_JWT_API_KEY,
      exp: new Date().getTime() + 5000,
    },
    process.env.ZOOM_JWT_API_SECRET
  );
  console.log(token);

  const zoomMtng = await axios({
    method: 'DELETE',
    url: `https://api.zoom.us/v2/meetings/${meetingId}`,
    data: {},
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Zoom-api-Jwt-Request',
      'content-type': 'application/json',
    },
  });
  console.log(zoomMtng);

  res.status(201).json({
    status: 'success',
    env: `DELETED meetingId: ${meetingId}`,
  });
});
