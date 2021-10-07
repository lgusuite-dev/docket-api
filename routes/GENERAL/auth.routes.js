const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');

router.post('/login', authController.login);

module.exports = router;
