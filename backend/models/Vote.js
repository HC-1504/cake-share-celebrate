import { DataTypes } from 'sequelize';

/**
 * VOTE DATABASE MODEL
 * Stores voting records with blockchain verification
 * Links users, cakes, and blockchain transactions
 */
const Vote = (sequelize) =>
  sequelize.define('Vote', {
    // FIELD 1: Vote category - which contest the vote is for
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["beautiful", "delicious"]], // Only allow these two categories
      },
    },

    // FIELD 2: Blockchain transaction hash for verification
    // This links the database record to the immutable blockchain vote
    blockchainTxHash: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for backward compatibility with old votes
      unique: true,    // Ensure each blockchain transaction can only be used once
    },

    // FIELD 3: Wallet address that cast the vote
    // Used for verification and fraud prevention
    voterAddress: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for backward compatibility
    },

    // RELATIONSHIPS (defined in models/index.js):
    // - belongsTo User (UserId foreign key)
    // - belongsTo Cake (CakeId foreign key)
    // This creates a many-to-many relationship between Users and Cakes through Votes
  });

export default Vote;