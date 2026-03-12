const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const verifyToken = require('../middleware/authMiddleware');

// Get project memberships (used for My Projects tab)
router.get('/', verifyToken, projectController.getProjectMemberships);

// Join project
router.post('/', verifyToken, projectController.joinProject);

// Invite user to project
router.post('/invite', verifyToken, projectController.inviteUserToProject);

// Update membership status (Accept/Reject)
router.put('/:projectId/:id', verifyToken, projectController.updateMembershipStatus);

// Leave/remove from project
router.delete('/:projectId/:id', verifyToken, projectController.leaveOrRemoveProjectMember);

module.exports = router;
