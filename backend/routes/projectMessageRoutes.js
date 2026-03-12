const express = require('express');
const router = express.Router();
const projectMessageController = require('../controllers/projectMessageController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', projectMessageController.getMessagesByProjectId);
router.post('/', verifyToken, projectMessageController.addMessage);

module.exports = router;
