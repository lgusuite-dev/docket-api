const router = require('express').Router();

const documentController = require('../../controllers/GENERAL/document.controller');
const authController = require('../../controllers/GENERAL/auth.controller');

router.use(authController.authenticate);

router.route('/generate').post(documentController.generateDocuments);
router.route('/task-documents').get(documentController.documentsForTask);

router
  .route('/')
  .post(documentController.createDocument)
  .get(documentController.getAllDocuments);

router
  .route('/classification')
  .get(documentController.getDocumentClassification);

router
  .route('/migrate/files')
  .post(documentController.uploadMigratedDocumentFiles);
router.route('/migrate').post(documentController.migrateDocuments);

router
  .route('/:id')
  .put(documentController.updateDocument)
  .get(documentController.getDocument)
  .delete(documentController.deleteDocument);

router.route('/:id/:action').patch(documentController.patchDocumentStatus);

router.route('/:id/files').get(documentController.getDocumentFiles);

router
  .route('/:_documentId/files/:id')
  .put(documentController.updateUploadedDocumentFile);

router.route('/:id/type').put(documentController.patchDocumentType);
router.route('/process/:action').put(documentController.updateDocumentProcess);

router.route('/assignation/:id').put(documentController.documentAssignation);
router.route('/final-status/:id').put(documentController.forFinalAction);
router.route('/upload/:id').put(documentController.uploadDocumentFile);
router.route('/classify/:id').put(documentController.classifyDocument);
router.route('/declassify/:id').put(documentController.declassifyDocument);
router.route('/release/:id').put(documentController.releaseDocument);
router.route('/acknowledge/:id').put(documentController.acknowledgeDocument);
router.route('/storage/:status').put(documentController.updateDocumentStorage);
router
  .route('/isAssigned/:id')
  .put(documentController.updateDocumentIsAssigned);
router.route('/file-task/:ids').get(documentController.getFileTask);

module.exports = router;
