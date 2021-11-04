const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const eventController = require('../../controllers/GENERAL/event.controller');
//const eventController

router.use(authController.authenticate);

router
  .route('/')
  .get(eventController.getAllEvents)
  .post(eventController.createEvent);

router
  .route('/:id')
  .get(eventController.getEvent)
  .put(eventController.updateEvent)
  .patch(eventController.updateEventStatus)
  .delete(eventController.deleteEvent);

module.exports = router;
