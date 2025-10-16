const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profession: {
    type: String,
    required: [true, 'Profession is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years'],
    default: 0
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: [0, 'Hourly rate cannot be negative'],
    default: 0
  },
  availability: {
    type: String,
    enum: {
      values: ['available', 'busy', 'offline'],
      message: 'Availability must be available, busy, or offline'
    },
    default: 'available'
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot exceed 5'],
    default: 0
  },
  totalJobs: {
    type: Number,
    min: [0, 'Total jobs cannot be negative'],
    default: 0
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  profileImage: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: {
    type: Date
  },
  verificationNotes: {
    type: String,
    trim: true
  },
  documents: [{
    type: {
      type: String,
      enum: ['aadhar', 'pan', 'driving_license', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
workerSchema.index({ profession: 1 });
workerSchema.index({ category: 1 });
workerSchema.index({ availability: 1 });
workerSchema.index({ isVerified: 1 });
workerSchema.index({ rating: -1 });
workerSchema.index({ hourlyRate: 1 });

// Virtual for average rating calculation
workerSchema.virtual('averageRating').get(function() {
  if (this.totalJobs === 0) return 0;
  return (this.rating / this.totalJobs).toFixed(1);
});

module.exports = mongoose.model('Worker', workerSchema);