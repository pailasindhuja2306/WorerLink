const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Worker = sequelize.define('Worker', {
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
  profession: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  skills: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 50
    }
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  availability: {
    type: DataTypes.ENUM('available', 'busy', 'offline'),
    allowNull: false,
    defaultValue: 'available'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalJobs: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profileImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verificationNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'workers'
});

module.exports = Worker;