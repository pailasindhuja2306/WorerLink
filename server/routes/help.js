const express = require('express');
const router = express.Router();
const HelpRequest = require('../models/HelpRequest');
const Notification = require('../models/Notification');

// Get all help requests (admin only)
router.get('/', async (req, res) => {
  try {
    const helpRequests = await HelpRequest.find()
      .sort({ createdAt: -1 });
    res.json(helpRequests);
  } catch (error) {
    console.error('Error fetching help requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get help requests by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const helpRequests = await HelpRequest.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(helpRequests);
  } catch (error) {
    console.error('Error fetching user help requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get help request by ID
router.get('/:id', async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }
    res.json(helpRequest);
  } catch (error) {
    console.error('Error fetching help request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create help request
router.post('/', async (req, res) => {
  try {
    const helpRequest = new HelpRequest(req.body);
    await helpRequest.save();

    // Create notification for admins
    const adminNotification = new Notification({
      userId: 'admin', // This would be a special admin user ID in a real app
      title: 'New Help Request',
      message: `New ${helpRequest.type} from ${helpRequest.userType}: ${helpRequest.subject}`,
      type: 'help_request',
      helpRequestId: helpRequest._id
    });
    await adminNotification.save();

    res.status(201).json(helpRequest);
  } catch (error) {
    console.error('Error creating help request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update help request status (admin only)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const updateData = { status };
    
    if (adminResponse) {
      updateData.adminResponse = adminResponse;
    }
    
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }

    const helpRequest = await HelpRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    // Create notification for user
    const userNotification = new Notification({
      userId: helpRequest.userId,
      title: 'Help Request Update',
      message: `Your help request "${helpRequest.subject}" has been ${status}. ${adminResponse ? 'Admin response: ' + adminResponse : ''}`,
      type: 'help_request',
      helpRequestId: helpRequest._id
    });
    await userNotification.save();

    res.json(helpRequest);
  } catch (error) {
    console.error('Error updating help request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign help request to admin
router.patch('/:id/assign', async (req, res) => {
  try {
    const { adminId } = req.body;
    const helpRequest = await HelpRequest.findByIdAndUpdate(
      req.params.id,
      { adminId, status: 'in_progress' },
      { new: true }
    );

    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    res.json(helpRequest);
  } catch (error) {
    console.error('Error assigning help request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;