const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/', requireAuth, submissionController.submitAssessment);
router.get('/chapter/:chapterId', requireAuth, submissionController.getSubmission);
router.get('/course/:courseId', requireAuth, submissionController.getCourseSubmissions);

module.exports = router;
