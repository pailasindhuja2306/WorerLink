const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bookings by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [
        { customerId: req.params.userId },
        { workerId: req.params.userId }
      ]
    }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create booking
router.post('/', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    
    // Create notification for worker
    if (booking.workerId) {
      const notification = new Notification({
        userId: booking.workerId,
        title: 'New Booking Assigned',
        message: `You have a new booking: ${booking.task} on ${booking.scheduledDate.toLocaleString()}`,
        type: 'booking',
        bookingId: booking._id
      });
      await notification.save();
    }
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking
router.put('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify booking (admin action)
router.patch('/:id/verify', async (req, res) => {
  try {
    const { adminVerification, adminNotes } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status: 'admin_verified',
        adminVerification,
        adminNotes,
        contactDetailsShared: true,
        'liveLocationSharing.enabled': true
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Create notifications for both parties
    const customerNotification = new Notification({
      userId: booking.customerId,
      title: 'Worker Contact Details Available',
      message: `After admin verification, you now have access to your assigned worker's contact details.`,
      type: 'booking',
      bookingId: booking._id
    });

    const workerNotification = new Notification({
      userId: booking.workerId,
      title: 'Customer Contact Details Available',
      message: `After admin verification, you now have access to the customer's contact details.`,
      type: 'booking',
      bookingId: booking._id
    });

    await Promise.all([
      customerNotification.save(),
      workerNotification.save()
    ]);

    res.json(booking);
  } catch (error) {
    console.error('Error verifying booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;