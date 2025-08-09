import { DataTypes } from 'sequelize';

const Vote = (sequelize) =>
  sequelize.define('Vote', {
    // Category of vote: 'beautiful' or 'delicious'
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["beautiful", "delicious"]],
      },
    },
    // Blockchain transaction hash for verification
    blockchainTxHash: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for backward compatibility
      unique: true, // Ensure each transaction can only be used once
    },
    // Voter's wallet address for verification
    voterAddress: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for backward compatibility
    },
  });

export default Vote;