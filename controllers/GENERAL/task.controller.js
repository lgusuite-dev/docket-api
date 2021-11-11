const _ = require('lodash');
const axios = require('axios');

const Task = require('../../models/GENERAL/task.model');
const { sendMail } = require('../../utils/comms/email');
const catchAsync = require('../../utils/errors/catchAsync');
const AppError = require('../../utils/errors/AppError');
const QueryFeatures = require('../../utils/query/queryFeatures');

const filterTaskUsersID = (inputUsers) => [...new Set(inputUsers)];

// const sendTaskEmailWithAttachment = async (action, req) => {
//   const { attachments, sendTo, subject, message } = req.body;
//   const allowedActions = ['completed-reply', 'declined-reply'];
//   const emailAttachments = [];

//   if (!allowedActions.includes(action)) return;

//   if (attachments && attachments.length) {
//     for (let [index, attachment] of attachments.entries()) {
//       const file = await axios.get(attachment.link);

//       if (file) {
//         const bufferedFile = Buffer.from(file.data).toString('base64');
//         const emailAttachment = {
//           content: bufferedFile,
//           filename: `some-attachment${index}.pdf`,
//           type: 'application/pdf',
//           disposition: 'attachment',
//           content_id: 'mytext',
//         };

//         emailAttachments.push(emailAttachment);
//       }
//     }
//   }

//   const emailOptions = {
//     to: sendTo,
//     subject,
//     html: `<p>${message}</p>`,
//     attachments: emailAttachments,
//   };

//   await sendMail(emailOptions);
// };

exports.createTask = catchAsync(async (req, res, next) => {});

exports.getTasks = catchAsync(async (req, res, next) => {});

exports.updateTask = catchAsync(async (req, res, next) => {});

exports.deleteTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const initialQuery = {
    _id: id,
    status: { $ne: 'Deleted' },
    _tenantId: req.user._tenantId,
  };

  const task = await Task.findOneAndUpdate(initialQuery, { status: 'Deleted' });

  if (!task) return next(new AppError('Task not found', 404));

  res.status(204).json({
    status: 'success',
  });
});

exports.patchTask = catchAsync(async (req, res, next) => {});
