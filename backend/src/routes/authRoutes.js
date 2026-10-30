const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  verifyOtp,
  resendVerification,
  getMe,
  logout,
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/verify-otp', verifyOtp);
router.post('/resend-verification', resendVerification);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);

module.exports = router;
