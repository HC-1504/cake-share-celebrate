import { DataTypes } from 'sequelize';

const Cake = (sequelize) => sequelize.define('Cake', {
  title: DataTypes.STRING,
  description: DataTypes.STRING,
  imageUrl: DataTypes.STRING,
  fileType: DataTypes.STRING, // 'image' or '3d'
  tableNumber: DataTypes.INTEGER,
  seatNumber: DataTypes.INTEGER,
  ingredients: DataTypes.STRING, // Keep for backward compatibility
  story: DataTypes.STRING,
  blockchainHash: DataTypes.STRING, // Store blockchain transaction hash
});

export default Cake;