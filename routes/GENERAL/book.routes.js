const router = require('express').Router();

const bookController = require('../../controllers/GENERAL/book.controller');
const authController = require('../../controllers/GENERAL/auth.controller');

router.use(authController.authenticate);

router
  .route('/')
  .get(bookController.getAllBooks)
  .post(bookController.createBook);

router
  .route('/:id')
  .get(bookController.getBook)
  .put(bookController.updateBook)
  .patch(bookController.patchBook);

router.route('/:id/documents').get(bookController.getBookDocuments);

module.exports = router;
