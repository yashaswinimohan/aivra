const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/', verifyToken, submissionController.submitAssessment);
router.get('/all', verifyToken, submissionController.getAllSubmissions);
router.get('/chapter/:chapterId', verifyToken, submissionController.getSubmission);
router.get('/course/:courseId', verifyToken, submissionController.getCourseSubmissions);
router.put('/:submissionId/grade', verifyToken, submissionController.gradeSubmission);

module.exports = router;
