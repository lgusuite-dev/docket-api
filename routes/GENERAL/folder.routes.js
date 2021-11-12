const router = require('express').Router();
const authController = require('../../controllers/GENERAL/auth.controller');

const documentController = require('../../controllers/GENERAL/document.controller');

router.use(authController.authenticate);

router.route('/').post(documentController.createFolder);
router
  .route('/:folderId')
  .put(documentController.updateFolder)
  .delete(documentController.deleteFolder);

module.exports = router;
