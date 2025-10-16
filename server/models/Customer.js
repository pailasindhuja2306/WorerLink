const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
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
    enum: ['customer'],
    default: 'customer'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Customer-specific fields
  preferences: {
    maxDistance: {
      type: Number,
      default: 10
    }
  }
});

module.exports = mongoose.model('Customer', customerSchema);