const express = require('express');
const router = express.Router();
const userPointsController = require('../controllers/userPointsController');
const verifyToken = require('../middleware/authMiddleware');

// All points routes are protected
router.use(verifyToken);

router.get('/', userPointsController.getUserPoints);

module.exports = router;
