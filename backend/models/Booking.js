const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  workerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'workers',
      key: 'id'
    }
  },
  task: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 1000]
    }
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  estimatedDuration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 24
    }
  },
  status: {
    type: DataTypes.ENUM(
      'pending_admin',
      'admin_verified',
      'worker_assigned',
      'accepted',
      'rejected',
      'in_progress',
      'completed',
      'cancelled'
    ),
    allowNull: false,
    defaultValue: 'pending_admin'
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'online'),
    allowNull: false,
    defaultValue: 'cash'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  location: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  liveLocationSharing: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contactDetailsShared: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  adminVerification: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'bookings'
});

module.exports = Booking;