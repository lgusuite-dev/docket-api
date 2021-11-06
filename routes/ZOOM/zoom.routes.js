const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const zoomController = require('../../controllers/ZOOM/zoom.controller');

router.use(authController.authenticate);

router.post('/create', zoomController.createMeeting);

module.exports = router;
