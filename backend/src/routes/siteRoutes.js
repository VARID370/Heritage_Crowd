const express = require('express');
const router = express.Router();
const { discover, getSiteDetails, getSiteSlots } = require('../controllers/siteController');

// Dynamic discovery via OpenStreetMap
router.get('/discover', discover);

// Site slots
router.get('/:siteId/slots', getSiteSlots);

// Specific site details (by OSM ID or Bookable Site ID)
router.get('/:id', getSiteDetails);

module.exports = router;

