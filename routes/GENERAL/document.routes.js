const router = require('express').Router();

const documentController = require('../../controllers/GENERAL/document.controller');
const authController = require('../../controllers/GENERAL/auth.controller');

router.use(authController.authenticate);

router
  .route('/')
  .post(documentController.createDocument)
  .get(documentController.getAllDocuments);

router.get('/folders-and-docs', documentController.getMyDocAndFolders);
router.post('/subfolders-and-docs', documentController.getSubFolderAndDocs)

router
  .route('/:id')
  .put(documentController.updateDocument)
  .get(documentController.getDocument)
  .delete(documentController.deleteDocument);

router.route('/:id/files').get(documentController.getDocumentFiles);
router.route('/upload/:id').put(documentController.uploadDocumentFile);
router.route('/classify/:id').put(documentController.classifyDocument);

module.exports = router;
