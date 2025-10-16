const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  preferences: {
    maxDistance: {
      type: Number,
      default: 10,
      min: [1, 'Max distance must be at least 1 km'],
      max: [100, 'Max distance cannot exceed 100 km']
    },
    preferredGender: {
      type: String,
      enum: ['male', 'female', 'any'],
      default: 'any'
    },
    preferredRate: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 1000 }
    },
    preferredTimeSlots: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String,
      endTime: String
    }],
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  totalBookings: {
    type: Number,
    default: 0,
    min: [0, 'Total bookings cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
customerSchema.index({ 'preferences.maxDistance': 1 });
customerSchema.index({ isActive: 1 });

module.exports = mongoose.model('Customer', customerSchema);