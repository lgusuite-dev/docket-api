const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const scannedDocumentController = require('../../controllers/GENERAL/scanned_document.controller');

router.use(authController.authenticate);

router
  .get('/', scannedDocumentController.searchDocument)
  .post('/', scannedDocumentController.search);

module.exports = router;
