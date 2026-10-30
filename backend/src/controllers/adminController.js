const BookableSite = require('../models/BookableSite');
const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');
const { configureSiteSchema, createSlotSchema } = require('../utils/validators');
const { getCrowdLevel } = require('../services/crowdService');
const { formatSlotRange } = require('../utils/qrHelper');

/**
 * Get aggregated crowd management analytics for admin dashboard
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Core counters
    const [
      totalSites,
      activeSites,
      totalBookings,
      todayBookings,
      cancelledBookings,
      checkedInBookings,
    ] = await Promise.all([
      BookableSite.countDocuments(),
      BookableSite.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ date: todayStr }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ status: 'checked_in' }),
    ]);

    // 2. Revenue and visitor totals
    const financialStats = await Booking.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalVisitors: { $sum: '$visitorCount' },
        },
      },
    ]);

    const totalRevenue = financialStats[0]?.totalRevenue || 0;
    const totalVisitors = financialStats[0]?.totalVisitors || 0;

    // Today's visitors
    const todayVisitorStats = await Booking.aggregate([
      {
        $match: { date: todayStr, status: { $ne: 'cancelled' } },
      },
      {
        $group: {
          _id: null,
          todayVisitors: { $sum: '$visitorCount' },
          todayRevenue: { $sum: '$totalPrice' },
        },
      },
    ]);

    const todayVisitors = todayVisitorStats[0]?.todayVisitors || 0;
    const todayRevenue = todayVisitorStats[0]?.todayRevenue || 0;

    // 3. Today's slots crowd utilization analysis
    const todaySlots = await TimeSlot.find({ date: todayStr, isActive: true })
      .populate('siteId', 'name city state')
      .sort({ startTime: 1 })
      .lean();

    const crowdAnalysis = todaySlots.map((slot) => {
      const remainingCapacity = Math.max(0, slot.capacity - slot.bookedVisitors);
      const crowd = getCrowdLevel(slot.bookedVisitors, slot.capacity);

      return {
        id: slot._id,
        siteName: slot.siteId ? slot.siteId.name : 'Unknown Site',
        city: slot.siteId ? slot.siteId.city : '',
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotTime: formatSlotRange(slot.startTime, slot.endTime),
        capacity: slot.capacity,
        bookedVisitors: slot.bookedVisitors,
        remainingCapacity,
        utilizationPercent: crowd.percent,
        crowdLevel: crowd.level,
        crowdLabel: crowd.label,
        crowdColor: crowd.color,
      };
    });

    // 4. Site-wise booking volume for Recharts
    const siteVolume = await Booking.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } },
      },
      {
        $group: {
          _id: '$siteId',
          bookingCount: { $sum: 1 },
          visitorCount: { $sum: '$visitorCount' },
          revenue: { $sum: '$totalPrice' },
        },
      },
      {
        $lookup: {
          from: 'bookablesites',
          localField: '_id',
          foreignField: '_id',
          as: 'site',
        },
      },
      {
        $unwind: '$site',
      },
      {
        $project: {
          siteId: '$_id',
          name: '$site.name',
          bookingCount: 1,
          visitorCount: 1,
          revenue: 1,
        },
      },
      {
        $sort: { visitorCount: -1 },
      },
    ]);

    // 5. Overall today's capacity utilization summary
    const overallTodayCapacity = todaySlots.reduce((sum, s) => sum + s.capacity, 0);
    const overallTodayBooked = todaySlots.reduce((sum, s) => sum + s.bookedVisitors, 0);
    const overallTodayCrowd = getCrowdLevel(overallTodayBooked, overallTodayCapacity);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSites,
          activeSites,
          totalBookings,
          todayBookings,
          cancelledBookings,
          checkedInBookings,
          totalRevenue,
          totalVisitors,
          todayVisitors,
          todayRevenue,
          overallTodayCapacity,
          overallTodayBooked,
          overallCrowdStatus: overallTodayCrowd,
        },
        crowdAnalysis,
        siteVolume,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Configure or create a bookable heritage site
 */
const configureSite = async (req, res, next) => {
  try {
    const validatedData = configureSiteSchema.parse(req.body);

    const site = await BookableSite.findOneAndUpdate(
      { osmId: validatedData.osmId },
      {
        ...validatedData,
        verifiedBy: req.user._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Bookable heritage site configured successfully',
      data: site,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all internally configured bookable sites
 */
const getAllSites = async (req, res, next) => {
  try {
    const sites = await BookableSite.find().sort({ name: 1 }).lean();

    const todayStr = new Date().toISOString().slice(0, 10);

    const enriched = await Promise.all(
      sites.map(async (site) => {
        const slots = await TimeSlot.find({ siteId: site._id, date: todayStr, isActive: true }).lean();
        const totalCapacity = slots.reduce((sum, s) => sum + s.capacity, 0);
        const totalBooked = slots.reduce((sum, s) => sum + s.bookedVisitors, 0);
        const crowd = getCrowdLevel(totalBooked, totalCapacity);

        return {
          ...site,
          todaySlotsCount: slots.length,
          todayCapacity: totalCapacity,
          todayBooked: totalBooked,
          crowdStatus: crowd,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update site configuration without affecting booking history
 */
const updateSite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { entryFee, crowdCapacityPerSlot, isActive, openingHours, rules, description } = req.body;

    const updates = {};
    if (entryFee !== undefined) updates.entryFee = entryFee;
    if (crowdCapacityPerSlot !== undefined) updates.crowdCapacityPerSlot = crowdCapacityPerSlot;
    if (isActive !== undefined) updates.isActive = isActive;
    if (openingHours !== undefined) updates.openingHours = openingHours;
    if (rules !== undefined) updates.rules = rules;
    if (description !== undefined) updates.description = description;

    const updatedSite = await BookableSite.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedSite) {
      return res.status(404).json({
        success: false,
        message: 'Bookable site not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Site configuration updated successfully',
      data: updatedSite,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new slot for a site
 */
const createSlot = async (req, res, next) => {
  try {
    const validatedData = createSlotSchema.parse(req.body);

    const site = await BookableSite.findById(validatedData.siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Bookable site not found.',
      });
    }

    const slot = await TimeSlot.create({
      siteId: site._id,
      date: validatedData.date,
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      capacity: validatedData.capacity,
    });

    res.status(201).json({
      success: true,
      message: 'Time slot created successfully',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookings across the platform (Admin / Staff)
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { siteId, status, date, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (siteId) query.siteId = siteId;
    if (status) query.status = status;
    if (date) query.date = date;
    if (search) {
      query.$or = [
        { bookingReference: { $regex: search.trim(), $options: 'i' } },
        { visitorName: { $regex: search.trim(), $options: 'i' } },
        { visitorEmail: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('siteId', 'name city state')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  configureSite,
  getAllSites,
  updateSite,
  createSlot,
  getAllBookings,
};

