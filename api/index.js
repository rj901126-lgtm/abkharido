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

async function connectDatabase() {
  if (mongoUri) {
    try {
      dbClient = new MongoClient(mongoUri);
      await dbClient.connect();
      db = dbClient.db();
      isMongo = true;
      console.log('Connected to MongoDB Atlas successfully.');
      await seedMongoDb();
    } catch (err) {
      console.error('MongoDB Atlas connection failed. Falling back to JSON files:', err.message);
      isMongo = false;
      await ensureLocalDbExists();
    }
  } else {
    isMongo = false;
    await ensureLocalDbExists();
  }
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
  if (isMongo) {
    return await db.collection('products').find({}).toArray();
  } else {
    return await readJson(PRODUCTS_FILE);
  }
}

async function saveProduct(newProduct) {
  if (isMongo) {
    await db.collection('products').insertOne(newProduct);
  } else {
    const products = await readJson(PRODUCTS_FILE);
    products.push(newProduct);
    await writeJson(PRODUCTS_FILE, products);
  }
}

async function deleteProduct(productId) {
  if (isMongo) {
    await db.collection('products').deleteOne({ id: productId });
  } else {
    const products = await readJson(PRODUCTS_FILE);
    const filtered = products.filter(p => p.id !== productId);
    await writeJson(PRODUCTS_FILE, filtered);
  }
}

// 2. USERS DB HELPERS
async function getUsersMap() {
  if (isMongo) {
    const usersList = await db.collection('users').find({}).toArray();
    const map = {};
    usersList.forEach(u => {
      const { _id, ...rest } = u;
      map[_id] = rest;
    });
    return map;
  } else {
    return await readJson(USERS_FILE);
  }
}

async function saveUsersMap(usersMap) {
  if (isMongo) {
    for (const username of Object.keys(usersMap)) {
      const userDoc = { _id: username, ...usersMap[username] };
      await db.collection('users').replaceOne({ _id: username }, userDoc, { upsert: true });
    }
  } else {
    await writeJson(USERS_FILE, usersMap);
  }
}

// 3. ORDERS DB HELPERS
async function getOrders() {
  if (isMongo) {
    return await db.collection('orders').find({}).toArray();
  } else {
    return await readJson(ORDERS_FILE);
  }
}

async function saveOrders(ordersList) {
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
  if (isMongo) {
    await db.collection('stats').replaceOne({ _id: 'global_stats' }, { _id: 'global_stats', ...statsData }, { upsert: true });
  } else {
    await writeJson(STATS_FILE, statsData);
  }
}

async function resetAllDatabases() {
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

// Connect Database on boot
await connectDatabase();

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

    await saveUsersMap(users);
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

    await saveUsersMap(users);
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

    const { cart, username, shippingAddress, paymentMethod, useCoinsDiscount, activeReferral } = req.body;

    const user = users[username];
    if (!user) return res.status(404).json({ error: 'Buyer account not found' });

    const itemsPrice = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const coinsDiscountValue = useCoinsDiscount ? Math.min(user.walletCoins, itemsPrice) : 0;
    const deliveryCharge = itemsPrice > 500 ? 0 : 40;
    const finalAmount = itemsPrice - coinsDiscountValue + deliveryCharge;

    const orderId = `OD-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const newOrder = {
      id: orderId,
      date: new Date().toISOString().split('T')[0],
      items: cart,
      itemsPrice,
      coinsDiscountValue,
      deliveryCharge,
      finalAmount,
      shippingAddress,
      paymentMethod,
      status: 'Processing',
      referralApplied: activeReferral || null
    };

    // Process Referral Commissions
    if (activeReferral) {
      const { type, referrerId } = activeReferral;
      
      let totalCommissionEarned = 0;
      cart.forEach(item => {
        const rate = type === 'aff' ? item.product.influencerCommissionRate : item.product.userCommissionRate;
        totalCommissionEarned += item.product.price * item.quantity * rate;
      });

      totalCommissionEarned = Math.round(totalCommissionEarned * 100) / 100;

      if (type === 'aff') {
        const creatorProfile = Object.values(users).find(u => u.influencerId === referrerId);
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
          status: 'Pending'
        };

        stats.conversions += 1;
        stats.history = [newHistoryTxn, ...stats.history];

      } else if (type === 'ref') {
        const coinsEarned = Math.round(totalCommissionEarned);
        const userProfile = users[referrerId];
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
    await saveUsersMap(users);
    await saveStats(stats);

    res.json({ order: newOrder, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place purchase order' });
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
