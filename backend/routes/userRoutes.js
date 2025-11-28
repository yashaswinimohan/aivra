const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');

// All user routes are protected
router.use(verifyToken);

router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);
router.post('/promote', userController.promoteToProfessor); // Test route
router.post('/promote-admin', userController.promoteToAdmin); // Test route
router.post('/', userController.createUserProfile); // Public route (called after firebase auth)

module.exports = router;
