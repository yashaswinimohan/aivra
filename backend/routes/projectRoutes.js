const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const verifyToken = require('../middleware/authMiddleware');

// Get all projects
router.get('/', projectController.getAllProjects);

// Create a project (Requires authentication, but anyone can create, no extra role check needed)
router.post('/', verifyToken, projectController.createProject);

// Get single project
router.get('/:id', projectController.getProjectById);

module.exports = router;
