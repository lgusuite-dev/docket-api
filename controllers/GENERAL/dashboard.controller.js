const Document = require('../../models/GENERAL/document.model');
const User = require('../../models/GENERAL/user.model');
const Role = require('../../models/GENERAL/role.model');
const Team = require('../../models/GENERAL/team.model');
const Book = require('../../models/GENERAL/book.model');
const Box = require('../../models/GENERAL/box.model');
const Task = require('../../models/GENERAL/task.model');

const catchAsync = require('../../utils/errors/catchAsync');

// RECEIVER REPORT MODULE
exports.receiverModule = catchAsync(async (req, res, next) => {
  // Sender Type = Private
  const private = await Document.aggregate([
    {
      $match: {
        senderType: 'Private',
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Sender Type = Other Government Agencies
  const other = await Document.aggregate([
    {
      $match: {
        senderType: 'Other Government Agencies',
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Sender Type = Courts
  const courts = await Document.aggregate([
    {
      $match: {
        senderType: 'Courts',
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Total Inbound Documents
  const totalInboundDocuments = await Document.aggregate([
    {
      $match: {
        type: 'Incoming',
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  const date = new Date();
  const firstDayMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDayMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  // Monthly Inbound Documents
  const monthlyInboundDocuments = await Document.aggregate([
    {
      $match: {
        type: 'Incoming',
        status: 'Active',
        createdAt: { $gte: firstDayMonth, $lte: lastDayMonth },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  res.status(200).json({
    status: 'success',
    env: {
      private: private[0] || { count: 0 },
      other: other[0] || { count: 0 },
      courts: courts[0] || { count: 0 },
      total_inbound_documents: totalInboundDocuments[0] || { count: 0 },
      monthly_inbound_documents: monthlyInboundDocuments[0] || { count: 0 },
    },
  });
});

// UPLOADER REPORT MODULE
exports.uploaderModule = catchAsync(async (req, res, next) => {
  // Inbound Documents For Uploading
  const uploading = await Document.aggregate([
    {
      $match: {
        type: 'Incoming',
        fileLength: 0,
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Uploaded Inbound Documents
  const uploaded = await Document.aggregate([
    {
      $match: {
        type: 'Incoming',
        fileLength: { $gt: 0 },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Approved Documets For Uploading
  const approved_uploading = await Document.aggregate([
    {
      $match: {
        type: { $in: ['Outgoing', 'Internal', 'Archived'] },
        'process.signed': true,
        'process.printed': true,
        'process.uploaded': false,
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Approved Documets For Uploading
  const approved_uploaded = await Document.aggregate([
    {
      $match: {
        type: { $in: ['Outgoing', 'Internal', 'Archived'] },
        'process.signed': true,
        'process.printed': true,
        'process.uploaded': true,
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  const uploadedCount = uploaded[0] ? uploaded[0].count : 0;
  const approvedUploaded = approved_uploaded[0]
    ? approved_uploaded[0].count
    : 0;

  const total_documents_uploaded = { count: uploadedCount + approvedUploaded };

  res.status(200).json({
    status: 'success',
    env: {
      uploading: uploading[0] || { count: 0 },
      uploaded: uploaded[0] || { count: 0 },
      approved_uploading: approved_uploading[0] || { count: 0 },
      approved_uploaded: approved_uploaded[0] || { count: 0 },
      total_documents_uploaded,
    },
  });
});

// CLASSIFIER REPORT MODULE
exports.classifierModule = catchAsync(async (req, res, next) => {
  // Inbound Documents for Classification
  const inbound_classification = await Document.aggregate([
    {
      $match: {
        type: 'Incoming',
        fileLength: { $gt: 0 },
        controlNumber: { $eq: null },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Outbound Documents for Classification
  const outbound_classification = await Document.aggregate([
    {
      $match: {
        type: 'Outgoing',
        fileLength: { $gt: 0 },
        controlNumber: { $eq: null },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Internal Documents for Classification
  const internal_classification = await Document.aggregate([
    {
      $match: {
        type: 'Internal',
        fileLength: { $gt: 0 },
        controlNumber: { $eq: null },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Archived Documents for Classification
  const archived_classification = await Document.aggregate([
    {
      $match: {
        type: 'Archived',
        fileLength: { $gt: 0 },
        controlNumber: { $eq: null },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Classified Documents
  const classified_documents = await Document.aggregate([
    {
      $match: {
        fileLength: { $gt: 0 },
        controlNumber: { $ne: null },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  res.status(200).json({
    status: 'success',
    env: {
      inbound_classification: inbound_classification[0] || { count: 0 },
      outbound_classification: outbound_classification[0] || { count: 0 },
      internal_classification: internal_classification[0] || { count: 0 },
      archived_classification: archived_classification[0] || { count: 0 },
      classified_documents: classified_documents[0] || { count: 0 },
    },
  });
});

// PRINTING REPORT MODULE
exports.printingModule = catchAsync(async (req, res, next) => {
  // Outbound Documents for Printing
  const outbound_printing = await Document.aggregate([
    {
      $match: {
        type: 'Outgoing',
        'process.printed': false,
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Internal Documents for Printing
  const internal_printing = await Document.aggregate([
    {
      $match: {
        type: 'Internal',
        'process.printed': false,
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Archived Documents for Printing
  const archived_printing = await Document.aggregate([
    {
      $match: {
        type: 'Archived',
        'process.printed': false,
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Marked as Printed Documents
  const printed_documents = await Document.aggregate([
    {
      $match: {
        type: { $in: ['Outgoing', 'Internal', 'Archived'] },
        'process.printed': true,
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  res.status(200).json({
    status: 'success',
    env: {
      outbound_printing: outbound_printing[0] || { count: 0 },
      internal_printing: internal_printing[0] || { count: 0 },
      archived_printing: archived_printing[0] || { count: 0 },
      printed_documents: printed_documents[0] || { count: 0 },
    },
  });
});

// SIGNATURE REPORT MODULE
exports.signatureModule = catchAsync(async (req, res, next) => {
  // Outbound Documents for Signature
  const outbound_signature = await Document.aggregate([
    {
      $match: {
        type: 'Outgoing',
        'process.printed': true,
        'process.signed': false,
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Internal Documents for Signature
  const internal_signature = await Document.aggregate([
    {
      $match: {
        type: 'Internal',
        'process.printed': true,
        'process.signed': false,
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Archived Documents for Signature
  const archived_signature = await Document.aggregate([
    {
      $match: {
        type: 'Archived',
        'process.printed': true,
        'process.signed': false,
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Mark as Signed Documents
  const signed_documents = await Document.aggregate([
    {
      $match: {
        type: { $in: ['Outgoing', 'Internal', 'Archived'] },
        'process.printed': true,
        'process.signed': true,
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  res.status(200).json({
    status: 'success',
    env: {
      outbound_signature: outbound_signature[0] || { count: 0 },
      internal_signature: internal_signature[0] || { count: 0 },
      archived_signature: archived_signature[0] || { count: 0 },
      signed_documents: signed_documents[0] || { count: 0 },
    },
  });
});

// WAREHOUSING REPORT MODULE
exports.warehousingModule = catchAsync(async (req, res, next) => {
  // Classified Documents
  const classified_documents = await Document.aggregate([
    {
      $match: {
        type: { $in: ['Incoming', 'Outgoing', 'Internal', 'Archived'] },
        controlNumber: { $ne: null },
        storage: { $eq: null },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Active on File Documents
  const active_file_documents = await Document.aggregate([
    {
      $match: {
        type: { $in: ['Incoming', 'Outgoing', 'Internal', 'Archived'] },
        'storage.status': 'Active',
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Inactive on File Documents
  const inactive_file_documents = await Document.aggregate([
    {
      $match: {
        type: { $in: ['Incoming', 'Outgoing', 'Internal', 'Archived'] },
        'storage.status': 'Inactive',
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Empty Books
  const empty_books = await Book.aggregate([
    {
      $match: {
        status: 'Empty',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Open Books
  const open_books = await Book.aggregate([
    {
      $match: {
        status: 'Open',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Closed Books
  const closed_books = await Book.aggregate([
    {
      $match: {
        status: 'Closed',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Boxed Books
  const boxed_books = await Book.aggregate([
    {
      $match: {
        status: 'Boxed',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // On-Premised Box
  const onpremise_box = await Box.aggregate([
    {
      $match: {
        location: 'On-Premise',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Warehouse-A Box
  const warehouse_a_box = await Box.aggregate([
    {
      $match: {
        location: 'Warehouse A',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Warehouse-B Box
  const warehouse_b_box = await Box.aggregate([
    {
      $match: {
        location: 'Warehouse B',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Warehouse-C Box
  const warehouse_c_box = await Box.aggregate([
    {
      $match: {
        location: 'Warehouse C',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Group Books = Delete if not USED
  const group_books = await Book.aggregate([
    {
      $match: {
        _tenantId: req.user._tenantId,
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $addFields: {
        status: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  // Group Box = Delete if not USED
  const group_box = await Box.aggregate([
    {
      $match: {
        _tenantId: req.user._tenantId,
        location: { $ne: null },
      },
    },
    {
      $group: {
        _id: '$location',
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    env: {
      classified_documents: classified_documents[0] || { count: 0 },
      active_file_documents: active_file_documents[0] || { count: 0 },
      inactive_file_documents: inactive_file_documents[0] || { count: 0 },
      empty_books: empty_books[0] || { count: 0 },
      open_books: open_books[0] || { count: 0 },
      closed_books: closed_books[0] || { count: 0 },
      boxed_books: boxed_books[0] || { count: 0 },
      onpremise_box: onpremise_box[0] || { count: 0 },
      warehouse_a_box: warehouse_a_box[0] || { count: 0 },
      warehouse_b_box: warehouse_b_box[0] || { count: 0 },
      warehouse_c_box: warehouse_c_box[0] || { count: 0 },
      group_books,
      group_box,
    },
  });
});

// OFFICE LAWYER / STAFF LAWYER TASK REPORT MODULE
exports.taskModule = catchAsync(async (req, res, next) => {
  const userTeam = await req.user.populate('_teams');
  const teamUsers = userTeam._teams.length ? userTeam._teams[0].users : [];

  // My Pending Task
  const my_pending_task = await Task.aggregate([
    {
      $match: {
        dueDate: { $gte: new Date() },
        status: { $ne: 'Deleted' },
        status: 'Pending',
        _assigneeId: req.user._id,
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Delayed Task
  const my_delayed_task = await Task.aggregate([
    {
      $match: {
        dueDate: { $lt: new Date() },
        status: { $ne: 'Deleted' },
        status: 'Pending',
        _assigneeId: req.user._id,
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Declined Task
  const my_declined_task = await Task.aggregate([
    {
      $match: {
        status: 'Declined',
        status: { $ne: 'Deleted' },
        _assigneeId: req.user._id,
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Completed Task
  const my_completed_task = await Task.aggregate([
    {
      $match: {
        status: { $in: ['Completed', 'For Approval'] },
        status: { $ne: 'Deleted' },
        _assigneeId: req.user._id,
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Team Pending Task
  const my_team_pending_task = await Task.aggregate([
    {
      $match: {
        dueDate: { $gte: new Date() },
        status: { $ne: 'Deleted' },
        status: 'Pending',
        _assigneeId: { $in: teamUsers },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Team Delayed Task
  const my_team_delayed_task = await Task.aggregate([
    {
      $match: {
        dueDate: { $lt: new Date() },
        status: { $ne: 'Deleted' },
        status: 'Pending',
        _assigneeId: { $in: teamUsers },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Team Declined Task
  const my_team_declined_task = await Task.aggregate([
    {
      $match: {
        status: 'Declined',
        status: { $ne: 'Deleted' },
        _assigneeId: { $in: teamUsers },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Completed Task
  const my_team_completed_task = await Task.aggregate([
    {
      $match: {
        status: { $in: ['Completed', 'For Approval'] },
        status: { $ne: 'Deleted' },
        _assigneeId: { $in: teamUsers },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  res.status(200).json({
    status: 'success',
    env: {
      my_pending_task: my_pending_task[0] || { count: 0 },
      my_delayed_task: my_delayed_task[0] || { count: 0 },
      my_declined_task: my_declined_task[0] || { count: 0 },
      my_completed_task: my_completed_task[0] || { count: 0 },
      my_team_pending_task: my_team_pending_task[0] || { count: 0 },
      my_team_delayed_task: my_team_delayed_task[0] || { count: 0 },
      my_team_declined_task: my_team_declined_task[0] || { count: 0 },
      my_team_completed_task: my_team_completed_task[0] || { count: 0 },
    },
  });
});

// APPROVER REPORT MODULE
exports.approverModule = catchAsync(async (req, res, next) => {
  const userTeam = await req.user.populate('_teams');
  const teamUsers = userTeam._teams.length ? userTeam._teams[0].users : [];

  // Document for Assignation
  const document_assignation = await Document.aggregate([
    {
      $match: {
        controlNumber: { $ne: null },
        type: 'Incoming',
        confidentialityLevel: { $eq: null },
        status: 'Active',
        _assignedTo: { $ne: null },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Task for Approval
  const for_approval = await Task.aggregate([
    {
      $match: {
        workflow: { $in: ['Two-Way', 'Complex with Approval'] },
        status: { $ne: 'Deleted' },
        status: 'For Approval',
        'reply._documentId': { $ne: null },
        _mainTaskId: { $eq: null },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Document for Final Action
  const for_final_action = await Document.aggregate([
    {
      $match: {
        type: 'Outgoing',
        fileLength: { $gt: 0 },
        'process.printed': true,
        'process.signed': true,
        'process.uploaded': true,
        finalStatus: { $eq: null },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Team Pending Task
  const my_team_pending_task = await Task.aggregate([
    {
      $match: {
        dueDate: { $gte: new Date() },
        status: { $ne: 'Deleted' },
        status: 'Pending',
        _assigneeId: { $in: teamUsers },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Team Delayed Task
  const my_team_delayed_task = await Task.aggregate([
    {
      $match: {
        dueDate: { $lt: new Date() },
        status: { $ne: 'Deleted' },
        status: 'Pending',
        _assigneeId: { $in: teamUsers },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Team Declined Task
  const my_team_declined_task = await Task.aggregate([
    {
      $match: {
        status: 'Declined',
        status: { $ne: 'Deleted' },
        _assigneeId: { $in: teamUsers },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Completed Task
  const my_team_completed_task = await Task.aggregate([
    {
      $match: {
        status: { $in: ['Completed', 'For Approval'] },
        status: { $ne: 'Deleted' },
        _assigneeId: { $in: teamUsers },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  res.status(200).json({
    status: 'success',
    env: {
      document_assignation: document_assignation[0] || { count: 0 },
      for_approval: for_approval[0] || { count: 0 },
      for_final_action: for_final_action[0] || { count: 0 },
      returned_task: { count: 0 },
      my_team_pending_task: my_team_pending_task[0] || { count: 0 },
      my_team_delayed_task: my_team_delayed_task[0] || { count: 0 },
      my_team_declined_task: my_team_declined_task[0] || { count: 0 },
      my_team_completed_task: my_team_completed_task[0] || { count: 0 },
    },
  });
});

// USER REPORT MODULE
exports.userModule = catchAsync(async (req, res, next) => {
  // Number of User
  const nUser = await User.aggregate([
    {
      $match: {
        type: 'User',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Number of Role
  const nRole = await Role.aggregate([
    {
      $match: {
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Number of Team
  const nTeam = await Team.aggregate([
    {
      $match: {
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Active User
  const active_user = await User.aggregate([
    {
      $match: {
        type: 'User',
        status: { $eq: 'Active' },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Suspended User
  const suspended_user = await User.aggregate([
    {
      $match: {
        type: 'User',
        status: { $eq: 'Suspended' },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Deleted User
  const deleted_user = await User.aggregate([
    {
      $match: {
        type: 'User',
        status: { $eq: 'Deleted' },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // User with Access Level 1
  const user_access_one = await User.aggregate([
    {
      $match: {
        type: 'User',
        access_level: { $eq: 1 },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // User with Access Level 2
  const user_access_two = await User.aggregate([
    {
      $match: {
        type: 'User',
        access_level: { $eq: 2 },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // User with Access Level 3
  const user_access_three = await User.aggregate([
    {
      $match: {
        type: 'User',
        access_level: { $eq: 3 },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // User with Access Level 4
  const user_access_four = await User.aggregate([
    {
      $match: {
        type: 'User',
        access_level: { $eq: 4 },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // User with Pending Task
  const user_pending_task = await Task.aggregate([
    {
      $match: {
        dueDate: { $gte: new Date() },
        status: 'Pending',
        status: { $ne: 'Deleted' },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  res.status(200).json({
    status: 'success',
    env: {
      user: nUser[0] || { count: 0 },
      role: nRole[0] || { count: 0 },
      team: nTeam[0] || { count: 0 },
      active_user: active_user[0] || { count: 0 },
      suspended_user: suspended_user[0] || { count: 0 },
      deleted_user: deleted_user[0] || { count: 0 },
      user_access_one: user_access_one[0] || { count: 0 },
      user_access_two: user_access_two[0] || { count: 0 },
      user_access_three: user_access_three[0] || { count: 0 },
      user_access_four: user_access_four[0] || { count: 0 },
      user_pending_task: user_pending_task[0] || { count: 0 },
    },
  });
});

// TEAM TASK REPORT MODLE
exports.teamTaskModule = catchAsync(async (req, res, next) => {
  const userTeam = await req.user.populate('_teams');
  const teamUsers = userTeam._teams.length ? userTeam._teams[0].users : [];

  // My Team Pending Task
  const my_team_pending_task = await Task.aggregate([
    {
      $match: {
        dueDate: { $gte: new Date() },
        status: { $ne: 'Deleted' },
        status: 'Pending',
        _assigneeId: { $in: teamUsers },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Team Delayed Task
  const my_team_delayed_task = await Task.aggregate([
    {
      $match: {
        dueDate: { $lt: new Date() },
        status: { $ne: 'Deleted' },
        status: 'Pending',
        _assigneeId: { $in: teamUsers },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Team Declined Task
  const my_team_declined_task = await Task.aggregate([
    {
      $match: {
        status: 'Declined',
        status: { $ne: 'Deleted' },
        _assigneeId: { $in: teamUsers },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // My Completed Task
  const my_team_completed_task = await Task.aggregate([
    {
      $match: {
        status: { $in: ['Completed', 'For Approval'] },
        status: { $ne: 'Deleted' },
        _assigneeId: { $in: teamUsers },
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  res.status(200).json({
    status: 'success',
    env: {
      my_team_pending_task: my_team_pending_task[0] || { count: 0 },
      my_team_delayed_task: my_team_delayed_task[0] || { count: 0 },
      my_team_declined_task: my_team_declined_task[0] || { count: 0 },
      my_team_completed_task: my_team_completed_task[0] || { count: 0 },
    },
  });
});

// FOR RELEASING REPORT MODULE
exports.releasingModule = catchAsync(async (req, res, next) => {
  // Outbound documents for releasing
  const outbound_releasing = await Document.aggregate([
    {
      $match: {
        type: 'Outgoing',
        finalStatus: 'Approved',
        'process.printed': true,
        'process.signed': true,
        'process.uploaded': true,
        'process.released': false,
        confidentialityLevel: { $gt: 0 },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Internal documents for releasing
  const internal_releasing = await Document.aggregate([
    {
      $match: {
        type: 'Internal',
        finalStatus: 'Approved',
        'process.printed': true,
        'process.signed': true,
        'process.uploaded': true,
        'process.released': false,
        confidentialityLevel: { $gt: 0 },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Archived documents for releasing
  const archived_releasing = await Document.aggregate([
    {
      $match: {
        type: 'Archived',
        finalStatus: 'Approved',
        'process.printed': true,
        'process.signed': true,
        'process.uploaded': true,
        'process.released': false,
        confidentialityLevel: { $gt: 0 },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Mark as released
  const mark_released = await Document.aggregate([
    {
      $match: {
        finalStatus: 'Approved',
        'process.printed': true,
        'process.signed': true,
        'process.uploaded': true,
        'process.released': true,
        confidentialityLevel: { $gt: 0 },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  // Waiting for Acknowledgement
  const waiting_acknowledgement = await Document.aggregate([
    {
      $match: {
        finalStatus: 'Approved',
        'process.printed': true,
        'process.signed': true,
        'process.uploaded': true,
        'process.released': true,
        'process.receipt': true,
        'process.acknowledged': false,
        confidentialityLevel: { $gt: 0 },
        status: 'Active',
        _tenantId: req.user._tenantId,
      },
    },
    {
      $count: 'count',
    },
  ]);

  res.status(200).json({
    status: 'success',
    env: {
      outbound_releasing: outbound_releasing[0] || { count: 0 },
      internal_releasing: internal_releasing[0] || { count: 0 },
      archived_releasing: archived_releasing[0] || { count: 0 },
      mark_released: mark_released[0] || { count: 0 },
      waiting_acknowledgement: waiting_acknowledgement[0] || { count: 0 },
    },
  });
});
