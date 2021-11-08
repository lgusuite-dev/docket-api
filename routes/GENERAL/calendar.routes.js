const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const calendarController = require('../../controllers/GENERAL/calendar.controller');

router.use(authController.authenticate);

router.route('/team').get(calendarController.getAllByTeam);

module.exports = router;
