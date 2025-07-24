const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './cakepicnic.sqlite'
});

const User = require('./User')(sequelize);
const Cake = require('./Cake')(sequelize);
const Vote = require('./vote')(sequelize); // Fix casing to match file system

// Associations
User.hasMany(Cake);
Cake.belongsTo(User);

User.hasOne(Vote);
Vote.belongsTo(User);
Cake.hasMany(Vote);
Vote.belongsTo(Cake);

module.exports = { sequelize, User, Cake, Vote };