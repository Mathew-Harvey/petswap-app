require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient()
prisma.$connect().then(() => console.log("DB connected")).catch(console.error);
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// CORS - allow requests from the web frontend
const allowedOrigins = [
  'https://petswap-web.onrender.com',
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Alternative dev server
];
// Add any origins from ALLOWED_ORIGINS env var
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
    if (origin.trim()) allowedOrigins.push(origin.trim());
  });
}
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, firstName, lastName, phone }
    });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Properties
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      include: { user: { select: { firstName: true, lastName: true } } }
    });
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { 
        user: { select: { firstName: true, lastName: true } },
        reviews: { include: { user: { select: { firstName: true } } } }
      }
    });
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/properties', authenticate, async (req, res) => {
  try {
    const { title, description, address, city, country, bedrooms, bathrooms, petsAllowed, amenities, images } = req.body;
    
    const property = await prisma.property.create({
      data: {
        userId: req.userId,
        title, description, address, city, country,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        petsAllowed, amenities: JSON.stringify(amenities), images: JSON.stringify(images)
      }
    });
    
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bookings
app.get('/api/bookings', authenticate, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.userId },
      include: { property: true }
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', authenticate, async (req, res) => {
  try {
    const { propertyId, startDate, endDate } = req.body;
    
    const booking = await prisma.booking.create({
      data: {
        propertyId: parseInt(propertyId),
        userId: req.userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      include: { property: true }
    });
    
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
