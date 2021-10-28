const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const roleController = require('../../controllers/GENERAL/role.controller');

router.use(authController.authenticate);

router
  .route('/')
  .post(roleController.createRole)
  .get(roleController.getAllRoles);

router
  .route('/:id')
  .get(roleController.getRole)
  .put(roleController.updateRole)
  .delete(roleController.deleteRole);

router.route('/:id/:action').patch(roleController.patchRole);

router.route('/checkRoleInUsers/:id').get(roleController.checkRoleInUsers);

module.exports = router;
