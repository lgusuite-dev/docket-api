const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const teamController = require('../../controllers/GENERAL/team.controller');

router.use(authController.authenticate);

router.route('/').post(teamController.createTeam).get(teamController.getTeams);

router
  .route('/:id')
  .get(teamController.getTeam)
  .put(teamController.updateTeam)
  .delete(teamController.deleteTeam);

module.exports = router;
