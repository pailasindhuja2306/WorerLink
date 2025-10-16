const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Worker = require('../models/Worker');
const Customer = require('../models/Customer');

// Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // In a real app, verify password hash
    // For demo purposes, we accept any password
    res.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email.toLowerCase() },
        { username: userData.username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let newUser;

    if (userData.type === 'worker') {
      newUser = new Worker({
        name: userData.name,
        username: userData.username,
        email: userData.email.toLowerCase(),
        phone: userData.phone,
        district: userData.district,
        gender: userData.gender,
        profession: userData.profession,
        category: userData.category,
        skills: userData.skills || [],
        experience: userData.experience || 0,
        hourlyRate: userData.hourlyRate || 0,
        bio: userData.bio || '',
        type: 'worker'
      });
    } else if (userData.type === 'customer') {
      newUser = new Customer({
        name: userData.name,
        username: userData.username,
        email: userData.email.toLowerCase(),
        phone: userData.phone,
        district: userData.district,
        gender: userData.gender,
        preferences: userData.preferences || { maxDistance: 10 },
        type: 'customer'
      });
    } else {
      newUser = new User({
        name: userData.name,
        username: userData.username,
        email: userData.email.toLowerCase(),
        phone: userData.phone,
        district: userData.district,
        gender: userData.gender,
        type: userData.type || 'customer'
      });
    }

    await newUser.save();
    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;