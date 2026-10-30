const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getTicketPass,
  cancelBooking,
} = require('../controllers/bookingController');
const { authenticateToken, requireVerifiedUser } = require('../middleware/authMiddleware');

// Authenticated booking endpoints (protected: require verified email for visitors)
router.post('/', authenticateToken, requireVerifiedUser, createBooking);
router.get('/my-bookings', authenticateToken, requireVerifiedUser, getMyBookings);
router.get('/:id', authenticateToken, requireVerifiedUser, getTicketPass);
router.patch('/:id/cancel', authenticateToken, requireVerifiedUser, cancelBooking);

module.exports = router;

