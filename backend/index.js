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
Vote.belongsTo(User);

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

app.post('/api/vote', auth, async (req, res) => {
  try {
    const { cakeId } = req.body;
    const userId = req.user.id;
    
    // Check if user already voted for this cake
    const existingVote = await Vote.findOne({
      where: { UserId: userId, CakeId: cakeId }
    });
    
    if (existingVote) {
      return res.status(400).json({ error: 'Already voted for this cake' });
    }
    
    // Create vote
    await Vote.create({
      UserId: userId,
      CakeId: cakeId
    });
    
    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Failed to record vote' });
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
// Note: These need to be filled in with your actual logic if it's not already.
app.post('/api/checkin', auth, async (req, res) => { /* Your logic here */ });
app.post('/api/checkout', auth, async (req, res) => { /* Your logic here */ });


// Simple test route
app.get('/api', (req, res) => res.send('CakePicnic API is running!'));


// --- Start Server ---
const startServer = async () => {
  try {
    // 先尝试连接数据库
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
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