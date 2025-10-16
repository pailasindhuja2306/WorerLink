const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    default: null
  },
  task: {
    type: String,
    required: [true, 'Task is required'],
    trim: true,
    minlength: [3, 'Task must be at least 3 characters'],
    maxlength: [200, 'Task cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  estimatedDuration: {
    type: Number,
    required: [true, 'Estimated duration is required'],
    min: [1, 'Duration must be at least 1 hour'],
    max: [24, 'Duration cannot exceed 24 hours']
  },
  status: {
    type: String,
    enum: {
      values: [
        'pending_admin',
        'admin_verified',
        'worker_assigned',
        'accepted',
        'rejected',
        'in_progress',
        'completed',
        'cancelled'
      ],
      message: 'Invalid status'
    },
    default: 'pending_admin'
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'online'],
      message: 'Payment method must be cash or online'
    },
    default: 'cash'
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    district: String,
    mandal: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
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
  adminNotes: {
    type: String,
    trim: true
  },
  contactDetailsShared: {
    type: Boolean,
    default: false
  },
  adminVerification: {
    customerVerified: {
      type: Boolean,
      default: false
    },
    workerVerified: {
      type: Boolean,
      default: false
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    callNotes: String
  },
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  customerRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    ratedAt: Date
  },
  workerRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    ratedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ workerId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);