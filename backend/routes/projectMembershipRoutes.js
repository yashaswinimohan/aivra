const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const verifyToken = require('../middleware/authMiddleware');

// Get project memberships (used for My Projects tab)
router.get('/', verifyToken, projectController.getProjectMemberships);

module.exports = router;
