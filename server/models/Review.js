const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  workerId: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  bookingId: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);