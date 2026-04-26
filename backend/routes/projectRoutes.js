const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const verifyToken = require('../middleware/authMiddleware');

// Get all projects
router.get('/', projectController.getAllProjects);

// Create a project (Requires authentication)
router.post('/', verifyToken, projectController.createProject);

// Get single project
router.get('/:id', projectController.getProjectById);

// Update a project
router.put('/:id', verifyToken, projectController.updateProject);

// Complete a project
router.put('/:id/complete', verifyToken, projectController.completeProject);

// Delete a project
router.delete('/:id', verifyToken, projectController.deleteProject);

module.exports = router;
