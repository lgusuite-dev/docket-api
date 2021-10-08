const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');

router.post('/login/:type', authController.login);

module.exports = router;
