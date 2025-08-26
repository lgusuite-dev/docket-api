const admin = require('firebase-admin');
const serviceAccount = require('../../docketmobile.json');

const catchAsync = require('../../utils/errors/catchAsync');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.sendOne = catchAsync(async (req, res, next) => {
  const { title, body, token } = req.body;
  console.log(token);
  try {
    admin
      .messaging()
      .sendToDevice(token, {
        notification: {
          title: title,
          body: body,
        },
      })
      .then(function (response) {
        console.log('Successfully sent message:', response);
      })
      .catch(function (error) {
        console.log('Error sending message:', error);
      });
    res.status(200).json({
      status: 'success',
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
});
