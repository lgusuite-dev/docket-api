const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const userController = require('../../controllers/GENERAL/user.controller');

router.post('/super', userController.createSuper);

router.use(authController.authenticate);

router
  .route('/admins')
  .get(authController.restrictTo('Superadmin'), userController.getAllUsers)
  .post(authController.restrictTo('Superadmin'), userController.createUser);

router
  .route('/users')
  .get(userController.getAllUsers)
  .post(authController.restrictTo('Admin'), userController.createUser);

router
  .route('/admins/:id')
  .get(userController.getUser)
  .put(authController.restrictTo('Superadmin'), userController.updateUser)
  .delete(authController.restrictTo('Superadmin'), userController.deleteUser);

router
  .route('/users/:id')
  .get(userController.getUser)
  .put(authController.restrictTo('Admin'), userController.updateUser)
  .delete(authController.restrictTo('Admin'), userController.deleteUser);

router
  .route('/admins/:id/suspend')
  .patch(authController.restrictTo('Superadmin'), userController.suspendAdmin);

module.exports = router;
