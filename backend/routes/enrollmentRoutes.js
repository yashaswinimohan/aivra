const express = require('express');
const router = express.Router();
const { getEnrollment, updateProgress, getUserEnrollments } = require('../controllers/enrollmentController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getUserEnrollments);
router.get('/:courseId', protect, getEnrollment);
router.post('/:courseId/progress', protect, updateProgress);

module.exports = router;
