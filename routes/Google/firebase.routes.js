const router = require('express').Router();
const fireBaseController = require('./../../controllers/Google/firebase.controller');

router.post('/push-one', fireBaseController.sendOne);

module.exports = router;
