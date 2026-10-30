const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  configureSite,
  getAllSites,
  updateSite,
  createSlot,
  getAllBookings,
} = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Require authentication and Admin/Staff role
router.use(authenticateToken);
router.use(authorizeRoles('staff', 'admin'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/sites', getAllSites);
router.post('/sites/configure', configureSite);
router.patch('/sites/:id', updateSite);
router.post('/slots', createSlot);
router.get('/bookings', getAllBookings);

module.exports = router;

