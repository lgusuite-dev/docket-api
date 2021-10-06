const router = require('express').Router();

const userController = require('../../controllers/GENERAL/user.controller');

router.get('/super', userController.createSuper);

module.exports = router;
