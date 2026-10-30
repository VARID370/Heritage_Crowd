const express = require('express');
const router = express.Router();
const { verifyTicket, getVerificationLogs } = require('../controllers/verificationController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Staff and Admin only verification routes
router.use(authenticateToken);
router.use(authorizeRoles('staff', 'admin'));

router.post('/scan', verifyTicket);
router.get('/logs', getVerificationLogs);

module.exports = router;

