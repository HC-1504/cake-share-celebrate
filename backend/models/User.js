const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  hasPaid: { type: DataTypes.BOOLEAN, defaultValue: false },
  checkedIn: { type: DataTypes.BOOLEAN, defaultValue: false },
});