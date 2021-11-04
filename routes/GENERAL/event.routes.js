const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');

//const eventController

router.use(authController.authenticate);

module.exports = router;
