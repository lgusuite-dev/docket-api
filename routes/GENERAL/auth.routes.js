const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');

router.post('/login/:type', authController.login);

router.use(authController.authenticate);

router.get('/me', authController.getMe);
router.put('/update-info', authController.updateInfo);
router.put('/update-password', authController.updatePassword);

module.exports = router;
