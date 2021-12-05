const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const myDocumentsController = require('../../controllers/GENERAL/my-documents.controller');

router.use(authController.authenticate);

router.get('/', myDocumentsController.getRoot);
router.post('/folders', myDocumentsController.createFolder);

router
  .route('/folders/:id')
  .get(myDocumentsController.getFoldersAndDocs)
  .post(myDocumentsController.createFolder)
  .put(myDocumentsController.updateFolder)
  .delete(myDocumentsController.deleteFolder);

router
  .route('/documents/:id')
  .get(myDocumentsController.getDocument)
  .put(myDocumentsController.updateDocument)
  .delete(myDocumentsController.deleteDocument);

router
  .route('/files/:id')
  .put(myDocumentsController.updateFile)
  .delete(myDocumentsController.deleteFile);

router.route('/shared').get(myDocumentsController.getSharedToMe);

router.post('/folders/:id/documents', myDocumentsController.createDocument);
router.post('/documents/:id/files', myDocumentsController.uploadFile);

module.exports = router;
