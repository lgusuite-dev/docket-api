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
  .patch(roleController.updateRole)
  .delete(roleController.deleteRole);

module.exports = router;
