const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['customer', 'worker'],
    required: true
  },
  type: {
    type: String,
    enum: ['complaint', 'help', 'technical_issue', 'general_inquiry'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  adminId: {
    type: String
  },
  adminResponse: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  bookingId: String // If related to a specific booking
});

// Update the updatedAt field before saving
helpRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('HelpRequest', helpRequestSchema);