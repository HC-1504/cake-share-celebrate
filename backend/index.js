// backend/index.js
// npm run dev -- --force
// http://localhost:8081/

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { emailConfig, emailTemplates } from './email-config.js';
import dotenv from 'dotenv';
import fs from 'fs';


// Load environment variables
dotenv.config();

// --- CORRECTED IMPORT SECTION ---
// Import everything from models/index.js
import { sequelize, User, Cake, Vote } from './models/index.js';
import { Op } from 'sequelize';

const app = express();

// --- Essential Setup & Middleware ---

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Specific CORS Configuration (CRITICAL FIX)
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// 2. Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Debug: Log the uploads directory path
console.log('Uploads directory path:', path.join(__dirname, '../uploads'));

// 3. Environment Variables (Best Practice)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-and-secure';
const PORT = process.env.PORT || 5001;

// Create email transporter
const transporter = nodemailer.createTransport(emailConfig);

// --- Multer for Image Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// --- Authentication Middleware ---
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token is missing or malformed' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded; // Contains the user's ID and email from the token
    next();
  });
}

// --- Associations ---
User.hasMany(Cake);
User.hasMany(Vote);
Cake.belongsTo(User);
Cake.hasMany(Vote);
Vote.belongsTo(User);
Vote.belongsTo(Cake);

// ========== API ROUTES ==========

// [MARKER] Registration Route (Save user data to database)
app.post('/api/register', async (req, res) => {
  // Destructure the request body (Get data from frontend)
  const { firstName, lastName, email, password, ethAddress, category, txHash } = req.body;

  // IF missing required fields, return error
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // If no error, proceed to register
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create the new user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      ethAddress,
      category,
      txHash,  // Ethereum transaction hash
      hasPaid: true,
      checkedIn: false
    });

    // Generate a JWT token (Allows immediate login after registration)
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    console.log(`✅ User ${email} registered successfully.`);

    // Sends a successful HTTP response back to the frontend
    res.status(201).json({
      message: "User registered successfully on the backend!",
      token: token
    });

  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      console.error(`Attempt to register with existing email: ${email}`);
      return res.status(400).json({ error: 'This email address is already registered.' });
    }
    console.error('Registration failed:', err);
    res.status(500).json({ error: 'An unexpected error occurred during registration.' });
  }
});

// [MARKER] Get Current User's Dashboard Data
app.get('/api/me', auth, async (req, res) => {
  try {
    // The 'auth' middleware has already verified the token and added `req.user`
    const userId = req.user.id;

    // Find the user in the database, but only select the fields we need to send
    // This is a security best practice to avoid sending sensitive data like the password hash
    const user = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'firstName', 'lastName', 'email', 'ethAddress', 'category', 'checkedIn']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // If the user is found, send their data back as JSON
    console.log(`✅ Fetched data for user: ${user.email}`);
    res.json(user);

  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});


// MARKER: - Login Route (with Debugging)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`\n--- Login Attempt for: ${email} ---`);

    if (!email || !password) {
      console.log('[DEBUG] Missing email or password.');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('[DEBUG] Finding user in database...');
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('[DEBUG] User not found in database.');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('[DEBUG] User found. ID:', user.id);
    console.log('[DEBUG] Hashed password from DB:', user.password);
    console.log('[DEBUG] Now comparing received password with stored hash...');

    const match = await bcrypt.compare(password, user.password);
    console.log('[DEBUG] bcrypt.compare result:', match); // This is the most important log

    if (!match) {
      console.log('[DEBUG] Passwords do NOT match.');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('[DEBUG] Passwords match! Generating token.');
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });

  } catch (error) {
    console.error('[ERROR] An unexpected error occurred during login:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// --- Cake and Vote Routes ---
// Helper function to delete cake file
async function deleteCakeFile(imageUrl) {
  if (imageUrl) {
    // 移除开头的斜杠，然后构建完整路径
    const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    const filePath = path.join(__dirname, '..', cleanImageUrl);
    
    console.log(`🔍 尝试删除文件: ${filePath}`);
    console.log(`📁 原始 imageUrl: ${imageUrl}`);
    console.log(`🧹 清理后的路径: ${cleanImageUrl}`);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ 成功删除文件: ${filePath}`);
        return true;
      } else {
        console.log(`❌ 文件不存在: ${filePath}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ 删除文件失败: ${filePath}`, error.message);
      return false;
    }
  }
  return false;
}

// Upload file only (without saving to database)
app.post('/api/cakes/upload-file', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('=== File Upload Request ===');
    console.log('User ID:', req.user.id);
    console.log('File:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create file URL
    const fileUrl = `/uploads/${req.file.filename}`;
    console.log('File URL:', fileUrl);
    
    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl: fileUrl
    });

  } catch (error) {
    console.error('=== Error uploading file ===');
    console.error('Error message:', error.message);
    res.status(500).json({ 
      error: 'Failed to upload file',
      details: error.message 
    });
  }
});

// Save cake to database after blockchain confirmation
app.post('/api/cakes/save-to-db', auth, async (req, res) => {
  try {
    console.log('=== Save Cake to Database ===');
    console.log('User ID:', req.user.id);
    console.log('Request body:', req.body);
    
    const { title, description, imageUrl, fileType, tableNumber, seatNumber, story, blockchainHash } = req.body;
    const userId = req.user.id;
    
    if (!title || !description || !imageUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already has a cake
    const existingCake = await Cake.findOne({ where: { UserId: userId } });
    if (existingCake) {
      return res.status(400).json({ 
        error: 'You have already uploaded a cake. Each user can only upload one cake.' 
      });
    }

    // Check if the selected seat is already occupied
    const occupiedSeat = await Cake.findOne({ 
      where: { 
        tableNumber: parseInt(tableNumber), 
        seatNumber: parseInt(seatNumber) 
      } 
    });
    
    if (occupiedSeat) {
      return res.status(400).json({ 
        error: 'This seat is already occupied. Please select a different seat.' 
      });
    }

    // Create cake record in database
    const cakeData = {
      title,
      description,
      imageUrl,
      fileType,
      tableNumber: parseInt(tableNumber),
      seatNumber: parseInt(seatNumber),
      ingredients: '', // Keep for backward compatibility
      story,
      blockchainHash, // Store the blockchain transaction hash
      UserId: userId
    };
    
    console.log('Cake data to save:', cakeData);
    
    const cake = await Cake.create(cakeData);

    console.log(`✅ Cake saved to database by user ${userId}: ${title}`);
    
    res.status(201).json({
      message: 'Cake saved to database successfully',
      cakeId: cake.id
    });

  } catch (error) {
    console.error('=== Error saving cake to database ===');
    console.error('Error message:', error.message);
    res.status(500).json({ 
      error: 'Failed to save cake to database',
      details: error.message 
    });
  }
});

app.post('/api/cakes', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('=== Cake Upload Request ===');
    console.log('User ID:', req.user.id);
    console.log('Request body:', req.body);
    console.log('File:', req.file);
    
    const { title, description, fileType, tableNumber, seatNumber, story } = req.body;
    const userId = req.user.id;
    
    if (!title || !description || !req.file) {
      console.log('Missing fields:', { title: !!title, description: !!description, file: !!req.file });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already has a cake
    const existingCake = await Cake.findOne({ where: { UserId: userId } });
    if (existingCake) {
      return res.status(400).json({ 
        error: 'You have already uploaded a cake. Each user can only upload one cake.' 
      });
    }

    // Check if the selected seat is already occupied
    const occupiedSeat = await Cake.findOne({ 
      where: { 
        tableNumber: parseInt(tableNumber), 
        seatNumber: parseInt(seatNumber) 
      } 
    });
    
    if (occupiedSeat) {
      return res.status(400).json({ 
        error: 'This seat is already occupied. Please select a different seat.' 
      });
    }

    // Create file URL
    const fileUrl = `/uploads/${req.file.filename}`;
    console.log('File URL:', fileUrl);
    
    // Create cake record in database
    const cakeData = {
      title,
      description,
      imageUrl: fileUrl,
      fileType,
      tableNumber: parseInt(tableNumber),
      seatNumber: parseInt(seatNumber),
      ingredients: '', // Keep for backward compatibility
      story,
      UserId: userId
    };
    
    console.log('Cake data to save:', cakeData);
    
    const cake = await Cake.create(cakeData);

    console.log(`✅ Cake uploaded by user ${userId}: ${title}`);
    
    res.status(201).json({
      message: 'Cake uploaded successfully',
      cakeId: cake.id,
      fileUrl: fileUrl
    });

  } catch (error) {
    console.error('=== Error uploading cake ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    res.status(500).json({ 
      error: 'Failed to upload cake',
      details: error.message 
    });
  }
});

app.get('/api/cakes', auth, async (req, res) => {
  try {
    const cakes = await Cake.findAll({
      include: [{ model: User, attributes: ['firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(cakes);
  } catch (error) {
    console.error('Error fetching cakes:', error);
    res.status(500).json({ error: 'Failed to fetch cakes' });
  }
});

// Public endpoint to get all cakes (no authentication required)
app.get('/api/cakes/public', async (req, res) => {
  try {
    const cakes = await Cake.findAll({
      include: [{ model: User, attributes: ['firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(cakes);
  } catch (error) {
    console.error('Error fetching cakes:', error);
    res.status(500).json({ error: 'Failed to fetch cakes' });
  }
});

// Get occupied seats for seat selection
app.get('/api/occupied-seats', auth, async (req, res) => {
  try {
    const occupiedSeats = await Cake.findAll({
      attributes: ['tableNumber', 'seatNumber'],
      order: [['tableNumber', 'ASC'], ['seatNumber', 'ASC']]
    });
    
    const occupiedSeatsMap = occupiedSeats.map(seat => ({
      tableNumber: seat.tableNumber,
      seatNumber: seat.seatNumber
    }));
    
    res.json(occupiedSeatsMap);
  } catch (error) {
    console.error('Error fetching occupied seats:', error);
    res.status(500).json({ error: 'Failed to fetch occupied seats' });
  }
});

// Delete cake endpoint
app.delete('/api/cakes/:id', auth, async (req, res) => {
  try {
    const cakeId = req.params.id;
    const userId = req.user.id;
    
    // Find the cake
    const cake = await Cake.findOne({
      where: { id: cakeId, UserId: userId }
    });
    
    if (!cake) {
      return res.status(404).json({ error: 'Cake not found or not owned by user' });
    }
    
    // Delete the file first
    await deleteCakeFile(cake.imageUrl);
    
    // Delete the database record
    await cake.destroy();
    
    console.log(`✅ Cake ${cakeId} deleted by user ${userId}`);
    res.json({ message: 'Cake deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting cake:', error);
    res.status(500).json({ error: 'Failed to delete cake' });
  }
});

// Edit cake endpoint (supports file upload)
app.put('/api/cakes/:id', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('🔄 收到编辑蛋糕请求');
    console.log('蛋糕ID:', req.params.id);
    console.log('用户ID:', req.user.id);
    console.log('请求体:', req.body);
    console.log('文件:', req.file);
    
    const cakeId = req.params.id;
    const userId = req.user.id;
    const { title, description, story, tableNumber, seatNumber, fileType } = req.body;
    
    // Find the cake
    const cake = await Cake.findOne({
      where: { id: cakeId, UserId: userId }
    });
    
    if (!cake) {
      return res.status(404).json({ error: 'Cake not found or not owned by user' });
    }

    // Check if the selected seat is already occupied (excluding current cake)
    if (tableNumber && seatNumber) {
      const occupiedSeat = await Cake.findOne({ 
        where: { 
          tableNumber: parseInt(tableNumber), 
          seatNumber: parseInt(seatNumber),
          id: { [Op.ne]: cakeId } // Exclude current cake
        } 
      });
      
      if (occupiedSeat) {
        return res.status(400).json({ 
          error: 'This seat is already occupied. Please select a different seat.' 
        });
      }
    }

    // Handle file upload if provided
    let newImageUrl = cake.imageUrl;
    let newFileType = cake.fileType;
    
    if (req.file) {
      // Delete old file if it exists
      if (cake.imageUrl) {
        await deleteCakeFile(cake.imageUrl);
      }
      
      // Create new file URL
      newImageUrl = `/uploads/${req.file.filename}`;
      newFileType = fileType || 'image';
      
      console.log(`📁 New file uploaded: ${newImageUrl}`);
    }
    
    // Update cake with new data
    await cake.update({
      title: title || cake.title,
      description: description || cake.description,
      story: story || cake.story,
      tableNumber: tableNumber ? parseInt(tableNumber) : cake.tableNumber,
      seatNumber: seatNumber ? parseInt(seatNumber) : cake.seatNumber,
      imageUrl: newImageUrl,
      fileType: newFileType
    });
    
    console.log(`✅ Cake ${cakeId} updated by user ${userId}`);
    res.json({ 
      message: 'Cake updated successfully',
      cake: {
        id: cake.id,
        title: cake.title,
        description: cake.description,
        story: cake.story,
        tableNumber: cake.tableNumber,
        seatNumber: cake.seatNumber,
        imageUrl: cake.imageUrl,
        fileType: cake.fileType
      }
    });
    
  } catch (error) {
    console.error('Error updating cake:', error);
    res.status(500).json({ error: 'Failed to update cake' });
  }
});

/**
 * VOTING API ENDPOINTS
 * These endpoints handle the voting process and integrate with blockchain
 */

/**
 * @route POST /api/vote
 * @desc Record a vote after blockchain transaction is confirmed
 * @access Private (requires authentication)
 * @body { cakeId, category, txHash, voterAddress }
 */
app.post('/api/vote', auth, async (req, res) => {
  try {
    // Extract vote data from request body
    const { cakeId, category, txHash, voterAddress } = req.body;
    const userId = req.user.id; // Get user ID from JWT token

    // VALIDATION STEP 1: Check required fields
    if (!cakeId || !category) {
      return res.status(400).json({ error: 'cakeId and category are required' });
    }

    // VALIDATION STEP 2: Check blockchain verification data
    if (!txHash || !voterAddress) {
      return res.status(400).json({ error: 'txHash and voterAddress are required for blockchain verification' });
    }

    // VALIDATION STEP 3: Validate category is one of the allowed values
    if (!['beautiful', 'delicious'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // VALIDATION STEP 4: Ensure user is checked in to the event
    const voter = await User.findByPk(userId);
    if (!voter) return res.status(404).json({ error: 'User not found' });
    if (!voter.checkedIn) return res.status(400).json({ error: 'Please check in before voting' });

    // VALIDATION STEP 5: Verify wallet address matches registered address
    // TEMPORARILY DISABLED FOR DEBUGGING - prevents wallet mismatch issues
    // if (voter.ethAddress.toLowerCase() !== voterAddress.toLowerCase()) {
    //   return res.status(400).json({ error: 'Voter address does not match registered wallet address' });
    // }

    // VALIDATION STEP 6: Ensure the cake exists in the database
    const cake = await Cake.findByPk(cakeId);
    if (!cake) {
      return res.status(404).json({ error: 'Cake not found' });
    }

    // VALIDATION STEP 7: Prevent duplicate voting per user per category
    // Check database for existing vote by this user in this category
    const existingVote = await Vote.findOne({
      where: { UserId: userId, category },
    });
    if (existingVote) {
      return res.status(400).json({ error: `Already voted for ${category}` });
    }

    // VALIDATION STEP 8: Prevent transaction hash reuse (security measure)
    // Each blockchain transaction can only be used once
    const existingTxVote = await Vote.findOne({
      where: { blockchainTxHash: txHash },
    });
    if (existingTxVote) {
      return res.status(400).json({ error: 'This transaction hash has already been used for voting' });
    }

    // SAVE VOTE: Create new vote record in database
    await Vote.create({
      UserId: userId,           // Link to user who voted
      CakeId: cakeId,          // Link to cake that received the vote
      category,                // Category of vote (beautiful/delicious)
      blockchainTxHash: txHash, // Blockchain transaction hash for verification
      voterAddress: voterAddress.toLowerCase() // Wallet address (normalized to lowercase)
    });

    // LOG SUCCESS: Record successful vote for monitoring
    console.log(`✅ Vote recorded: User ${userId} voted for cake ${cakeId} (${category}) - TX: ${txHash} - Address: ${voterAddress}`);

    // RETURN SUCCESS: Send confirmation back to frontend
    res.json({
      message: 'Vote recorded successfully',
      txHash,
      voterAddress,
      cakeId,
      category
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Public voting stats
app.get('/api/votes/summary', async (req, res) => {
  try {
    const votes = await Vote.findAll({ attributes: ['CakeId', 'category'] });
    const summary = votes.reduce((acc, v) => {
      if (!acc[v.CakeId]) acc[v.CakeId] = { beautiful: 0, delicious: 0 };
      acc[v.CakeId][v.category] += 1;
      return acc;
    }, {});
    res.json(summary);
  } catch (error) {
    console.error('Error fetching vote summary:', error);
    res.status(500).json({ error: 'Failed to fetch vote summary' });
  }
});

// Current user's voting status per category
app.get('/api/votes/my-status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const myVotes = await Vote.findAll({
      where: { UserId: userId },
      attributes: ['category'],
    });
    const status = { beautiful: false, delicious: false };
    for (const v of myVotes) {
      if (v.category === 'beautiful') status.beautiful = true;
      if (v.category === 'delicious') status.delicious = true;
    }
    res.json(status);
  } catch (error) {
    console.error('Error fetching my voting status:', error);
    res.status(500).json({ error: 'Failed to fetch voting status' });
  }
});

// Get detailed voting information with blockchain evidence
app.get('/api/votes/my-details', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const myVotes = await Vote.findAll({
      where: { UserId: userId },
      attributes: ['category', 'blockchainTxHash', 'voterAddress', 'createdAt'],
      include: [{
        model: Cake,
        attributes: ['id', 'title'],
        include: [{ model: User, attributes: ['firstName', 'lastName'] }]
      }],
    });

    res.json(myVotes.map(vote => ({
      category: vote.category,
      txHash: vote.blockchainTxHash,
      voterAddress: vote.voterAddress,
      timestamp: vote.createdAt,
      cake: {
        id: vote.Cake.id,
        title: vote.Cake.title,
        owner: vote.Cake.User ? `${vote.Cake.User.firstName} ${vote.Cake.User.lastName}` : 'Unknown'
      }
    })));
  } catch (error) {
    console.error('Error fetching my voting details:', error);
    res.status(500).json({ error: 'Failed to fetch voting details' });
  }
});

// Get voting results - top cakes by category
app.get('/api/voting/results', async (req, res) => {
  try {
    // Get all votes with cake and user information
    const votes = await Vote.findAll({
      include: [{
        model: Cake,
        attributes: ['id', 'title', 'description', 'story', 'imageUrl', 'fileType', 'tableNumber', 'seatNumber'],
        include: [{
          model: User,
          attributes: ['firstName', 'lastName']
        }]
      }],
      attributes: ['category', 'CakeId', 'voterAddress']
    });

    // Count votes by cake and category, and collect voter addresses
    const voteCount = {};
    const totalVotes = { beautiful: 0, delicious: 0 };

    votes.forEach(vote => {
      const cakeId = vote.CakeId;
      const category = vote.category;

      if (!voteCount[cakeId]) {
        voteCount[cakeId] = {
          beautiful: 0,
          delicious: 0,
          cake: vote.Cake,
          beautifulVoters: [],
          deliciousVoters: []
        };
      }

      voteCount[cakeId][category]++;
      totalVotes[category]++;

      // Add voter address to the appropriate category
      if (category === 'beautiful' && vote.voterAddress) {
        voteCount[cakeId].beautifulVoters.push(vote.voterAddress);
      } else if (category === 'delicious' && vote.voterAddress) {
        voteCount[cakeId].deliciousVoters.push(vote.voterAddress);
      }
    });

    // Convert to arrays and sort by vote count
    const beautifulResults = Object.values(voteCount)
      .filter(item => item.beautiful > 0)
      .map(item => ({
        ...item.cake.toJSON(),
        votes: { beautiful: item.beautiful, delicious: item.delicious },
        voters: { beautiful: item.beautifulVoters, delicious: item.deliciousVoters }
      }))
      .sort((a, b) => b.votes.beautiful - a.votes.beautiful);

    const deliciousResults = Object.values(voteCount)
      .filter(item => item.delicious > 0)
      .map(item => ({
        ...item.cake.toJSON(),
        votes: { beautiful: item.beautiful, delicious: item.delicious },
        voters: { beautiful: item.beautifulVoters, delicious: item.deliciousVoters }
      }))
      .sort((a, b) => b.votes.delicious - a.votes.delicious);

    res.json({
      beautiful: beautifulResults,
      delicious: deliciousResults,
      totalVotes
    });
  } catch (error) {
    console.error('Error fetching voting results:', error);
    res.status(500).json({ error: 'Failed to fetch voting results' });
  }
});

// --- Forgot Password Route ---
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // 查找用户
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      // 为了安全，即使邮箱不存在也返回成功消息
      return res.status(200).json({ 
        message: 'If this email is registered, a reset link will be sent to your email' 
      });
    }

    // 生成重置令牌
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 创建重置链接
    const resetLink = `http://localhost:8081/reset-password?token=${resetToken}`;

    // 使用邮件模板
    const mailOptions = {
      from: emailConfig.auth.user,
      to: email,
      ...emailTemplates.passwordReset(user.firstName, resetLink)
    };

    // 发送邮件
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to: ${email}`);
      res.status(200).json({ 
        message: 'Password reset link has been sent to your email. Please check your inbox.' 
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // 如果邮件发送失败，仍然返回成功消息以保护用户隐私
      res.status(200).json({ 
        message: 'Password reset link has been sent to your email. Please check your inbox.' 
      });
    }

  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Server error, please try again later' });
  }
});

// --- Reset Password Route ---
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // 验证令牌
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ where: { id: decoded.id } });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await user.update({ password: hashedPassword });
    
    console.log(`✅ Password reset successful for user: ${user.email}`);

    res.status(200).json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ error: 'Server error, please try again later' });
  }
});

// --- Check-in/out Routes ---
// Get current check-in status
app.get('/api/checkin/status', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check voting status from database (for reference)
    const votes = await Vote.findAll({
      where: { voterAddress: user.walletAddress || '' },
      attributes: ['category']
    });

    const votedCategories = votes.map(vote => vote.category);
    const hasVotedBeautifulDB = votedCategories.includes('beautiful');
    const hasVotedDeliciousDB = votedCategories.includes('delicious');

    // For now, we'll use database votes but indicate if blockchain might have more
    // In a full implementation, we'd check the blockchain directly here
    const hasVotedBoth = hasVotedBeautifulDB && hasVotedDeliciousDB;

    res.json({
      checkedIn: user.checkedIn || false,
      status: user.checkedIn ? 'in' : 'none',
      voting: {
        beautiful: hasVotedBeautifulDB,
        delicious: hasVotedDeliciousDB,
        both: hasVotedBoth
      },
      walletAddress: user.walletAddress // Include wallet address for frontend blockchain checks
    });
  } catch (error) {
    console.error('Error getting check-in status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

app.post('/api/checkin', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Require a cake uploaded before check-in
    const cake = await Cake.findOne({ where: { UserId: user.id } });
    if (!cake) return res.status(400).json({ error: 'Please upload your cake before check-in' });

    if (user.checkedIn) return res.status(200).json({ message: 'Already checked in', checkedIn: true });

    await user.update({ checkedIn: true });
    res.json({ message: 'Checked in successfully', checkedIn: true });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

app.post('/api/checkout', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.checkedIn) return res.status(400).json({ error: 'You must check in first' });

    // Check if user has voted for both categories
    const votes = await Vote.findAll({
      where: { voterAddress: user.walletAddress || '' },
      attributes: ['category']
    });

    const votedCategories = votes.map(vote => vote.category);
    const hasVotedBeautiful = votedCategories.includes('beautiful');
    const hasVotedDelicious = votedCategories.includes('delicious');

    if (!hasVotedBeautiful || !hasVotedDelicious) {
      const missingCategories = [];
      if (!hasVotedBeautiful) missingCategories.push('Most Beautiful');
      if (!hasVotedDelicious) missingCategories.push('Most Delicious');

      return res.status(400).json({
        error: `Please vote for ${missingCategories.join(' and ')} before checking out`
      });
    }

    await user.update({ checkedIn: false });
    res.json({ message: 'Checked out successfully', checkedIn: false });
  } catch (error) {
    console.error('Error during check-out:', error);
    res.status(500).json({ error: 'Failed to check out' });
  }
});


// Simple test route
app.get('/api', (req, res) => res.send('CakePicnic API is running!'));

// Debug endpoint to check votes in database
app.get('/api/debug/votes', async (req, res) => {
  try {
    const votes = await Vote.findAll({
      attributes: ['id', 'category', 'blockchainTxHash', 'voterAddress', 'UserId', 'CakeId', 'createdAt'],
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Cake, attributes: ['id', 'title'] }
      ]
    });
    res.json(votes);
  } catch (error) {
    console.error('Error fetching debug votes:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

// Reset endpoint to clear user's votes (for testing) - using GET for simplicity
app.get('/api/debug/reset-my-votes', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const deletedCount = await Vote.destroy({
      where: { UserId: userId }
    });
    res.json({
      message: `Successfully deleted ${deletedCount} votes for user ${userId}`,
      deletedCount
    });
  } catch (error) {
    console.error('Error resetting votes:', error);
    res.status(500).json({ error: 'Failed to reset votes' });
  }
});

// Fix missing vote endpoint
app.post('/api/debug/fix-missing-vote', auth, async (req, res) => {
  try {
    const { category, txHash, voterAddress, cakeId } = req.body;
    const userId = req.user.id;

    // Check if vote already exists
    const existingVote = await Vote.findOne({
      where: {
        blockchainTxHash: txHash
      }
    });

    if (existingVote) {
      return res.status(400).json({ error: 'Vote with this transaction hash already exists' });
    }

    // Create the missing vote
    const vote = await Vote.create({
      category,
      blockchainTxHash: txHash,
      voterAddress: voterAddress.toLowerCase(),
      UserId: userId,
      CakeId: cakeId
    });

    console.log(`✅ Fixed missing vote: User ${userId} voted for cake ${cakeId} (${category}) - TX: ${txHash}`);

    res.json({
      message: 'Missing vote added successfully',
      vote: {
        id: vote.id,
        category: vote.category,
        txHash: vote.blockchainTxHash,
        voterAddress: vote.voterAddress
      }
    });
  } catch (error) {
    console.error('Error fixing missing vote:', error);
    res.status(500).json({ error: 'Failed to fix missing vote' });
  }
});

// Debug route to check votes
app.get('/api/debug/votes', async (req, res) => {
  try {
    const votes = await Vote.findAll({
      include: [{
        model: Cake,
        attributes: ['id', 'title'],
        include: [{
          model: User,
          attributes: ['firstName', 'lastName']
        }]
      }],
      attributes: ['id', 'category', 'CakeId', 'blockchainTxHash', 'voterAddress', 'createdAt']
    });

    res.json({
      totalVotes: votes.length,
      votes: votes.map(vote => ({
        id: vote.id,
        category: vote.category,
        cakeId: vote.CakeId,
        cakeTitle: vote.Cake?.title || 'Unknown',
        cakeOwner: vote.Cake?.User ? `${vote.Cake.User.firstName} ${vote.Cake.User.lastName}` : 'Unknown',
        txHash: vote.blockchainTxHash,
        voterAddress: vote.voterAddress,
        createdAt: vote.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching debug votes:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

// Debug route to check user wallet address
app.get('/api/debug/my-wallet', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'ethAddress']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      registeredWallet: user.ethAddress,
      registeredWalletLower: user.ethAddress?.toLowerCase()
    });
  } catch (error) {
    console.error('Error fetching user wallet:', error);
    res.status(500).json({ error: 'Failed to fetch user wallet' });
  }
});


// --- Start Server ---
const startServer = async () => {
  try {
    // 先尝试连接数据库
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Schema updates for Votes table have been completed via manual migration
    // All required columns (category, blockchainTxHash, voterAddress) are now present
    console.log('✅ Database schema is up to date');
    
    // 然后同步模型，不强制重建表
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is live and running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start the server:', error);
    console.error('Error details:', error.message);
  }
};

startServer();