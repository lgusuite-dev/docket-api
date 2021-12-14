const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const dashboardController = require('../../controllers/GENERAL/dashboard.controller');

router.use(authController.authenticate);

router.get('/receiver', dashboardController.receiverModule);
router.get('/uploader', dashboardController.uploaderModule);
router.get('/classifier', dashboardController.classifierModule);
router.get('/printing', dashboardController.printingModule);
router.get('/signature', dashboardController.signatureModule);
router.get('/warehousing', dashboardController.warehousingModule);
router.get('/task', dashboardController.taskModule);
router.get('/team-task', dashboardController.teamTaskModule);
router.get('/approver', dashboardController.approverModule);
router.get('/user', dashboardController.userModule);
router.get('/releasing', dashboardController.releasingModule);

router.get('/mobile/tasks', dashboardController.mobileTasks);
router.get('/mobile/document-types', dashboardController.mobileDocTypes);
router.get(
  '/mobile/document-classification',
  dashboardController.mobileDocClassification
);

module.exports = router;
