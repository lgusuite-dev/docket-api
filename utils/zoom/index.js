const jwt = require('jsonwebtoken');
const axios = require('axios');

exports.createMeeting = async(topic, start_date) => {
    const token = jwt.sign(
        {
          iss: process.env.ZOOM_JWT_API_KEY,
          exp: new Date().getTime() + 5000,
        },
        process.env.ZOOM_JWT_API_SECRET
      );
      const email = 'nico@lgusuite.com';
      const meeting =  await axios({
        method: 'POST',
        url: `https://api.zoom.us/v2/users/${email}/meetings`,
        data: {
          topic: topic,
          type: 2,
          start_time: start_date,
          duration: 60,
          timezone: 'Asia/Hong_Kong',
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            enforce_login: false,
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

      return meeting.data;
}