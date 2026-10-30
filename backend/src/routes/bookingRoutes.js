const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getTicketPass,
  cancelBooking,
} = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Authenticated booking endpoints
router.post('/', authenticateToken, createBooking);
router.get('/my-bookings', authenticateToken, getMyBookings);
router.get('/:id', authenticateToken, getTicketPass);
router.patch('/:id/cancel', authenticateToken, cancelBooking);

module.exports = router;

