const router = require('express').Router();

const documentController = require('../../controllers/GENERAL/document.controller');
const authController = require('../../controllers/GENERAL/auth.controller');

router.use(authController.authenticate);

router
  .route('/')
  .post(documentController.createDocument)
  .get(documentController.getAllDocuments);

router.get('/folders-and-docs', documentController.getMyDocAndFolders);
router.get('/subfolders-and-docs/:id', documentController.getSubFolderAndDocs);

router
  .route('/:id')
  .put(documentController.updateDocument)
  .get(documentController.getDocument)
  .delete(documentController.deleteDocument);

router.route('/:id/files').get(documentController.getDocumentFiles);
router
  .route('/:_documentId/files/:id')
  .put(documentController.updateUploadedDocumentFile);

router
  .route('/:id/status/:action')
  .patch(documentController.patchDocumentStatus);

router.route('/process/:action').patch(documentController.patchDocumentProcess);
router.route('/assignation/:id').put(documentController.documentAssignation);
router.route('/final-status/:id').put(documentController.forFinalAction);
router.route('/upload/:id').put(documentController.uploadDocumentFile);
router.route('/classify/:id').put(documentController.classifyDocument);
router.route('/release/:id').put(documentController.releaseDocument);

module.exports = router;
