const Booking = require('../models/Booking');
const VerificationLog = require('../models/VerificationLog');
const { verificationSchema } = require('../utils/validators');

/**
 * Verify and admit a ticket pass (Staff / Admin only)
 */
const verifyTicket = async (req, res, next) => {
  try {
    const validatedData = verificationSchema.parse(req.body);
    const { token, bookingReference, method } = validatedData;

    let query = {};
    if (token) {
      // Support raw token or JSON payload parsed from QR
      try {
        const parsed = JSON.parse(token);
        if (parsed.tok) query = { verificationToken: parsed.tok };
        else if (parsed.ref) query = { bookingReference: parsed.ref.toUpperCase() };
        else query = { verificationToken: token };
      } catch (e) {
        query = { verificationToken: token };
      }
    } else if (bookingReference) {
      query = { bookingReference: bookingReference.trim().toUpperCase() };
    }

    const booking = await Booking.findOne(query).populate('siteId', 'name city state');

    // 1. Invalid Ticket (Not found)
    if (!booking) {
      await VerificationLog.create({
        bookingId: null,
        bookingReference: bookingReference || 'UNKNOWN',
        verifiedBy: req.user._id,
        verifiedByName: req.user.name,
        method: method || 'manual',
        outcome: 'invalid',
        notes: 'No booking record found matching provided reference or token.',
      });

      return res.status(404).json({
        success: false,
        outcome: 'invalid',
        message: 'Invalid Ticket: No matching booking record found.',
      });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const siteName = booking.siteId ? booking.siteId.name : 'Heritage Monument';

    // 2. Cancelled Ticket
    if (booking.status === 'cancelled') {
      await VerificationLog.create({
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        verifiedBy: req.user._id,
        verifiedByName: req.user.name,
        method: method || 'qr_scan',
        outcome: 'cancelled',
        visitorName: booking.visitorName,
        siteName,
        notes: `Attempted entry on cancelled ticket (cancelled at ${booking.cancelledAt || 'prior'}).`,
      });

      return res.status(400).json({
        success: false,
        outcome: 'cancelled',
        message: 'Entry Denied: This booking was cancelled and is no longer valid.',
        data: {
          bookingReference: booking.bookingReference,
          visitorName: booking.visitorName,
          cancelledAt: booking.cancelledAt,
        },
      });
    }

    // 3. Already Used Ticket
    if (booking.status === 'checked_in') {
      await VerificationLog.create({
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        verifiedBy: req.user._id,
        verifiedByName: req.user.name,
        method: method || 'qr_scan',
        outcome: 'already_used',
        visitorName: booking.visitorName,
        siteName,
        notes: `Duplicate entry attempt. Previously verified at ${booking.checkedInAt}.`,
      });

      return res.status(409).json({
        success: false,
        outcome: 'already_used',
        message: 'Entry Denied: This ticket has already been used for entry.',
        data: {
          bookingReference: booking.bookingReference,
          visitorName: booking.visitorName,
          checkedInAt: booking.checkedInAt,
        },
      });
    }

    // 4. Not yet valid / Future or Past Date check
    if (booking.date > todayStr) {
      await VerificationLog.create({
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        verifiedBy: req.user._id,
        verifiedByName: req.user.name,
        method: method || 'qr_scan',
        outcome: 'not_yet_valid',
        visitorName: booking.visitorName,
        siteName,
        notes: `Ticket is scheduled for future date: ${booking.date} (Today: ${todayStr}).`,
      });

      return res.status(400).json({
        success: false,
        outcome: 'not_yet_valid',
        message: `Entry Denied: Ticket is scheduled for a future date (${booking.date}).`,
        data: {
          bookingReference: booking.bookingReference,
          visitorName: booking.visitorName,
          scheduledDate: booking.date,
          todayDate: todayStr,
        },
      });
    }

    // 5. Valid Ticket: Concurrency-safe atomic check-in
    const checkedInBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'confirmed' },
      {
        status: 'checked_in',
        checkedInAt: new Date(),
        checkedInBy: req.user._id,
      },
      { new: true }
    );

    if (!checkedInBooking) {
      // Race condition check: another staff verified it simultaneously
      return res.status(409).json({
        success: false,
        outcome: 'already_used',
        message: 'Entry Denied: Ticket was just checked in by another gate terminal.',
      });
    }

    // Log successful entry
    const log = await VerificationLog.create({
      bookingId: checkedInBooking._id,
      bookingReference: checkedInBooking.bookingReference,
      verifiedBy: req.user._id,
      verifiedByName: req.user.name,
      method: method || 'qr_scan',
      outcome: 'valid',
      visitorName: checkedInBooking.visitorName,
      siteName,
      notes: `Admitted ${checkedInBooking.visitorCount} visitor(s). Slot: ${checkedInBooking.slotTime}.`,
    });

    res.status(200).json({
      success: true,
      outcome: 'valid',
      message: 'Ticket Verified Successfully: Visitor Admitted',
      data: {
        bookingReference: checkedInBooking.bookingReference,
        visitorName: checkedInBooking.visitorName,
        visitorCount: checkedInBooking.visitorCount,
        siteName,
        date: checkedInBooking.date,
        slotTime: checkedInBooking.slotTime,
        checkedInAt: checkedInBooking.checkedInAt,
        verifiedBy: req.user.name,
        logId: log._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get verification logs (Staff / Admin only)
 */
const getVerificationLogs = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const logs = await VerificationLog.find()
      .sort({ verifiedAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyTicket,
  getVerificationLogs,
};

