const Audit = require('../../models/GENERAL/audit.model');

exports.createAudit = async (queryLog) => {
  try {
    await Audit.create(queryLog);
  } catch (error) {
    console.log(error);
  }
};
