const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');

// Get all workers
router.get('/', async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get worker by ID
router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.json(worker);
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update worker
router.put('/:id', async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.json(worker);
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify worker
router.patch('/:id/verify', async (req, res) => {
  try {
    const { isVerified } = req.body;
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true }
    );
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.json(worker);
  } catch (error) {
    console.error('Error verifying worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;