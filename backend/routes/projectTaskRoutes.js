const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const projectTaskController = require('../controllers/projectTaskController');

// All task routes require authentication
router.use(verifyToken);

// Get tasks for a specific project
router.get('/', projectTaskController.getTasksByProjectId);

// Add a new task
router.post('/', projectTaskController.addTask);

// Update a task
router.put('/:id', projectTaskController.updateTask);

// Delete a task
router.delete('/:id', projectTaskController.deleteTask);

module.exports = router;
