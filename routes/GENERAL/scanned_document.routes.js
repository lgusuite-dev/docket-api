const router = require('express').Router();

const scannedDocumentController = require('../../controllers/GENERAL/scanned_document.controller');

router.get('/', scannedDocumentController.searchDocument);

module.exports = router;
