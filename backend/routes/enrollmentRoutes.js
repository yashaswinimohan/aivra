const express = require('express');
const router = express.Router();
const { getEnrollment, updateProgress, getUserEnrollments, getCourseStudents, dropStudent } = require('../controllers/enrollmentController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getUserEnrollments);
router.get('/course/:courseId/students', protect, getCourseStudents);
router.delete('/:enrollmentId', protect, dropStudent);
router.get('/:courseId', protect, getEnrollment);
router.post('/:courseId/progress', protect, updateProgress);

module.exports = router;
