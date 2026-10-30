const { discoverSites, getSiteByOsmId } = require('../services/osmService');
const BookableSite = require('../models/BookableSite');
const TimeSlot = require('../models/TimeSlot');
const { formatSlotRange } = require('../utils/qrHelper');
const { getCrowdLevel } = require('../services/crowdService');

/**
 * Discover heritage sites dynamically using OpenStreetMap
 */
const discover = async (req, res, next) => {
  try {
    const { q, city, state, category, limit, bookableOnly } = req.query;

    const result = await discoverSites({ q, city, state, category, limit });

    let finalData = result.data;
    if (bookableOnly === 'true') {
      finalData = finalData.filter((site) => site.isBookable);
    }

    res.status(200).json({
      success: true,
      data: finalData,
      total: finalData.length,
      isFromCache: result.isFromCache,
      cachedAt: result.cachedAt || null,
    });
  } catch (error) {
    // If Overpass is completely down, provide honest error
    res.status(503).json({
      success: false,
      message: `OpenStreetMap Discovery Service unavailable: ${error.message}`,
    });
  }
};

/**
 * Get details for a heritage site by OSM ID or Bookable Site ID
 */
const getSiteDetails = async (req, res, next) => {
  try {
    let siteId = req.params.id;
    // Decode if encoded (e.g. node%2F12345)
    siteId = decodeURIComponent(siteId);

    // If it looks like a Mongo ObjectId, look up in BookableSite first
    if (/^[0-9a-fA-F]{24}$/.test(siteId)) {
      const bookable = await BookableSite.findById(siteId).lean();
      if (bookable) {
        siteId = bookable.osmId;
      }
    }

    const site = await getSiteByOsmId(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Heritage site not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: site,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available time slots for a bookable site
 */
const getSiteSlots = async (req, res, next) => {
  try {
    let { siteId } = req.params;
    const { date } = req.query;

    siteId = decodeURIComponent(siteId);

    let bookableSite = null;
    if (/^[0-9a-fA-F]{24}$/.test(siteId)) {
      bookableSite = await BookableSite.findById(siteId);
    } else {
      bookableSite = await BookableSite.findOne({ osmId: siteId });
      if (!bookableSite) {
        const siteDetails = await getSiteByOsmId(siteId);
        if (siteDetails && siteDetails.bookableSiteId) {
          bookableSite = await BookableSite.findById(siteDetails.bookableSiteId);
        }
      }
    }

    if (!bookableSite) {
      return res.status(404).json({
        success: false,
        message: 'This heritage site is not configured for online ticket booking.',
      });
    }

    const query = {
      siteId: bookableSite._id,
      isActive: true,
    };

    const todayStr = new Date().toISOString().slice(0, 10);
    if (date) {
      query.date = date;
    } else {
      query.date = { $gte: todayStr };
    }

    const rawSlots = await TimeSlot.find(query).sort({ date: 1, startTime: 1 }).lean();

    const formattedSlots = rawSlots.map((slot) => {
      const remainingCapacity = Math.max(0, slot.capacity - slot.bookedVisitors);
      const crowdStatus = getCrowdLevel(slot.bookedVisitors, slot.capacity);

      return {
        id: slot._id,
        _id: slot._id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotTime: formatSlotRange(slot.startTime, slot.endTime),
        capacity: slot.capacity,
        bookedVisitors: slot.bookedVisitors,
        remainingCapacity,
        isAvailable: remainingCapacity > 0,
        crowdStatus,
      };
    });

    res.status(200).json({
      success: true,
      site: {
        id: bookableSite._id,
        name: bookableSite.name,
        entryFee: bookableSite.entryFee,
        openingHours: bookableSite.openingHours,
        rules: bookableSite.rules,
      },
      slots: formattedSlots,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  discover,
  getSiteDetails,
  getSiteSlots,
};

