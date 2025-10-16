const express = require('express');
const { District, Mandal } = require('../models');
const { chittorDistrict, chittorMandals } = require('../data/chittor-mandals');

const router = express.Router();

// @route   GET /api/locations/districts
// @desc    Get all districts
// @access  Public
router.get('/districts', async (req, res) => {
  try {
    const districts = await District.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    res.json({ districts });
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/locations/mandals
// @desc    Get all mandals for a district
// @access  Public
router.get('/mandals', async (req, res) => {
  try {
    const { districtId, districtName } = req.query;

    let whereClause = { isActive: true };
    
    if (districtId) {
      whereClause.districtId = districtId;
    } else if (districtName) {
      const district = await District.findOne({ where: { name: districtName } });
      if (district) {
        whereClause.districtId = district.id;
      }
    }

    const mandals = await Mandal.findAll({
      where: whereClause,
      include: [{ model: District, as: 'district' }],
      order: [['name', 'ASC']]
    });

    res.json({ mandals });
  } catch (error) {
    console.error('Get mandals error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/locations/chittor-mandals
// @desc    Get all Chittor mandals with detailed information
// @access  Public
router.get('/chittor-mandals', async (req, res) => {
  try {
    // Find Chittor district
    let district = await District.findOne({ where: { name: 'Chittoor' } });
    
    if (!district) {
      // Create Chittor district if it doesn't exist
      district = await District.create(chittorDistrict);
    }

    // Get all mandals for Chittor district
    const mandals = await Mandal.findAll({
      where: { 
        districtId: district.id,
        isActive: true 
      },
      order: [['name', 'ASC']]
    });

    res.json({ 
      district: district.toJSON(),
      mandals: mandals.map(mandal => mandal.toJSON())
    });
  } catch (error) {
    console.error('Get Chittor mandals error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/locations/initialize-chittor
// @desc    Initialize Chittor district and mandals data
// @access  Public (for setup)
router.post('/initialize-chittor', async (req, res) => {
  try {
    // Create or update Chittor district
    let district = await District.findOne({ where: { name: 'Chittoor' } });
    
    if (district) {
      await district.update(chittorDistrict);
    } else {
      district = await District.create(chittorDistrict);
    }

    // Clear existing mandals for Chittor
    await Mandal.destroy({ where: { districtId: district.id } });

    // Create all Chittor mandals
    const mandalsData = chittorMandals.map(mandal => ({
      ...mandal,
      districtId: district.id
    }));

    const mandals = await Mandal.bulkCreate(mandalsData);

    res.json({ 
      message: 'Chittor district and mandals initialized successfully',
      district: district.toJSON(),
      mandalsCount: mandals.length
    });
  } catch (error) {
    console.error('Initialize Chittor error:', error);
    res.status(500).json({ error: 'Server error during initialization' });
  }
});

// @route   GET /api/locations/search
// @desc    Search locations by name
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'both' } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const results = {};

    if (type === 'both' || type === 'districts') {
      const districts = await District.findAll({
        where: {
          name: {
            [require('sequelize').Op.iLike]: `%${q}%`
          },
          isActive: true
        },
        order: [['name', 'ASC']],
        limit: 10
      });
      results.districts = districts;
    }

    if (type === 'both' || type === 'mandals') {
      const mandals = await Mandal.findAll({
        where: {
          name: {
            [require('sequelize').Op.iLike]: `%${q}%`
          },
          isActive: true
        },
        include: [{ model: District, as: 'district' }],
        order: [['name', 'ASC']],
        limit: 20
      });
      results.mandals = mandals;
    }

    res.json({ results });
  } catch (error) {
    console.error('Search locations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;