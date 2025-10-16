const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 1000]
    }
  },
  type: {
    type: DataTypes.ENUM('booking', 'status_update', 'system', 'verification'),
    allowNull: false,
    defaultValue: 'system'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'notifications'
});

module.exports = Notification;