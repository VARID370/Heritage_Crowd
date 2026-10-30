const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookableSite',
      required: [true, 'Bookable site ID is required'],
      index: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeSlot',
      required: [true, 'Time slot ID is required'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Visit date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
    },
    slotTime: {
      type: String,
      required: [true, 'Slot time representation is required'],
    },
    visitorCount: {
      type: Number,
      required: [true, 'Visitor count is required'],
      min: [1, 'At least 1 visitor is required'],
      max: [10, 'Maximum 10 visitors allowed per booking'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit ticket price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'checked_in'],
      default: 'confirmed',
      index: true,
    },
    verificationToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    visitorName: {
      type: String,
      required: [true, 'Primary visitor name is required'],
      trim: true,
    },
    visitorEmail: {
      type: String,
      required: [true, 'Primary visitor email is required'],
      trim: true,
      lowercase: true,
    },
    visitorPhone: {
      type: String,
      trim: true,
      default: '',
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);

