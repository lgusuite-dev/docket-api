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
  .post(authController.restrictTo('Admin', 'User'), userController.createUser);

router
  .route('/users/inclusion-exclusion/:access_level/:routeTo')
  .get(userController.getInclusionExclusion);

router
  .route('/admins/:id')
  .get(userController.getUser)
  .put(authController.restrictTo('Superadmin'), userController.updateUser)
  .delete(authController.restrictTo('Superadmin'), userController.deleteUser);

router
  .route('/users/:id')
  .get(userController.getUser)
  .put(authController.restrictToSpecifiedAccess(), userController.updateUser)
  .delete(
    authController.restrictToSpecifiedAccess(),
    userController.deleteUser
  );

router
  .route('/admins/:id/:action')
  .patch(authController.restrictTo('Superadmin'), userController.patchUser);

router
  .route('/users/:id/:action')
  .patch(authController.restrictToSpecifiedAccess(), userController.patchUser);

module.exports = router;
