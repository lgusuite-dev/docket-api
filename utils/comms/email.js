const AWS = require('aws-sdk');
const { isEmpty } = require('lodash');

const AWS_SES = new AWS.SES({
  region: process.env.AWS_SES_REGION,
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
  },
});

exports.sendMail = async ({ to, subject, html }) => {
  if (isEmpty(to) || isEmpty(subject)) {
    throw new Error('Email and title are required');
  }

  if (isEmpty(html)) {
    throw new Error('Email body is required');
  }

  let mail = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: html,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
    Source: process.env.AWS_SES_MAILER_INFO,
  };

  try {
    await AWS_SES.sendEmail(mail).promise();
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};
