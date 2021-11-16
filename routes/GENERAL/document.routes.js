const router = require('express').Router();

const documentController = require('../../controllers/GENERAL/document.controller');
const authController = require('../../controllers/GENERAL/auth.controller');

router.use(authController.authenticate);

router
  .route('/')
  .post(documentController.createDocument)
  .get(documentController.getAllDocuments);

router
  .route('/:id')
  .patch(documentController.updateDocumentStatus)
  .put(documentController.updateDocument)
  .get(documentController.getDocument)
  .delete(documentController.deleteDocument);

router.route('/:id/files').get(documentController.getDocumentFiles);

router
  .route('/:_documentId/files/:id')
  .put(documentController.updateUploadedDocumentFile);
router
  .route('/:id/process/:action')
  .patch(documentController.patchDocumentProcess);

router.route('/upload/:id').put(documentController.uploadDocumentFile);
router.route('/classify/:id').put(documentController.classifyDocument);
router.route('/release/:id').put(documentController.releaseDocument);
router.route('/status/:id').patch(documentController.updateDocumentStatus);
router
  .route('/final-status/:id')
  .put(documentController.updateDocumentFinalStatus);

module.exports = router;
