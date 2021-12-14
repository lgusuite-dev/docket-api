const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');

router.post('/forgot-password', authController.forgotPassword);
router.post('/login/:type', authController.login);
router.post('/login-mobile/:type', authController.loginMobile);

router
  .route('/reset-password/:token')
  .get(authController.verifyResetPasswordToken)
  .put(authController.resetPassword);

router.use(authController.authenticate);

router.get('/me', authController.getMe);
router.get('/logout', authController.logout);
router.put('/update-info', authController.updateInfo);
router.put('/update-password', authController.updatePassword);

module.exports = router;
