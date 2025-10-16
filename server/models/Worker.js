const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  // Inherit all User fields
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    lastUpdated: Date
  },
  locationSharingEnabled: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['worker'],
    default: 'worker'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Worker-specific fields
  profession: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  skills: [{
    type: String
  }],
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'available'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalJobs: {
    type: Number,
    default: 0
  },
  bio: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  reviews: [{
    id: String,
    customerId: String,
    bookingId: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('Worker', workerSchema);