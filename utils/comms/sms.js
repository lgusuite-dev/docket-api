const axios = require('axios');

exports.sendSMS = async ({ to, message }) => {
  try {
    const apiEndpoint = 'https://api.semaphore.co/api/v4/messages';

    const smsOptions = {
      sendername: 'SEMAPHORE',
      number: to,
      message,
      apikey: process.env.SEMAPHORE_KEY,
    };

    await axios({
      method: 'POST',
      url: apiEndpoint,
      data: smsOptions,
    });
  } catch (err) {
    console.error(err);
    console.error(err.message);
  }
};
