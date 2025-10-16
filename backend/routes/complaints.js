const express = require('express');
const { body, validationResult } = require('express-validator');
const { Complaint, User, Booking, Notification } = require('../models');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/complaints/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

// @route   POST /api/complaints
// @desc    Create a new complaint
// @access  Private (Customer)
router.post('/', auth, upload.array('attachments', 5), [
  body('type').isIn(['worker_issue', 'payment_issue', 'service_quality', 'safety_concern', 'app_technical', 'other'])
    .withMessage('Invalid complaint type'),
  body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be 5-200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('bookingId').optional().isMongoId().withMessage('Invalid booking ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, subject, description, priority = 'medium', bookingId } = req.body;
    const customerId = req.userId;

    // Verify booking belongs to customer if provided
    if (bookingId) {
      const booking = await Booking.findOne({ 
        _id: bookingId, 
        customerId: customerId 
      });
      if (!booking) {
        return res.status(400).json({ error: 'Booking not found or does not belong to you' });
      }
    }

    // Prepare attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      url: `/uploads/complaints/${file.filename}`
    })) : [];

    // Create complaint
    const complaint = new Complaint({
      customerId,
      bookingId: bookingId || null,
      type,
      subject,
      description,
      priority,
      attachments
    });

    await complaint.save();

    // Create notification for admins
    const admins = await User.find({ type: 'admin', isActive: true });
    const notifications = admins.map(admin => ({
      userId: admin._id,
      title: 'New Complaint Received',
      message: `New ${type.replace('_', ' ')} complaint from customer: ${subject}`,
      type: 'complaint',
      complaintId: complaint._id,
      priority: priority === 'urgent' ? 'urgent' : 'high',
      metadata: {
        complaintId: complaint._id,
        customerId: customerId,
        complaintType: type
      }
    }));

    await Notification.insertMany(notifications);

    // Create notification for customer
    const customerNotification = new Notification({
      userId: customerId,
      title: 'Complaint Submitted',
      message: `Your complaint "${subject}" has been submitted and will be reviewed by our admin team.`,
      type: 'complaint',
      complaintId: complaint._id,
      metadata: {
        complaintId: complaint._id,
        status: 'submitted'
      }
    });

    await customerNotification.save();

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: complaint
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Server error while creating complaint' });
  }
});

// @route   GET /api/complaints
// @desc    Get user's complaints
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const userId = req.userId;
    const user = await User.findById(userId);

    let query = { customerId: userId };
    
    if (status) query.status = status;
    if (type) query.type = type;

    const complaints = await Complaint.find(query)
      .populate('bookingId', 'task scheduledDate status')
      .populate('assignedAdmin', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Complaint.countDocuments(query);

    res.json({
      complaints,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Server error while fetching complaints' });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get specific complaint
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('bookingId', 'task scheduledDate status totalAmount')
      .populate('assignedAdmin', 'name email')
      .populate('adminResponse.adminId', 'name email');

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check if user has access to this complaint
    const userId = req.userId;
    const user = await User.findById(userId);
    
    if (complaint.customerId._id.toString() !== userId && user.type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ complaint });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ error: 'Server error while fetching complaint' });
  }
});

// @route   PUT /api/complaints/:id/status
// @desc    Update complaint status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', auth, [
  body('status').isIn(['open', 'in_progress', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  body('adminResponse.message').optional().trim().isLength({ min: 1, max: 1000 })
    .withMessage('Admin response must be 1-1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.userId);
    if (user.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, adminResponse } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const updateData = { status };
    
    if (adminResponse) {
      updateData.adminResponse = {
        message: adminResponse.message,
        respondedAt: new Date(),
        adminId: req.userId
      };
    }

    if (status === 'resolved') {
      updateData.resolution = {
        notes: adminResponse?.message || 'Complaint resolved',
        resolvedAt: new Date(),
        resolvedBy: req.userId
      };
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('customerId', 'name email');

    // Notify customer about status update
    const customerNotification = new Notification({
      userId: complaint.customerId,
      title: 'Complaint Status Updated',
      message: `Your complaint "${complaint.subject}" status has been updated to ${status}.`,
      type: 'complaint',
      complaintId: complaint._id,
      metadata: {
        complaintId: complaint._id,
        status: status
      }
    });

    await customerNotification.save();

    res.json({
      message: 'Complaint status updated successfully',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({ error: 'Server error while updating complaint' });
  }
});

// @route   POST /api/complaints/:id/rating
// @desc    Rate complaint resolution
// @access  Private (Customer)
router.post('/:id/rating', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().trim().isLength({ max: 500 }).withMessage('Feedback cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, feedback } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.customerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({ error: 'Complaint must be resolved before rating' });
    }

    complaint.customerSatisfaction = {
      rating,
      feedback,
      ratedAt: new Date()
    };

    await complaint.save();

    res.json({
      message: 'Thank you for your feedback',
      complaint: complaint
    });
  } catch (error) {
    console.error('Rate complaint error:', error);
    res.status(500).json({ error: 'Server error while rating complaint' });
  }
});

// @route   GET /api/complaints/admin/all
// @desc    Get all complaints (Admin only)
// @access  Private (Admin)
router.get('/admin/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 20, status, priority, type } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;

    const complaints = await Complaint.find(query)
      .populate('customerId', 'name email phone')
      .populate('bookingId', 'task scheduledDate status')
      .populate('assignedAdmin', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Complaint.countDocuments(query);

    res.json({
      complaints,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all complaints error:', error);
    res.status(500).json({ error: 'Server error while fetching complaints' });
  }
});

module.exports = router;