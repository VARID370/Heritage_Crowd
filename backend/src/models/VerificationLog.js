const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    bookingReference: {
      type: String,
      required: true,
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verifiedByName: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    method: {
      type: String,
      enum: ['qr_scan', 'manual'],
      default: 'qr_scan',
    },
    outcome: {
      type: String,
      enum: ['valid', 'cancelled', 'already_used', 'not_yet_valid', 'invalid'],
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    visitorName: {
      type: String,
      default: '',
    },
    siteName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VerificationLog', verificationLogSchema);

