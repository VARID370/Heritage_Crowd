const Booking = require('../models/Booking');
const BookableSite = require('../models/BookableSite');
const TimeSlot = require('../models/TimeSlot');
const { bookingCreateSchema } = require('../utils/validators');
const {
  generateVerificationToken,
  generateBookingReference,
  formatSlotRange,
  generateQRCodeDataURL,
} = require('../utils/qrHelper');

/**
 * Create a new ticket booking with atomic capacity reservation
 */
const createBooking = async (req, res, next) => {
  try {
    const validatedData = bookingCreateSchema.parse(req.body);
    const { siteId, slotId, date, visitorCount, visitorName, visitorEmail, visitorPhone } = validatedData;

    // Check date is not in the past
    const todayStr = new Date().toISOString().slice(0, 10);
    if (date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book tickets for past dates.',
      });
    }

    // Verify bookable site
    const site = await BookableSite.findById(siteId);
    if (!site || !site.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This heritage site is not currently accepting bookings.',
      });
    }

    // Verify verified fee is set
    if (typeof site.entryFee !== 'number' || site.entryFee < 0) {
      return res.status(400).json({
        success: false,
        message: 'Official verified entry fee is not configured for this monument.',
      });
    }

    // Atomic reservation on TimeSlot:
    // Only increment bookedVisitors if (bookedVisitors + visitorCount) <= capacity
    const updatedSlot = await TimeSlot.findOneAndUpdate(
      {
        _id: slotId,
        siteId: site._id,
        date: date,
        isActive: true,
        $expr: {
          $lte: [{ $add: ['$bookedVisitors', visitorCount] }, '$capacity'],
        },
      },
      {
        $inc: { bookedVisitors: visitorCount },
      },
      {
        new: true,
      }
    );

    if (!updatedSlot) {
      // Find why it failed
      const existingSlot = await TimeSlot.findOne({ _id: slotId, siteId: site._id, date: date });
      if (!existingSlot) {
        return res.status(404).json({
          success: false,
          message: 'Selected time slot does not exist or does not match the chosen site and date.',
        });
      }
      const remaining = Math.max(0, existingSlot.capacity - existingSlot.bookedVisitors);
      return res.status(400).json({
        success: false,
        message: `Insufficient capacity in selected slot. Requested: ${visitorCount}, Available: ${remaining}.`,
      });
    }

    // Calculate verified prices server-side
    const unitPrice = site.entryFee;
    const totalPrice = unitPrice * visitorCount;
    const bookingReference = generateBookingReference();
    const verificationToken = generateVerificationToken();
    const slotTimeReadable = formatSlotRange(updatedSlot.startTime, updatedSlot.endTime);

    let booking;
    try {
      booking = await Booking.create({
        bookingReference,
        userId: req.user._id,
        siteId: site._id,
        slotId: updatedSlot._id,
        date,
        slotTime: slotTimeReadable,
        visitorCount,
        unitPrice,
        totalPrice,
        status: 'confirmed',
        verificationToken,
        visitorName,
        visitorEmail,
        visitorPhone: visitorPhone || req.user.phone || '',
      });
    } catch (saveError) {
      // Rollback atomic slot reservation if booking record fails to save
      await TimeSlot.findByIdAndUpdate(slotId, {
        $inc: { bookedVisitors: -visitorCount },
      });
      throw saveError;
    }

    // Generate QR Code data URL for the ticket
    const qrCodeDataUrl = await generateQRCodeDataURL(booking);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: {
        booking: {
          id: booking._id,
          bookingReference: booking.bookingReference,
          date: booking.date,
          slotTime: booking.slotTime,
          visitorCount: booking.visitorCount,
          unitPrice: booking.unitPrice,
          totalPrice: booking.totalPrice,
          status: booking.status,
          visitorName: booking.visitorName,
          visitorEmail: booking.visitorEmail,
          visitorPhone: booking.visitorPhone,
          createdAt: booking.createdAt,
          site: {
            id: site._id,
            name: site.name,
            city: site.city,
            state: site.state,
            imageUrl: site.imageUrl,
            rules: site.rules,
          },
          qrCodeDataUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get authenticated user's bookings
 */
const getMyBookings = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required.',
      });
    }

    const bookings = await Booking.find({ userId: req.user._id })
      .populate('siteId', 'name city state imageUrl entryFee rules')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = bookings.map((b) => ({
      id: b._id,
      _id: b._id,
      bookingReference: b.bookingReference,
      date: b.date,
      slotTime: b.slotTime,
      visitorCount: b.visitorCount,
      unitPrice: b.unitPrice,
      totalPrice: b.totalPrice,
      status: b.status,
      visitorName: b.visitorName,
      visitorEmail: b.visitorEmail,
      visitorPhone: b.visitorPhone,
      createdAt: b.createdAt,
      site: b.siteId
        ? {
            id: b.siteId._id,
            name: b.siteId.name,
            city: b.siteId.city,
            state: b.siteId.state,
            imageUrl: b.siteId.imageUrl,
          }
        : {
            name: 'Historical Monument',
            city: '',
            state: '',
            imageUrl: '',
          },
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single ticket pass by ID or Reference
 */
const getTicketPass = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = {};
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      query = { _id: id };
    } else {
      query = { bookingReference: id.toUpperCase() };
    }

    const booking = await Booking.findOne(query)
      .populate('siteId', 'name city state category imageUrl rules openingHours coordinates')
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Ticket or booking reference not found.',
      });
    }

    // Ownership check: only owner or staff/admin can view full ticket
    const isOwner = req.user && req.user._id.toString() === booking.userId.toString();
    const isStaffOrAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'staff');

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this ticket.',
      });
    }

    const qrCodeDataUrl = await generateQRCodeDataURL(booking);

    res.status(200).json({
      success: true,
      data: {
        id: booking._id,
        _id: booking._id,
        bookingReference: booking.bookingReference,
        date: booking.date,
        slotTime: booking.slotTime,
        visitorCount: booking.visitorCount,
        unitPrice: booking.unitPrice,
        totalPrice: booking.totalPrice,
        status: booking.status,
        visitorName: booking.visitorName,
        visitorEmail: booking.visitorEmail,
        visitorPhone: booking.visitorPhone,
        checkedInAt: booking.checkedInAt,
        cancelledAt: booking.cancelledAt,
        createdAt: booking.createdAt,
        verificationToken: booking.verificationToken,
        qrCodeDataUrl,
        site: booking.siteId
          ? {
              id: booking.siteId._id,
              name: booking.siteId.name,
              city: booking.siteId.city,
              state: booking.siteId.state,
              category: booking.siteId.category,
              imageUrl: booking.siteId.imageUrl,
              rules: booking.siteId.rules,
              openingHours: booking.siteId.openingHours,
              coordinates: booking.siteId.coordinates,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a booking and restore slot capacity atomically
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Ownership check
    const isOwner = req.user && req.user._id.toString() === booking.userId.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot cancel another visitor\'s booking.',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been cancelled.',
      });
    }

    if (booking.status === 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a ticket that has already been verified and used.',
      });
    }

    // Atomic update status from 'confirmed' to 'cancelled'
    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'confirmed' },
      { status: 'cancelled', cancelledAt: new Date() },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(400).json({
        success: false,
        message: 'Booking could not be cancelled. It may have already been cancelled or processed.',
      });
    }

    // Restore capacity exactly once
    await TimeSlot.findByIdAndUpdate(booking.slotId, {
      $inc: { bookedVisitors: -booking.visitorCount },
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Ticket slot capacity restored.',
      data: {
        id: updatedBooking._id,
        bookingReference: updatedBooking.bookingReference,
        status: updatedBooking.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getTicketPass,
  cancelBooking,
};

