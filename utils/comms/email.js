const sgMail = require('@sendgrid/mail');

exports.sendMail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.FROM_MAIL,
    to,
    subject,
    html,
  };

  await sgMail.send(mailOptions);
};
