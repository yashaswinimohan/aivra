const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Public routes (if any)
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Protected routes
router.use(verifyToken);
router.post('/', requireRole('professor'), courseController.createCourse);
router.put('/:id', requireRole('professor'), courseController.updateCourse);
router.delete('/:id', requireRole('professor'), courseController.deleteCourse);

module.exports = router;
