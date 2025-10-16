const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Worker, Customer } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('username').trim().isLength({ min: 3, max: 50 }).isAlphanumeric().withMessage('Username must be 3-50 alphanumeric characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').isMobilePhone('en-IN').withMessage('Please provide a valid Indian mobile number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('district').notEmpty().withMessage('District is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('type').isIn(['customer', 'worker', 'admin']).withMessage('Type must be customer, worker, or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, username, email, phone, password, district, mandal, gender, type, ...additionalData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      phone,
      password,
      district,
      mandal,
      gender,
      type
    });

    // Create profile based on user type
    if (type === 'worker') {
      await Worker.create({
        userId: user.id,
        profession: additionalData.profession || '',
        category: additionalData.category || '',
        skills: additionalData.skills || [],
        experience: additionalData.experience || 0,
        hourlyRate: additionalData.hourlyRate || 0,
        bio: additionalData.bio || '',
        availability: 'available'
      });
    } else if (type === 'customer') {
      await Customer.create({
        userId: user.id,
        preferences: additionalData.preferences || { maxDistance: 10 }
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('identifier').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    // Find user by email or username
    const user = await User.findOne({
      where: {
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() }
        ]
      },
      include: [
        { model: Worker, as: 'workerProfile' },
        { model: Customer, as: 'customerProfile' }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Validate password
    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [
        { model: Worker, as: 'workerProfile' },
        { model: Customer, as: 'customerProfile' }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;