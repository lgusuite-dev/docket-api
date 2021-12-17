const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const auditController = require('../../controllers/General/audit.controller');

router.use(authController.authenticate);

router.route('/').get(auditController.getAllAudit);

router.route('/:id').get(auditController.getAudit);

module.exports = router;
