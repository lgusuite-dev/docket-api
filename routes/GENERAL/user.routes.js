const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const userController = require('../../controllers/GENERAL/user.controller');

router.post('/super', userController.createSuper);

router.use(authController.authenticate);

router
  .route('/admins')
  .get(authController.restrictTo('Superadmin'), userController.getAllAdmins)
  .post(authController.restrictTo('Superadmin'), userController.createAdmin);

router
  .route('/users')
  .get(userController.getAllUsers)
  .post(authController.restrictTo('Admin'), userController.createUser);

router
  .route('/admins/:id')
  .get(userController.getAdmin)
  .delete(userController.deleteAdmin);

router
  .route('/users/:id')
  .get(userController.getUser)
  .delete(userController.deleteUser);

router
  .route('/admins/:id/suspend')
  .patch(authController.restrictTo('Superadmin'), userController.suspendAdmin);

module.exports = router;
