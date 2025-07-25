import { DataTypes } from 'sequelize';

const Cake = (sequelize) => sequelize.define('Cake', {
  title: DataTypes.STRING,
  description: DataTypes.STRING,
  imageUrl: DataTypes.STRING,
  ingredients: DataTypes.STRING,
  story: DataTypes.STRING,
});

export default Cake;