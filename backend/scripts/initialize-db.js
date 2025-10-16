const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { chittorDistrict, chittorMandals } = require('../data/chittor-mandals');

// Import models
const District = require('../models/District');
const Mandal = require('../models/Mandal');
const Category = require('../models/Category');
const Profession = require('../models/Profession');
const User = require('../models/User');

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log('🚀 Initializing database...');

    // Create categories
    const categories = [
      { name: 'House Cleaning', description: 'Home cleaning and maintenance', icon: '🏠' },
      { name: 'Electrical Work', description: 'Electrical repairs and installations', icon: '⚡' },
      { name: 'Plumbing', description: 'Plumbing repairs and installations', icon: '🔧' },
      { name: 'Agriculture', description: 'Farming and agricultural work', icon: '🌾' },
      { name: 'Carpentry', description: 'Woodwork and furniture repair', icon: '🔨' },
      { name: 'Painting', description: 'House painting and decoration', icon: '🎨' },
      { name: 'Gardening', description: 'Garden maintenance and landscaping', icon: '🌱' },
      { name: 'Cooking', description: 'Home cooking and meal preparation', icon: '👨‍🍳' }
    ];

    for (const categoryData of categories) {
      await Category.findOneAndUpdate(
        { name: categoryData.name },
        categoryData,
        { upsert: true, new: true }
      );
    }

    console.log('✅ Categories created/updated');

    // Create professions
    const professions = [
      { name: 'House Cleaner', category: 'House Cleaning', description: 'Professional house cleaning services' },
      { name: 'Electrician', category: 'Electrical Work', description: 'Electrical repair and installation' },
      { name: 'Plumber', category: 'Plumbing', description: 'Plumbing repair and installation' },
      { name: 'Farmer', category: 'Agriculture', description: 'Agricultural and farming work' },
      { name: 'Carpenter', category: 'Carpentry', description: 'Woodwork and furniture repair' },
      { name: 'Painter', category: 'Painting', description: 'House painting and decoration' },
      { name: 'Gardener', category: 'Gardening', description: 'Garden maintenance and landscaping' },
      { name: 'Cook', category: 'Cooking', description: 'Home cooking and meal preparation' }
    ];

    for (const professionData of professions) {
      const category = await Category.findOne({ name: professionData.category });
      if (category) {
        await Profession.findOneAndUpdate(
          { name: professionData.name },
          {
            ...professionData,
            categoryId: category._id
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log('✅ Professions created/updated');

    // Create Chittoor district
    const district = await District.findOneAndUpdate(
      { name: 'Chittoor' },
      chittorDistrict,
      { upsert: true, new: true }
    );

    console.log('✅ Chittoor district created/updated');

    // Create Chittoor mandals
    for (const mandalData of chittorMandals) {
      await Mandal.findOneAndUpdate(
        { name: mandalData.name, districtId: district._id },
        {
          ...mandalData,
          districtId: district._id
        },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Chittoor mandals created/updated');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@labourlink.com' });
    if (!adminExists) {
      const adminUser = new User({
        name: 'Admin User',
        username: 'admin',
        email: 'admin@labourlink.com',
        phone: '9876543000',
        password: 'admin123',
        district: 'Chittoor',
        mandal: 'Chittoor',
        gender: 'male',
        type: 'admin',
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create sample worker
    const workerExists = await User.findOne({ email: 'worker@labourlink.com' });
    if (!workerExists) {
      const workerUser = new User({
        name: 'Sample Worker',
        username: 'worker',
        email: 'worker@labourlink.com',
        phone: '9876543210',
        password: 'worker123',
        district: 'Chittoor',
        mandal: 'Tirupati',
        gender: 'male',
        type: 'worker',
        isActive: true
      });

      await workerUser.save();

      // Create worker profile
      const Worker = require('../models/Worker');
      const workerProfile = new Worker({
        userId: workerUser._id,
        profession: 'House Cleaner',
        category: 'House Cleaning',
        skills: ['Deep Cleaning', 'Window Cleaning', 'Kitchen Cleaning'],
        experience: 3,
        hourlyRate: 200,
        availability: 'available',
        rating: 4.8,
        totalJobs: 45,
        bio: 'Professional house cleaner with 3 years experience. Specialized in deep cleaning and maintenance.',
        isVerified: true
      });

      await workerProfile.save();
      console.log('✅ Sample worker created');
    } else {
      console.log('ℹ️ Sample worker already exists');
    }

    // Create sample customer
    const customerExists = await User.findOne({ email: 'customer@labourlink.com' });
    if (!customerExists) {
      const customerUser = new User({
        name: 'Sample Customer',
        username: 'customer',
        email: 'customer@labourlink.com',
        phone: '9876543200',
        password: 'customer123',
        district: 'Chittoor',
        mandal: 'Chittoor',
        gender: 'female',
        type: 'customer',
        isActive: true
      });

      await customerUser.save();

      // Create customer profile
      const Customer = require('../models/Customer');
      const customerProfile = new Customer({
        userId: customerUser._id,
        preferences: {
          maxDistance: 10,
          preferredGender: 'any',
          preferredRate: { min: 0, max: 500 }
        }
      });

      await customerProfile.save();
      console.log('✅ Sample customer created');
    } else {
      console.log('ℹ️ Sample customer already exists');
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log('\n📋 Sample Accounts:');
    console.log('Admin: admin@labourlink.com / admin123');
    console.log('Worker: worker@labourlink.com / worker123');
    console.log('Customer: customer@labourlink.com / customer123');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run initialization
initializeDatabase();