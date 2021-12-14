const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const fileController = require('../../controllers/GENERAL/file.controller');

router.use(authController.authenticate);

router.get('/', fileController.getFiles);

module.exports = router;
