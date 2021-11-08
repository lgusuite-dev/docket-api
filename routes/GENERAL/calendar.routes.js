const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const calendarController = require('../../controllers/GENERAL/calendar.controller');

router.use(authController.authenticate);

router.route('/').get(calendarController.getAll);
router.route('/byUser').get(calendarController.getAllByUser);
router.route('/byTeam/:id').get(calendarController.getAllByTeam);

module.exports = router;
