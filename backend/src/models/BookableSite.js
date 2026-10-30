const mongoose = require('mongoose');

const bookableSiteSchema = new mongoose.Schema(
  {
    osmId: {
      type: String,
      required: [true, 'OSM identifier is required to map discovered site'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Heritage site name is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['fort', 'palace', 'monument', 'archaeological_site', 'historic', 'temple_heritage', 'other'],
      default: 'monument',
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imageAttribution: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    entryFee: {
      type: Number,
      required: [true, 'Verified entry fee in INR is required'],
      min: [0, 'Entry fee cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    crowdCapacityPerSlot: {
      type: Number,
      default: 150,
      min: [1, 'Capacity must be at least 1'],
    },
    openingHours: {
      type: String,
      default: '09:00 AM - 05:30 PM',
    },
    rules: {
      type: [String],
      default: [
        'Government ID proof required for each visitor at entry.',
        'Entry allowed only during the booked time slot.',
        'Ticket is valid for one-time admission only.',
        'Photography regulations apply as per monument guidelines.',
      ],
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BookableSite', bookableSiteSchema);

