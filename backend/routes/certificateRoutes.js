const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', certificateController.getUserCertificates);
router.post('/', certificateController.issueCertificate);

module.exports = router;
