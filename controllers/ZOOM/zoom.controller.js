const _ = require('lodash');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');

exports.createMeeting = catchAsync(async (req, res, next) => {
  const { topic, dateFrom } = req.body;
  const token = jwt.sign(
    {
      iss: process.env.ZOOM_JWT_API_KEY,
      exp: new Date().getTime() + 5000,
    },
    process.env.ZOOM_JWT_API_SECRET
  );
  const email = 'nico@lgusuite.com';
  const meeting = await axios({
    method: 'POST',
    url: `https://api.zoom.us/v2/users/${email}/meetings`,
    data: {
      topic: topic,
      type: 2,
      start_time: dateFrom,
      duration: 60,
      timezone: 'Asia/Hong_Kong',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        jbh_time: 5, //time before join before host. can be 0 minutes, 5 minutes, or 10 minutes before meeting
        waiting_room: false,
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

  res.status(200).json({
    status: 'success',
    env: {
      data: meeting.data,
    },
  });
});
