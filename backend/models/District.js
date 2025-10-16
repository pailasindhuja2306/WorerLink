const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const District = sequelize.define('District', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  coordinates: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'districts'
});

module.exports = District;