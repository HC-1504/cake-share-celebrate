const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Cake', {
  title: DataTypes.STRING,
  description: DataTypes.STRING,
  imageUrl: DataTypes.STRING,
  ingredients: DataTypes.STRING,
  story: DataTypes.STRING,
});