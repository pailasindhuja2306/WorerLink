const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true
  },
  workerId: {
    type: String
  },
  task: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending_admin', 'admin_verified', 'worker_assigned', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'],
    default: 'pending_admin'
  },
  paymentMethod: {
    type: String,
    enum: ['cash'],
    default: 'cash'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  location: {
    address: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    latitude: Number,
    longitude: Number
  },
  liveLocationSharing: {
    enabled: {
      type: Boolean,
      default: false
    },
    customerLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      lastUpdated: Date
    },
    workerLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      lastUpdated: Date
    }
  },
  adminNotes: String,
  contactDetailsShared: {
    type: Boolean,
    default: false
  },
  adminVerification: {
    customerVerified: Boolean,
    workerVerified: Boolean,
    adminId: String,
    verifiedAt: Date,
    callNotes: String
  }
});

// Update the updatedAt field before saving
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);