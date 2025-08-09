// backend/models/index.js

import { Sequelize } from 'sequelize';
import path from 'path'; // <-- 1. Import the path module
import { fileURLToPath } from 'url';

// Import your model definition functions
import User from './User.js';
import Cake from './Cake.js';
import Vote from './vote.js';

// --- This is the new, robust path creation ---
// It gets the directory name of the CURRENT file (e.g., .../backend/models)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// It then goes UP one level ('../') to get to the 'backend' folder
// and joins it with the filename.
const dbPath = path.join(__dirname, '../', 'cakepicnic.sqlite');
// --- End of new path creation ---

// 2. Initialize Sequelize using the new, correct path
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath // <-- Use the robust path here
});

// Initialize models with sequelize
const UserModel = User(sequelize);
const CakeModel = Cake(sequelize);
const VoteModel = Vote(sequelize);

// Associations
UserModel.hasMany(CakeModel);
CakeModel.belongsTo(UserModel);

UserModel.hasMany(VoteModel);
VoteModel.belongsTo(UserModel);
CakeModel.hasMany(VoteModel);
VoteModel.belongsTo(CakeModel);

// 3. Export everything as before
export { sequelize, UserModel as User, CakeModel as Cake, VoteModel as Vote };