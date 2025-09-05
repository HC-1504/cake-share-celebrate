// backend/models/user.js

import { Model, DataTypes } from 'sequelize';

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
    hasPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // ✅ timestamps for checkin / checkout
    checkedInAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    checkedOutAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};
