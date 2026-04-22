const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/', verifyToken, submissionController.submitAssessment);
router.get('/chapter/:chapterId', verifyToken, submissionController.getSubmission);
router.get('/course/:courseId', verifyToken, submissionController.getCourseSubmissions);

module.exports = router;
