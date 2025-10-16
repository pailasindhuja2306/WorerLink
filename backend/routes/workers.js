const express = require('express');
const { body, validationResult } = require('express-validator');
const { Worker, User, Booking, Review } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/workers
// @desc    Get all workers with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      profession, 
      category, 
      district, 
      mandal, 
      minRate, 
      maxRate, 
      minRating, 
      isVerified,
      availability,
      page = 1, 
      limit = 20 
    } = req.query;

    let query = {};
    
    if (profession) query.profession = new RegExp(profession, 'i');
    if (category) query.category = category;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (availability) query.availability = availability;
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = parseFloat(minRate);
      if (maxRate) query.hourlyRate.$lte = parseFloat(maxRate);
    }

    const workers = await Worker.find(query)
      .populate('userId', 'name email phone district mandal currentLocation locationSharingEnabled')
      .sort({ rating: -1, totalJobs: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Worker.countDocuments(query);

    res.json({
      workers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/workers/:id
// @desc    Get worker by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('userId', 'name email phone district mandal currentLocation locationSharingEnabled')
      .populate({
        path: 'reviews',
        populate: {
          path: 'customerId',
          select: 'name'
        }
      });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json({ worker });
  } catch (error) {
    console.error('Get worker error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/workers/profile
// @desc    Update worker profile
// @access  Private (Worker)
router.put('/profile', auth, [
  body('profession').optional().trim().notEmpty(),
  body('category').optional().trim().notEmpty(),
  body('skills').optional().isArray(),
  body('experience').optional().isInt({ min: 0, max: 50 }),
  body('hourlyRate').optional().isFloat({ min: 0 }),
  body('availability').optional().isIn(['available', 'busy', 'offline']),
  body('bio').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.userId);
    if (!user || user.type !== 'worker') {
      return res.status(403).json({ error: 'Worker access required' });
    }

    const worker = await Worker.findOne({ userId: req.userId });
    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const allowedUpdates = ['profession', 'category', 'skills', 'experience', 'hourlyRate', 'availability', 'bio'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedWorker = await Worker.findByIdAndUpdate(
      worker._id,
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone district mandal currentLocation locationSharingEnabled');

    res.json({
      message: 'Worker profile updated successfully',
      worker: updatedWorker
    });
  } catch (error) {
    console.error('Update worker profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/workers/:id/bookings
// @desc    Get worker's bookings
// @access  Private (Worker)
router.get('/:id/bookings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.type !== 'worker') {
      return res.status(403).json({ error: 'Worker access required' });
    }

    const worker = await Worker.findById(req.params.id);
    if (!worker || worker.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 20, status } = req.query;
    
    let query = { workerId: worker._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get worker bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/workers/:id/availability
// @desc    Update worker availability
// @access  Private (Worker)
router.put('/:id/availability', auth, [
  body('availability').isIn(['available', 'busy', 'offline']).withMessage('Invalid availability status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.userId);
    if (!user || user.type !== 'worker') {
      return res.status(403).json({ error: 'Worker access required' });
    }

    const worker = await Worker.findById(req.params.id);
    if (!worker || worker.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    worker.availability = req.body.availability;
    await worker.save();

    res.json({
      message: 'Availability updated successfully',
      worker
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/workers/:id/reviews
// @desc    Get worker's reviews
// @access  Public
router.get('/:id/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ workerId: req.params.id })
      .populate('customerId', 'name')
      .populate('bookingId', 'task scheduledDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ workerId: req.params.id });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get worker reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;