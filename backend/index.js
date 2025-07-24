const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { sequelize, User, Cake, Vote } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const JWT_SECRET = 'supersecretkey'; // Change this in production!

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// --- Registration (with payment simulation) ---
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ email, password: hashed, hasPaid: true });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(400).json({ error: 'Registration failed' });
  }
});

// --- Login ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// --- Upload Cake ---
app.post('/api/cakes', auth, upload.single('image'), async (req, res) => {
  const { title, description, ingredients, story } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  try {
    const cake = await Cake.create({
      UserId: req.user.id,
      title,
      description,
      imageUrl,
      ingredients,
      story,
    });
    res.json({ message: 'Cake uploaded!', cake });
  } catch (err) {
    res.status(400).json({ error: 'Failed to upload cake' });
  }
});

// --- Voting (one vote per user) ---
app.post('/api/vote', auth, async (req, res) => {
  const { cakeId } = req.body;
  if (!cakeId) return res.status(400).json({ error: 'No cakeId' });
  try {
    // Only one vote per user
    const existing = await Vote.findOne({ where: { UserId: req.user.id } });
    if (existing) return res.status(400).json({ error: 'You already voted' });
    const vote = await Vote.create({ UserId: req.user.id, CakeId: cakeId });
    res.json({ message: 'Vote recorded', vote });
  } catch (err) {
    res.status(400).json({ error: 'Failed to vote' });
  }
});

// --- Check-in ---
app.post('/api/checkin', auth, async (req, res) => {
  try {
    await User.update({ checkedIn: true }, { where: { id: req.user.id } });
    res.json({ message: 'Checked in' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to check in' });
  }
});

// --- Check-out ---
app.post('/api/checkout', auth, async (req, res) => {
  try {
    await User.update({ checkedIn: false }, { where: { id: req.user.id } });
    res.json({ message: 'Checked out' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to check out' });
  }
});

// --- Get all cakes (for voting page) ---
app.get('/api/cakes', auth, async (req, res) => {
  const cakes = await Cake.findAll({ include: [{ model: User, attributes: ['email'] }] });
  res.json(cakes);
});

app.get('/', (req, res) => res.send('API running!'));

// Sync database and start server
sequelize.sync().then(() => {
  app.listen(5000, () => console.log('Server started on http://localhost:5000'));
});