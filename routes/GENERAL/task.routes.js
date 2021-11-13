const router = require('express').Router();

const authController = require('../../controllers/GENERAL/auth.controller');
const taskController = require('../../controllers/GENERAL/task.controller');

router.use(authController.authenticate);

router.route('/').post(taskController.createTask).get(taskController.getTasks);
router.route('/mine').get(taskController.getTasksAssignedToMe);
router.route('/reply/:id').put(taskController.replyToTask);
router.route('/:id').put(taskController.updateTask);
//   .post(taskController.createTask) // creating subtask
//   .get(taskController.getTask)
//   .delete(taskController.deleteTask);

module.exports = router;
