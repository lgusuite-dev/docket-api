const sgMail = require('@sendgrid/mail');

exports.sendMail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const mailOptions = {
      from: process.env.FROM_MAIL,
      to,
      subject,
      html,
      attachments,
    };

    if (!attachments.length) delete mailOptions.attachments;

    await sgMail.send(mailOptions);
  } catch (err) {
    console.error(err);
    console.error(err.message);
  }
};
