const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Worker = require('../models/Worker');

// Get reviews by worker ID
router.get('/worker/:workerId', async (req, res) => {
  try {
    const reviews = await Review.find({ workerId: req.params.workerId })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create review
router.post('/', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();

    // Update worker's average rating
    const workerReviews = await Review.find({ workerId: review.workerId });
    const averageRating = workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length;
    
    await Worker.findByIdAndUpdate(review.workerId, {
      rating: parseFloat(averageRating.toFixed(1)),
      $push: { reviews: review }
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;