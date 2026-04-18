const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/course/:courseId', assignmentController.getAssignmentsByCourse);
router.post('/', assignmentController.createAssignment);
router.delete('/:id', assignmentController.deleteAssignment);

module.exports = router;
