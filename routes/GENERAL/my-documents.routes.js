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
  .put(myDocumentsController.updateDocument)
  .delete(myDocumentsController.deleteDocument);

router.put('/files/:id', myDocumentsController.updateFile);

router.post('/folders/:id/documents', myDocumentsController.createDocument);
router.post('/documents/:id/files', myDocumentsController.uploadFile);

module.exports = router;
