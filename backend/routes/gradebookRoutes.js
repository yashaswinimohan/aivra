const express = require('express');
const router = express.Router();
const gradebookController = require('../controllers/gradebookController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/course/:courseId', gradebookController.getGradesByCourse);
router.post('/', gradebookController.upsertGrade);

module.exports = router;
