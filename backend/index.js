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

// --- CORRECTED IMPORT SECTION ---
// Import everything from models/index.js
import { sequelize, User, Cake, Vote } from './models/index.js';

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Environment Variables (Best Practice)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-and-secure';
const PORT = process.env.PORT || 5001;

// --- Multer for Image Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
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
// Note: These need to be filled in with your actual logic if it's not already.
app.post('/api/cakes', auth, upload.single('image'), async (req, res) => { /* Your logic here */ });
app.post('/api/vote', auth, async (req, res) => { /* Your logic here */ });
app.get('/api/cakes', auth, async (req, res) => { /* Your logic here */ });

// --- Check-in/out Routes ---
// Note: These need to be filled in with your actual logic if it's not already.
app.post('/api/checkin', auth, async (req, res) => { /* Your logic here */ });
app.post('/api/checkout', auth, async (req, res) => { /* Your logic here */ });


// Simple test route
app.get('/api', (req, res) => res.send('CakePicnic API is running!'));


// --- Start Server ---
const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 Server is live and running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start the server:', error);
  }
};

startServer();