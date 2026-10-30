const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookableSite',
      required: [true, 'Site reference is required'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Slot date (YYYY-MM-DD) is required'],
      index: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time (HH:mm) is required'],
      match: [/^\d{2}:\d{2}$/, 'Start time must be formatted as HH:mm (24-hour)'],
    },
    endTime: {
      type: String,
      required: [true, 'End time (HH:mm) is required'],
      match: [/^\d{2}:\d{2}$/, 'End time must be formatted as HH:mm (24-hour)'],
    },
    capacity: {
      type: Number,
      required: [true, 'Slot capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    bookedVisitors: {
      type: Number,
      default: 0,
      min: [0, 'Booked visitors count cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a site cannot have identical overlapping duplicate slot definition for same date & start time
timeSlotSchema.index({ siteId: 1, date: 1, startTime: 1 }, { unique: true });

// Virtual for remaining capacity
timeSlotSchema.virtual('remainingCapacity').get(function () {
  return Math.max(0, this.capacity - this.bookedVisitors);
});

// Virtual for crowd utilization percentage
timeSlotSchema.virtual('utilizationPercent').get(function () {
  if (!this.capacity || this.capacity <= 0) return 0;
  return Math.min(100, Math.round((this.bookedVisitors / this.capacity) * 100));
});

// Enable virtuals in JSON & Object
timeSlotSchema.set('toJSON', { virtuals: true });
timeSlotSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);

