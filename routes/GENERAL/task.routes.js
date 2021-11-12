const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const taskController = require('../../controllers/GENERAL/task.controller');

router.use(authController.authenticate);

router.route('/').post(taskController.createTask).get(taskController.getTasks);

// router
//   .route('/:id')
//   .post(taskController.createTask) // creating subtask
//   .get(taskController.getTask)
//   .put(taskController.updateTask)
//   .delete(taskController.deleteTask);

module.exports = router;
