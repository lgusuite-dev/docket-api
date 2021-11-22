const router = require('express').Router();

const boxController = require('../../controllers/GENERAL/box.controller');
const authController = require('../../controllers/GENERAL/auth.controller');

router.use(authController.authenticate);

router.route('/').get(boxController.getAllBoxes).post(boxController.createBox);

router.route('/:id').get(boxController.getBox).put(boxController.updateBox);

module.exports = router;
