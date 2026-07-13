import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and parsing middlewares
app.use(cors());
app.use(express.json());

// Database file paths (Local JSON Fallback)
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

// --- Seed Data definitions ---
const SEED_PRODUCTS = [
  {
    id: 'iphone-15-pro',
    name: 'Apple iPhone 15 Pro (Titanium Gray, 128 GB)',
    category: 'mobiles',
    price: 129990,
    originalPrice: 134900,
    rating: 4.7,
    reviewsCount: 1845,
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80',
    description: 'Experience iPhone 15 Pro. Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.',
    specifications: [
      { key: 'Display', value: '6.1-inch Super Retina XDR OLED' },
      { key: 'Processor', value: 'A17 Pro Chip with 6-Core GPU' },
      { key: 'Rear Camera', value: '48MP Main + 12MP Ultra Wide + 12MP Telephoto' },
      { key: 'Front Camera', value: '12MP TrueDepth Front Camera' }
    ],
    influencerCommissionRate: 0.02,
    userCommissionRate: 0.005,
    inStock: true
  },
  {
    id: 'samsung-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra 5G (Titanium Yellow, 256 GB)',
    category: 'mobiles',
    price: 129999,
    originalPrice: 139999,
    rating: 4.8,
    reviewsCount: 942,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity and possibility.',
    specifications: [
      { key: 'Display', value: '6.8-inch Dynamic AMOLED 2X, QHD+' },
      { key: 'Processor', value: 'Snapdragon 8 Gen 3 for Galaxy' },
      { key: 'Rear Camera', value: '200MP Main + 50MP + 12MP + 10MP Quad Camera' }
    ],
    influencerCommissionRate: 0.02,
    userCommissionRate: 0.005,
    inStock: true
  },
  {
    id: 'macbook-air-m3',
    name: 'Apple MacBook Air M3 (13.6-inch, 8GB RAM, 256GB SSD)',
    category: 'electronics',
    price: 104900,
    originalPrice: 114900,
    rating: 4.6,
    reviewsCount: 320,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'The MacBook Air with M3 chip is superportable, superfast, and supercharged for work, play, and everything you do. Up to 18 hours of battery life.',
    specifications: [
      { key: 'Display', value: '13.6-inch Liquid Retina Display' },
      { key: 'Processor', value: 'Apple M3 Chip with 8-Core CPU' }
    ],
    influencerCommissionRate: 0.03,
    userCommissionRate: 0.01,
    inStock: true
  },
  {
    id: 'sony-wh1000xm5',
    name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones (Black)',
    category: 'electronics',
    price: 29990,
    originalPrice: 34990,
    rating: 4.5,
    reviewsCount: 2712,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'With two processors controlling eight microphones, Auto NC Optimizer for automatically optimizing noise cancelling, and a specially designed driver unit.',
    specifications: [
      { key: 'Type', value: 'Over-ear, Closed-back wireless' },
      { key: 'Battery Life', value: 'Up to 30 Hours with ANC On' }
    ],
    influencerCommissionRate: 0.03,
    userCommissionRate: 0.012,
    inStock: true
  },
  {
    id: 'leather-biker-jacket',
    name: 'AbKharido Leather Biker Jacket - Slim Fit (Pitch Black)',
    category: 'fashion',
    price: 4999,
    originalPrice: 9999,
    rating: 4.2,
    reviewsCount: 88,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    description: 'Add a rugged edge to your outfit with this pure leather biker jacket. Crafted from top-grade sheepskin leather, it features custom metal hardware and dual lining.',
    specifications: [
      { key: 'Material', value: '100% Genuine Sheepskin Leather' },
      { key: 'Fit', value: 'Slim Fit Biker Cut' }
    ],
    influencerCommissionRate: 0.07,
    userCommissionRate: 0.03,
    inStock: true
  }
];

const SEED_USERS = {
  amit_kumar: {
    username: 'amit_kumar',
    fullName: 'Amit Kumar',
    email: 'amit.kumar@gmail.com',
    isInfluencer: false,
    influencerId: '',
    walletCoins: 120,
    walletCash: 0.00,
    ordersCount: 5,
    payoutDetails: { upi: '', bankAccount: '', bankIfsc: '' }
  },
  ria_reviews: {
    username: 'ria_reviews',
    fullName: 'Ria Sharma',
    email: 'ria.reviews@instagram.com',
    isInfluencer: true,
    influencerId: 'ria_reviews',
    walletCoins: 45,
    walletCash: 1250.00,
    ordersCount: 22,
    payoutDetails: { upi: 'ria@okaxis', bankAccount: '998877665544', bankIfsc: 'HDFC0000123' }
  }
};

const SEED_STATS = {
  clicks: 14,
  conversions: 2,
  history: [
    { id: 'TXN-101', date: '2026-06-25', productName: 'Sony WH-1000XM5 Wireless Headphones', type: 'user', rate: 0.012, amount: 29990, earnings: 360, status: 'Approved' },
    { id: 'TXN-902', date: '2026-07-02', productName: 'FlexRun Pro Men Red Running Shoes', type: 'user', rate: 0.03, amount: 2499, earnings: 75, status: 'Pending' }
  ],
  payouts: []
};

// --- MongoDB Setup or Fallback ---
const mongoUri = process.env.MONGODB_URI;
let dbClient = null;
let db = null;
let isMongo = false;
let isConnecting = false;
const LOCAL_OTPS = new Map();

async function getDb() {
  if (db) return db;
  
  if (isConnecting) {
    // Wait a brief moment for ongoing connection
    await new Promise(resolve => setTimeout(resolve, 300));
    return getDb();
  }

  isConnecting = true;
  if (mongoUri) {
    try {
      // Set short connect timeouts so Vercel Serverless Function doesn't hang
      dbClient = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      await dbClient.connect();
      db = dbClient.db();
      isMongo = true;
      console.log('Connected to MongoDB Atlas successfully.');
      await seedMongoDb();
    } catch (err) {
      console.error('MongoDB Atlas connection failed. Falling back to local/memory state:', err.message);
      isMongo = false;
      await ensureLocalDbExists();
    }
  } else {
    isMongo = false;
    await ensureLocalDbExists();
  }
  isConnecting = false;
  return db;
}

// --- Seed MongoDB Collections ---
async function seedMongoDb() {
  const productsCount = await db.collection('products').countDocuments();
  if (productsCount === 0) {
    await db.collection('products').insertMany(SEED_PRODUCTS);
  }

  const usersCount = await db.collection('users').countDocuments();
  if (usersCount === 0) {
    const userDocs = Object.keys(SEED_USERS).map(username => ({
      _id: username,
      ...SEED_USERS[username]
    }));
    await db.collection('users').insertMany(userDocs);
  }

  const statsCount = await db.collection('stats').countDocuments();
  if (statsCount === 0) {
    await db.collection('stats').insertOne({ _id: 'global_stats', ...SEED_STATS });
  }
}

// --- Seed Local JSON Files ---
async function ensureLocalDbExists() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    try { await fs.access(PRODUCTS_FILE); } catch {
      await fs.writeFile(PRODUCTS_FILE, JSON.stringify(SEED_PRODUCTS, null, 2));
    }
    try { await fs.access(USERS_FILE); } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify(SEED_USERS, null, 2));
    }
    try { await fs.access(ORDERS_FILE); } catch {
      await fs.writeFile(ORDERS_FILE, JSON.stringify([], null, 2));
    }
    try { await fs.access(STATS_FILE); } catch {
      await fs.writeFile(STATS_FILE, JSON.stringify(SEED_STATS, null, 2));
    }
  } catch (err) {
    console.error('Failed to create local databases:', err);
  }
}

// --- Database Abstractions Layer ---
async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// 1. PRODUCTS DB HELPERS
async function getProducts() {
  await getDb();
  if (isMongo) {
    return await db.collection('products').find({}).toArray();
  } else {
    return await readJson(PRODUCTS_FILE);
  }
}

async function saveProduct(newProduct) {
  await getDb();
  if (isMongo) {
    await db.collection('products').insertOne(newProduct);
  } else {
    const products = await readJson(PRODUCTS_FILE);
    products.push(newProduct);
    await writeJson(PRODUCTS_FILE, products);
  }
}

async function deleteProduct(productId) {
  await getDb();
  if (isMongo) {
    await db.collection('products').deleteOne({ id: productId });
  } else {
    const products = await readJson(PRODUCTS_FILE);
    const filtered = products.filter(p => p.id !== productId);
    await writeJson(PRODUCTS_FILE, filtered);
  }
}

async function getUsersMap() {
  await getDb();
  let map = {};
  if (isMongo) {
    const usersList = await db.collection('users').find({}).toArray();
    usersList.forEach(u => {
      const { _id, ...rest } = u;
      map[_id] = { username: _id, ...rest };
    });
  } else {
    map = await readJson(USERS_FILE);
  }

  // Auto-generate random referralCode and creatorCode tokens if missing
  let modified = false;
  Object.keys(map).forEach(username => {
    const u = map[username];
    if (!u.referralCode) {
      u.referralCode = 'REF-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      modified = true;
    }
    if (u.isInfluencer && !u.creatorCode) {
      u.creatorCode = 'AFF-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      modified = true;
    }
  });

  if (modified) {
    await saveUsersMap(map);
  }

  return map;
}

async function saveUsersMap(usersMap, modifiedUsernames = null) {
  await getDb();
  if (isMongo) {
    let targets = Object.keys(usersMap);
    if (modifiedUsernames) {
      targets = Array.isArray(modifiedUsernames) ? modifiedUsernames : [modifiedUsernames];
    }
    for (const username of targets) {
      if (usersMap[username]) {
        const userDoc = { _id: username, ...usersMap[username] };
        await db.collection('users').replaceOne({ _id: username }, userDoc, { upsert: true });
      }
    }
  } else {
    await writeJson(USERS_FILE, usersMap);
  }
}

// 3. ORDERS DB HELPERS
async function getOrders() {
  await getDb();
  if (isMongo) {
    return await db.collection('orders').find({}).toArray();
  } else {
    return await readJson(ORDERS_FILE);
  }
}

async function saveOrders(ordersList) {
  await getDb();
  if (isMongo) {
    await db.collection('orders').deleteMany({});
    if (ordersList.length > 0) {
      await db.collection('orders').insertMany(ordersList);
    }
  } else {
    await writeJson(ORDERS_FILE, ordersList);
  }
}

// 4. STATS DB HELPERS
async function getStats() {
  await getDb();
  if (isMongo) {
    const doc = await db.collection('stats').findOne({ _id: 'global_stats' });
    if (doc) {
      const { _id, ...rest } = doc;
      return rest;
    }
    return SEED_STATS;
  } else {
    return await readJson(STATS_FILE);
  }
}

async function saveStats(statsData) {
  await getDb();
  if (isMongo) {
    await db.collection('stats').replaceOne({ _id: 'global_stats' }, { _id: 'global_stats', ...statsData }, { upsert: true });
  } else {
    await writeJson(STATS_FILE, statsData);
  }
}

async function resetAllDatabases() {
  await getDb();
  if (isMongo) {
    await db.collection('products').deleteMany({});
    await db.collection('products').insertMany(SEED_PRODUCTS);

    await db.collection('users').deleteMany({});
    const userDocs = Object.keys(SEED_USERS).map(username => ({
      _id: username,
      ...SEED_USERS[username]
    }));
    await db.collection('users').insertMany(userDocs);

    await db.collection('orders').deleteMany({});

    await db.collection('stats').deleteMany({});
    await db.collection('stats').insertOne({ _id: 'global_stats', ...SEED_STATS });
  } else {
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(SEED_PRODUCTS, null, 2));
    await fs.writeFile(USERS_FILE, JSON.stringify(SEED_USERS, null, 2));
    await fs.writeFile(ORDERS_FILE, JSON.stringify([], null, 2));
    await fs.writeFile(STATS_FILE, JSON.stringify(SEED_STATS, null, 2));
  }
}

// --- OTP Database Helpers ---
async function saveOtpCode(recipient, otpCode) {
  await getDb();
  const expiry = Date.now() + 5 * 60 * 1000; // 5 mins expiry
  if (isMongo) {
    await db.collection('otps').replaceOne(
      { _id: recipient },
      { _id: recipient, code: otpCode, expiry },
      { upsert: true }
    );
  } else {
    LOCAL_OTPS.set(recipient, { code: otpCode, expiry });
  }
}

async function verifyOtpCode(recipient, otpCode) {
  await getDb();
  if (isMongo) {
    const entry = await db.collection('otps').findOne({ _id: recipient });
    if (!entry) return false;
    if (Date.now() > entry.expiry) {
      await db.collection('otps').deleteOne({ _id: recipient });
      return false;
    }
    const isCorrect = entry.code === otpCode;
    if (isCorrect) {
      await db.collection('otps').deleteOne({ _id: recipient });
    }
    return isCorrect;
  } else {
    const entry = LOCAL_OTPS.get(recipient);
    if (!entry) return false;
    if (Date.now() > entry.expiry) {
      LOCAL_OTPS.delete(recipient);
      return false;
    }
    const isCorrect = entry.code === otpCode;
    if (isCorrect) {
      LOCAL_OTPS.delete(recipient);
    }
    return isCorrect;
  }
}

// --- API Endpoints ---

// 1. PRODUCTS DATABASE ROUTES
app.get('/api/products', async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const products = await getProducts();
    const newProduct = req.body;

    if (products.some(p => p.id === newProduct.id)) {
      return res.status(400).json({ error: 'Product ID already exists' });
    }

    await saveProduct(newProduct);
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const products = await getProducts();
    const { id } = req.params;

    const exists = products.some(p => p.id === id);
    if (!exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await deleteProduct(id);
    res.json({ success: true, removedId: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove product' });
  }
});

// 2. USER PROFILE & AUTH SIMULATION
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { recipient, isSignup } = req.body;
    
    // Check if recipient is a valid email or phone
    const isEmail = recipient.includes('@');
    
    const users = await getUsersMap();
    const formattedUsername = recipient.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    if (isSignup) {
      // Check duplicate email/phone registries
      const exists = Object.values(users).some(u => 
        u.email.toLowerCase() === recipient.toLowerCase() || 
        u.username.toLowerCase() === formattedUsername
      );
      if (exists) {
        return res.status(400).json({ error: 'This email or phone number is already registered.' });
      }
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to database with 5 min expiry
    await saveOtpCode(recipient, generatedOtp);

    // Print delivery alert to console
    if (isEmail) {
      console.log(`[SMTP EMAIL SIMULATION] Sent OTP ${generatedOtp} to ${recipient}`);
    } else {
      console.log(`[SMS GATEWAY SIMULATION] Sent OTP ${generatedOtp} to ${recipient}`);
    }

    // Return the generated OTP for live on-screen testing!
    res.json({ success: true, otp: generatedOtp });
  } catch (err) {
    console.error('Failed to send OTP:', err);
    res.status(500).json({ error: 'Server authentication process error.' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { recipient, otp, isSignup, fullName } = req.body;

    const isValid = await verifyOtpCode(recipient, otp);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP verification code.' });
    }

    const users = await getUsersMap();
    const formattedUsername = recipient.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    let user = Object.values(users).find(u => 
      u.email.toLowerCase() === recipient.toLowerCase() || 
      u.username.toLowerCase() === formattedUsername
    );

    if (!user) {
      // Create user profile on signup or first login
      user = {
        username: formattedUsername,
        fullName: 'Guest User',
        firstName: '',
        lastName: '',
        phone: recipient,
        email: '',
        emailVerified: false,
        pincode: '',
        address: '',
        isInfluencer: false,
        influencerId: '',
        walletCoins: 0,
        walletCash: 0,
        ordersCount: 0,
        payoutDetails: { upi: '', bankAccount: '', bankIfsc: '' }
      };
      
      users[formattedUsername] = user;
      await saveUsersMap(users, formattedUsername);
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Failed to verify OTP:', err);
    res.status(500).json({ error: 'Authentication verification failure.' });
  }
});

// Update User Profile API
app.post('/api/users/:username/update', async (req, res) => {
  try {
    const users = await getUsersMap();
    const { username } = req.params;
    const { firstName, lastName, email, pincode, address, emailVerified, isInfluencer, creatorCode, influencerId, walletCoins, walletCash } = req.body;

    if (!users[username]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[username];
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (pincode !== undefined) user.pincode = pincode;
    if (address !== undefined) user.address = address;
    if (emailVerified !== undefined) user.emailVerified = emailVerified;
    if (isInfluencer !== undefined) user.isInfluencer = isInfluencer;
    if (creatorCode !== undefined) user.creatorCode = creatorCode;
    if (influencerId !== undefined) user.influencerId = influencerId;
    if (walletCoins !== undefined) user.walletCoins = Number(walletCoins);
    if (walletCash !== undefined) user.walletCash = Number(walletCash);

    // Recalculate fullName
    if (user.firstName || user.lastName) {
      user.fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    } else {
      user.fullName = 'Guest User';
    }

    await saveUsersMap(users, username);
    res.json(user);
  } catch (err) {
    console.error('Failed to update user profile:', err);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

app.get('/api/users/:username', async (req, res) => {
  try {
    const users = await getUsersMap();
    const { username } = req.params;
    const user = users[username];

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsersMap();
    res.json(Object.values(users));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

app.post('/api/users/register-creator', async (req, res) => {
  try {
    const users = await getUsersMap();
    const { username, influencerId, payoutDetails } = req.body;

    if (!users[username]) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[username].isInfluencer = true;
    users[username].influencerId = influencerId;
    users[username].payoutDetails = {
      ...users[username].payoutDetails,
      ...payoutDetails
    };

    await saveUsersMap(users, username);
    res.json(users[username]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to register creator profile' });
  }
});

// 3. STATS & REVENUE HISTORY
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

app.post('/api/stats/click', async (req, res) => {
  try {
    const stats = await getStats();
    stats.clicks += 1;
    await saveStats(stats);
    res.json({ success: true, clicks: stats.clicks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record click' });
  }
});

// 4. MOCK WITHDRAW PAYOUTS
app.post('/api/payouts', async (req, res) => {
  try {
    const users = await getUsersMap();
    const stats = await getStats();
    const { username, amount, method } = req.body;

    const user = users[username];
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (amount > user.walletCash) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Deduct cash balance
    user.walletCash -= amount;
    
    // Add to payout history log
    const payoutRecord = {
      id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      method,
      status: 'Processing'
    };

    stats.payouts = [payoutRecord, ...(stats.payouts || [])];

    await saveUsersMap(users, username);
    await saveStats(stats);

    res.json({ success: true, user, payoutRecord });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

// 5. CHEKOUT & ORDER REGISTRATION (ATTRIBUTION PROCESS)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await getOrders();
    const { email } = req.query;
    if (email && email !== 'admin') {
      const users = await getUsersMap();
      const user = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        // Return only this customer's orders
        const filtered = orders.filter(o => o.customerUsername === user.username);
        return res.json(filtered);
      }
      return res.json([]);
    }
    // Return all orders if email query is absent or is 'admin'
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orders = await getOrders();
    const users = await getUsersMap();
    const stats = await getStats();

    const { cart, username, shippingAddress, paymentMethod, useCoinsDiscount, activeReferral, cfOrderId } = req.body;

    const user = users[username];
    if (!user) return res.status(404).json({ error: 'Buyer account not found' });

    const itemsPrice = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const coinsDiscountValue = useCoinsDiscount ? Math.min(user.walletCoins, itemsPrice) : 0;
    const deliveryCharge = itemsPrice > 500 ? 0 : 40;
    const finalAmount = itemsPrice - coinsDiscountValue + deliveryCharge;

    const orderId = `OD-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const isCod = paymentMethod === 'Cash on Delivery';
    
    // Generate Delhivery tracking details (Delhivery 12-digit numeric AWB style)
    const trackingNumber = `14${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const courierPartner = 'Delhivery';

    const newOrder = {
      id: orderId,
      cfOrderId: cfOrderId || null,
      customerUsername: username,
      date: new Date().toISOString().split('T')[0],
      items: cart,
      itemsPrice,
      coinsDiscountValue,
      deliveryCharge,
      finalAmount,
      shippingAddress,
      paymentMethod,
      status: isCod ? 'Packed' : 'Processing',
      paymentStatus: isCod ? 'SUCCESS' : 'PENDING',
      referralApplied: activeReferral || null,
      trackingNumber,
      courierPartner
    };

    // Process Referral Commissions immediately ONLY if Cash on Delivery (COD)
    if (isCod && activeReferral) {
      const { type, referrerId } = activeReferral;
      
      let totalCommissionEarned = 0;
      cart.forEach(item => {
        const rate = type === 'aff' ? item.product.influencerCommissionRate : item.product.userCommissionRate;
        totalCommissionEarned += item.product.price * item.quantity * rate;
      });

      totalCommissionEarned = Math.round(totalCommissionEarned * 100) / 100;

      if (type === 'aff') {
        const creatorProfile = Object.values(users).find(u => u.creatorCode === referrerId || u.influencerId === referrerId);
        if (creatorProfile) {
          creatorProfile.walletCash += totalCommissionEarned;
        }

        const newHistoryTxn = {
          id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().split('T')[0],
          productName: cart.length === 1 ? cart[0].product.name : `${cart[0].product.name.substring(0, 25)}... (+${cart.length - 1} items)`,
          type: 'influencer',
          rate: 'Dynamic',
          amount: itemsPrice,
          earnings: totalCommissionEarned,
          status: 'Approved'
        };

        stats.conversions += 1;
        stats.history = [newHistoryTxn, ...stats.history];

      } else if (type === 'ref') {
        const coinsEarned = Math.round(totalCommissionEarned);
        const userProfile = Object.values(users).find(u => u.referralCode === referrerId || u.username === referrerId);
        if (userProfile) {
          userProfile.walletCoins += coinsEarned;
        }

        const newHistoryTxn = {
          id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().split('T')[0],
          productName: cart.length === 1 ? cart[0].product.name : `${cart[0].product.name.substring(0, 25)}... (+${cart.length - 1} items)`,
          type: 'user',
          rate: 'Dynamic',
          amount: itemsPrice,
          earnings: coinsEarned,
          status: 'Approved'
        };

        stats.conversions += 1;
        stats.history = [newHistoryTxn, ...stats.history];
      }
    }

    user.walletCoins -= coinsDiscountValue;
    user.ordersCount += 1;

    orders.unshift(newOrder);
    await saveOrders(orders);
    
    const modifiedUsernames = [user.username];
    if (isCod && activeReferral) {
      const { type, referrerId } = activeReferral;
      if (type === 'aff') {
        const creatorProfile = Object.values(users).find(u => u.creatorCode === referrerId || u.influencerId === referrerId);
        if (creatorProfile) {
          modifiedUsernames.push(creatorProfile.username);
        }
      } else if (type === 'ref') {
        const userProfile = Object.values(users).find(u => u.referralCode === referrerId || u.username === referrerId);
        if (userProfile) {
          modifiedUsernames.push(userProfile.username);
        }
      }
    }
    await saveUsersMap(users, modifiedUsernames);
    await saveStats(stats);

    res.json({ order: newOrder, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place purchase order' });
  }
});

// 5.5 CASHFREE TRANSACTION STATUS VERIFICATION
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { orderId } = req.body;
    const orders = await getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId || o.cfOrderId === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[orderIndex];

    if (order.paymentStatus === 'SUCCESS') {
      const users = await getUsersMap();
      const user = users[order.customerUsername];
      return res.json({ success: true, status: 'SUCCESS', order, user });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const isProd = process.env.CASHFREE_PROD === 'true';

    let orderStatus = 'PAID'; // Default to PAID (Simulated success) if keys not loaded
    
    if (appId && secretKey && order.cfOrderId && !order.cfOrderId.startsWith('cf_order_mock')) {
      const url = isProd
        ? `https://api.cashfree.com/pg/orders/${order.cfOrderId}`
        : `https://sandbox.cashfree.com/pg/orders/${order.cfOrderId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': appId,
          'x-client-secret': secretKey
        }
      });

      if (response.ok) {
        const cfData = await response.json();
        orderStatus = cfData.order_status; // PAID, ACTIVE, FAILED, etc.
      }
    }

    if (orderStatus === 'PAID') {
      order.paymentStatus = 'SUCCESS';
      order.status = 'Packed';
      
      // Process Referral Commissions now since payment is verified!
      if (order.referralApplied) {
        const users = await getUsersMap();
        const stats = await getStats();
        const { type, referrerId } = order.referralApplied;
        
        let totalCommissionEarned = 0;
        order.items.forEach(item => {
          const rate = type === 'aff' ? item.product.influencerCommissionRate : item.product.userCommissionRate;
          totalCommissionEarned += item.product.price * item.quantity * rate;
        });
        totalCommissionEarned = Math.round(totalCommissionEarned * 100) / 100;

        if (type === 'aff') {
          const creatorProfile = Object.values(users).find(u => u.creatorCode === referrerId || u.influencerId === referrerId);
          if (creatorProfile) {
            creatorProfile.walletCash += totalCommissionEarned;
          }
          const newHistoryTxn = {
            id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split('T')[0],
            productName: order.items.length === 1 ? order.items[0].product.name : `${order.items[0].product.name.substring(0, 25)}... (+${order.items.length - 1} items)`,
            type: 'influencer',
            rate: 'Dynamic',
            amount: order.itemsPrice,
            earnings: totalCommissionEarned,
            status: 'Approved'
          };
          stats.conversions += 1;
          stats.history = [newHistoryTxn, ...stats.history];
        } else if (type === 'ref') {
          const coinsEarned = Math.round(totalCommissionEarned);
          const userProfile = Object.values(users).find(u => u.referralCode === referrerId || u.username === referrerId);
          if (userProfile) {
            userProfile.walletCoins += coinsEarned;
          }
          const newHistoryTxn = {
            id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split('T')[0],
            productName: order.items.length === 1 ? order.items[0].product.name : `${order.items[0].product.name.substring(0, 25)}... (+${order.items.length - 1} items)`,
            type: 'user',
            rate: 'Dynamic',
            amount: order.itemsPrice,
            earnings: coinsEarned,
            status: 'Approved'
          };
          stats.conversions += 1;
          stats.history = [newHistoryTxn, ...stats.history];
        }

        const modifiedUsernames = [];
        if (type === 'aff') {
          const creatorProfile = Object.values(users).find(u => u.creatorCode === referrerId || u.influencerId === referrerId);
          if (creatorProfile) {
            modifiedUsernames.push(creatorProfile.username);
          }
        } else if (type === 'ref') {
          const userProfile = Object.values(users).find(u => u.referralCode === referrerId || u.username === referrerId);
          if (userProfile) {
            modifiedUsernames.push(userProfile.username);
          }
        }
        await saveUsersMap(users, modifiedUsernames);
        await saveStats(stats);
      }

      await saveOrders(orders);
      const users = await getUsersMap();
      const user = users[order.customerUsername];
      res.json({ success: true, status: 'SUCCESS', order, user });
    } else if (orderStatus === 'FAILED' || orderStatus === 'EXPIRED') {
      order.paymentStatus = 'FAILED';
      await saveOrders(orders);
      const users = await getUsersMap();
      const user = users[order.customerUsername];
      res.json({ success: false, status: 'FAILED', order, user });
    } else {
      res.json({ success: false, status: 'PENDING', order });
    }
  } catch (err) {
    console.error('Payment verification failed:', err);
    res.status(500).json({ error: 'Failed to verify transaction status.' });
  }
});

// 5.8 CUSTOMER ORDER CANCELLATION & ADMIN STATUS UPDATES
app.post('/api/orders/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = await getOrders();
    const users = await getUsersMap();

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[orderIndex];
    if (order.status === 'Delivered' || order.status === 'In Transit') {
      return res.status(400).json({ error: 'Cannot cancel order once it is shipped or delivered.' });
    }

    const oldStatus = order.status;
    order.status = 'CANCELLED';
    const oldPaymentStatus = order.paymentStatus;
    order.paymentStatus = 'REFUNDED';

    // Refund coins to buyer if spent
    const buyer = users[order.customerUsername];
    if (buyer) {
      buyer.walletCoins += order.coinsDiscountValue || 0;
      buyer.ordersCount = Math.max(0, buyer.ordersCount - 1);
    }

    // Deduct referral commissions if previously credited
    if (oldPaymentStatus === 'SUCCESS' && order.referralApplied) {
      const { type, referrerId } = order.referralApplied;
      let totalCommissionEarned = 0;
      order.items.forEach(item => {
        const rate = type === 'aff' ? item.product.influencerCommissionRate : item.product.userCommissionRate;
        totalCommissionEarned += item.product.price * item.quantity * rate;
      });
      totalCommissionEarned = Math.round(totalCommissionEarned * 100) / 100;

      if (type === 'aff') {
        const creator = Object.values(users).find(u => u.creatorCode === referrerId || u.influencerId === referrerId);
        if (creator) {
          creator.walletCash = Math.max(0, creator.walletCash - totalCommissionEarned);
        }
      } else if (type === 'ref') {
        const referrer = Object.values(users).find(u => u.referralCode === referrerId || u.username === referrerId);
        if (referrer) {
          referrer.walletCoins = Math.max(0, referrer.walletCoins - Math.round(totalCommissionEarned));
        }
      }
    }

    await saveOrders(orders);
    
    const modifiedUsernames = [];
    if (buyer) {
      modifiedUsernames.push(buyer.username);
    }
    if (oldPaymentStatus === 'SUCCESS' && order.referralApplied) {
      const { type, referrerId } = order.referralApplied;
      if (type === 'aff') {
        const creator = Object.values(users).find(u => u.creatorCode === referrerId || u.influencerId === referrerId);
        if (creator) {
          modifiedUsernames.push(creator.username);
        }
      } else if (type === 'ref') {
        const referrer = Object.values(users).find(u => u.referralCode === referrerId || u.username === referrerId);
        if (referrer) {
          modifiedUsernames.push(referrer.username);
        }
      }
    }
    await saveUsersMap(users, modifiedUsernames);

    res.json({ success: true, order, user: buyer });
  } catch (err) {
    console.error('Cancel order failed:', err);
    res.status(500).json({ error: 'Failed to process order cancellation.' });
  }
});

app.post('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await getOrders();

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    orders[orderIndex].status = status;
    await saveOrders(orders);

    res.json({ success: true, order: orders[orderIndex] });
  } catch (err) {
    console.error('Update order status failed:', err);
    res.status(500).json({ error: 'Failed to update order milestone status.' });
  }
});

// 6. DB SYSTEM REINITIALIZATION
app.post('/api/reset', async (req, res) => {
  try {
    await resetAllDatabases();
    res.json({ success: true, message: 'Database reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset system database files' });
  }
});

// 7. CASHFREE PAYMENT SESSION GENERATION
app.post('/api/payment/session', async (req, res) => {
  try {
    const { amount, customerId, customerPhone, customerEmail } = req.body;
    
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const isProd = process.env.CASHFREE_PROD === 'true';

    if (!appId || !secretKey) {
      // Return a simulated token if keys are not configured yet
      return res.json({
        paymentSessionId: `cf_sess_mock_${Math.floor(100000 + Math.random() * 900000)}`,
        orderId: `cf_order_${Math.floor(100000 + Math.random() * 900000)}`,
        simulated: true
      });
    }

    const url = isProd 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';

    const orderId = `cf_order_${Date.now()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(amount),
        order_currency: 'INR',
        customer_details: {
          customer_id: customerId || 'cust_guest',
          customer_phone: customerPhone || '9999999999',
          customer_email: customerEmail || 'guest@abkharido.com'
        },
        order_meta: {
          return_url: `${req.headers.origin}/?order_id={order_id}`
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Cashfree order request failed:', errText);
      return res.status(response.status).json({ error: 'Payment gateway API error' });
    }

    const data = await response.json();
    res.json({
      paymentSessionId: data.payment_session_id,
      orderId: data.order_id,
      simulated: false
    });
  } catch (err) {
    console.error('Cashfree PG connection error:', err);
    res.status(500).json({ error: 'Failed to contact payment gateway' });
  }
});

// Start Express server on localhost
app.listen(PORT, () => {
  console.log(`Server running locally on port ${PORT}`);
});

export default app;
