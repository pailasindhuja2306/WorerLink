const { sequelize } = require('../config/database');
const User = require('./User');
const Worker = require('./Worker');
const Customer = require('./Customer');
const Booking = require('./Booking');
const Review = require('./Review');
const Notification = require('./Notification');
const District = require('./District');
const Mandal = require('./Mandal');
const Profession = require('./Profession');
const Category = require('./Category');

// Define associations
User.hasOne(Worker, { foreignKey: 'userId', as: 'workerProfile' });
User.hasOne(Customer, { foreignKey: 'userId', as: 'customerProfile' });
Worker.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Customer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Worker.hasMany(Booking, { foreignKey: 'workerId', as: 'bookings' });
Customer.hasMany(Booking, { foreignKey: 'customerId', as: 'bookings' });
Booking.belongsTo(Worker, { foreignKey: 'workerId', as: 'worker' });
Booking.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Worker.hasMany(Review, { foreignKey: 'workerId', as: 'reviews' });
Customer.hasMany(Review, { foreignKey: 'customerId', as: 'reviews' });
Booking.hasMany(Review, { foreignKey: 'bookingId', as: 'reviews' });
Review.belongsTo(Worker, { foreignKey: 'workerId', as: 'worker' });
Review.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Review.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

District.hasMany(Mandal, { foreignKey: 'districtId', as: 'mandals' });
Mandal.belongsTo(District, { foreignKey: 'districtId', as: 'district' });

Category.hasMany(Profession, { foreignKey: 'categoryId', as: 'professions' });
Profession.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Worker,
  Customer,
  Booking,
  Review,
  Notification,
  District,
  Mandal,
  Profession,
  Category,
  syncDatabase
};