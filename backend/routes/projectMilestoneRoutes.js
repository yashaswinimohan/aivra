const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const projectMilestoneController = require('../controllers/projectMilestoneController');

// All milestone routes require authentication
router.use(verifyToken);

// Get milestones for a specific project
router.get('/', projectMilestoneController.getMilestonesByProjectId);

// Add a new milestone
router.post('/', projectMilestoneController.addMilestone);

// Update a milestone
router.put('/:id', projectMilestoneController.updateMilestone);

// Delete a milestone
router.delete('/:id', projectMilestoneController.deleteMilestone);

module.exports = router;
