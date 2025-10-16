const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Mandal = sequelize.define('Mandal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  districtId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'districts',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  coordinates: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  population: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  area: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'mandals'
});

module.exports = Mandal;