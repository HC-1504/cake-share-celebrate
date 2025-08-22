// backend/models/user.js

// Use 'import' instead of 'require'
import { Model, DataTypes } from 'sequelize';

// Use 'export default' instead of 'module.exports'
export default (sequelize) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.Cake, { foreignKey: 'UserId', as: 'cakes' });
      this.hasOne(models.Vote, { foreignKey: 'UserId', as: 'vote' });
    }
  }

  User.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    password: DataTypes.STRING,
    ethAddress: DataTypes.STRING,
    category: DataTypes.STRING,
    txHash: DataTypes.STRING,
    hasPaid: DataTypes.BOOLEAN,
    checkedIn: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};