import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

import admin from 'firebase-admin';
import { checkServiceability, createShiprocketOrder } from './shiprocket.js';

// Initialize firebase-admin if service account credentials are provided
let firebaseAdminApp = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('[FIREBASE] Admin SDK initialized successfully.');
  } catch (err) {
    console.error('[FIREBASE] Failed to initialize Admin SDK from environment:', err.message);
  }
}

const decodeJwtPayload = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      return payload;
    }
  } catch (e) {}
  return null;
};

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
const SELLERS_FILE = path.join(DATA_DIR, 'sellers.json');

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
    images: [
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Experience iPhone 15 Pro. Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.',
    specifications: [
      { key: 'Display', value: '6.1-inch Super Retina XDR OLED' },
      { key: 'Processor', value: 'A17 Pro Chip with 6-Core GPU' },
      { key: 'Rear Camera', value: '48MP Main + 12MP Ultra Wide + 12MP Telephoto' },
      { key: 'Front Camera', value: '12MP TrueDepth Front Camera' },
      { key: 'Battery Life', value: 'Up to 23 hours video playback' }
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
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity and possibility.',
    specifications: [
      { key: 'Display', value: '6.8-inch Dynamic AMOLED 2X, QHD+' },
      { key: 'Processor', value: 'Snapdragon 8 Gen 3 for Galaxy' },
      { key: 'Rear Camera', value: '200MP Main + 50MP + 12MP + 10MP Quad Camera' },
      { key: 'Front Camera', value: '12MP Front Camera' },
      { key: 'S-Pen Support', value: 'Yes, Included in-box' }
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
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'The MacBook Air with M3 chip is superportable, superfast, and supercharged for work, play, and everything you do. Up to 18 hours of battery life.',
    specifications: [
      { key: 'Display', value: '13.6-inch Liquid Retina Display' },
      { key: 'Processor', value: 'Apple M3 Chip with 8-Core CPU' },
      { key: 'Memory', value: '8GB Unified Memory' },
      { key: 'Storage', value: '256GB Superfast SSD' },
      { key: 'OS', value: 'macOS Sonoma' }
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
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'With two processors controlling eight microphones, Auto NC Optimizer for automatically optimizing noise cancelling, and a specially designed driver unit.',
    specifications: [
      { key: 'Type', value: 'Over-ear, Closed-back wireless' },
      { key: 'Noise Cancelling', value: 'Industry-leading Active Noise Cancellation (ANC)' },
      { key: 'Battery Life', value: 'Up to 30 Hours with ANC On' },
      { key: 'Charging', value: 'USB-PD Fast Charge (3 mins for 3 hours)' },
      { key: 'Bluetooth Version', value: '5.2' }
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
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Add a rugged edge to your outfit with this pure leather biker jacket. Crafted from top-grade sheepskin leather, it features custom metal hardware and dual lining.',
    specifications: [
      { key: 'Material', value: '100% Genuine Sheepskin Leather' },
      { key: 'Fit', value: 'Slim Fit Biker Cut' },
      { key: 'Closure', value: 'Asymmetrical Heavy-Duty Zippers' },
      { key: 'Pockets', value: '3 Outer Zipper Pockets, 1 Inner Pocket' }
    ],
    influencerCommissionRate: 0.07,
    userCommissionRate: 0.03,
    inStock: true
  },
  {
    id: 'red-running-shoes',
    name: 'FlexRun Pro Men Red Sports Running Shoes',
    category: 'fashion',
    price: 2499,
    originalPrice: 4999,
    rating: 4.4,
    reviewsCount: 1540,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Engineered for daily runs, the FlexRun Pro features an ultra-breathable mesh upper and responsiveness cushioning. The lightweight sole protects your joints.',
    specifications: [
      { key: 'Type', value: 'Road Running Shoes' },
      { key: 'Outer Material', value: 'Engineered Mesh' },
      { key: 'Sole Material', value: 'EVA Midsole with Rubber Outsole' },
      { key: 'Weight', value: '240g (Single Shoe)' }
    ],
    influencerCommissionRate: 0.07,
    userCommissionRate: 0.03,
    inStock: true
  },
  {
    id: 'chronograph-watch',
    name: 'Imperium Chronograph Men Analog Watch (Royal Gold & Pearl)',
    category: 'fashion',
    price: 8999,
    originalPrice: 17999,
    rating: 4.3,
    reviewsCount: 198,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'The Imperium Chronograph defines status. Featuring a 42mm surgical stainless steel case plated in gold, white sunray dial, and full stopwatch functionalities.',
    specifications: [
      { key: 'Display Type', value: 'Analog Chronograph' },
      { key: 'Movement', value: 'Japanese Quartz Movement' },
      { key: 'Water Resistance', value: '50 Meters (5 ATM)' },
      { key: 'Strap Material', value: 'Genuine Croco-Pattern Leather' }
    ],
    influencerCommissionRate: 0.07,
    userCommissionRate: 0.03,
    inStock: true
  },
  {
    id: 'coffee-maker-espresso',
    name: 'BaristaExpress 15-Bar Espresso & Cappuccino Maker',
    category: 'home',
    price: 14999,
    originalPrice: 24999,
    rating: 4.4,
    reviewsCount: 654,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Bring the cafe home. With a professional 15-bar Italian pump pressure and a high-performance steam wand, you can froth milk for lattes and cappuccinos like a barista.',
    specifications: [
      { key: 'Pressure', value: '15 Bar Italian Pump' },
      { key: 'Water Tank Capacity', value: '1.8 Liters Removable' },
      { key: 'Heater Type', value: 'Thermo-Block Instant heating' },
      { key: 'Accessories', value: 'Portafilter, Single/Double shot filters, Tamper-Scoop' }
    ],
    influencerCommissionRate: 0.05,
    userCommissionRate: 0.02,
    inStock: true
  },
  {
    id: 'ergonomic-office-chair',
    name: 'ErgoComfort High-Back Mesh Ergonomic Office Chair',
    category: 'home',
    price: 11999,
    originalPrice: 19999,
    rating: 4.3,
    reviewsCount: 423,
    image: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Correct your posture during long work hours. The ErgoComfort features adaptive lumbar support, 3D adjustable armrests, and premium breathable Korean mesh.',
    specifications: [
      { key: 'Support', value: 'Dynamic Self-Adjusting Lumbar Support' },
      { key: 'Armrests', value: '3D Adjustable (Height, Depth, Angle)' },
      { key: 'Base', value: 'Heavy Duty Nylon Base with Silent Castors' },
      { key: 'Weight Capacity', value: 'Up to 135 kg' }
    ],
    influencerCommissionRate: 0.05,
    userCommissionRate: 0.02,
    inStock: true
  },
  {
    id: 'smart-air-purifier',
    name: 'PureAir Smart HEPA H13 Air Purifier with WiFi Control',
    category: 'appliances',
    price: 8999,
    originalPrice: 12999,
    rating: 4.6,
    reviewsCount: 1150,
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1626315582236-fa2c23565e31?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Clean air in minutes. Utilizing a True HEPA H13 filter that captures 99.97% of airborne pollutants down to 0.1 microns, including dust, smoke, pollen, and allergens.',
    specifications: [
      { key: 'CADR Value', value: '250 m³/h (Covers up to 350 sq.ft)' },
      { key: 'Filter Layers', value: 'Pre-Filter + True HEPA H13 + Activated Carbon' },
      { key: 'Connectivity', value: 'WiFi - Smart Life App / Alexa / Google Assistant' },
      { key: 'Noise Level', value: 'Ultra Silent 22dB in Sleep Mode' }
    ],
    influencerCommissionRate: 0.04,
    userCommissionRate: 0.015,
    inStock: true
  },
  {
    id: 'ultra-hd-led-tv',
    name: 'Spectra 55-inch 4K Ultra HD Smart LED Android TV',
    category: 'appliances',
    price: 34999,
    originalPrice: 49999,
    rating: 4.5,
    reviewsCount: 3950,
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1552975084-6e027cd345c2?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Immerse yourself in cinematic 4K resolution. Equipped with Dolby Vision, HDR10+, and 30W Dolby Atmos sound, powered by Android TV for access to all popular streaming platforms.',
    specifications: [
      { key: 'Resolution', value: '4K Ultra HD (3840 x 2160)' },
      { key: 'Sound', value: '30 Watts Speakers with Dolby Atmos' },
      { key: 'Operating System', value: 'Android TV 11 with built-in Chromecast' },
      { key: 'Ports', value: '3 HDMI, 2 USB, Bluetooth 5.0, WiFi' }
    ],
    influencerCommissionRate: 0.04,
    userCommissionRate: 0.015,
    inStock: true
  },
  {
    id: 'mechanical-keyboard-pro',
    name: 'KeyCraft K8 Pro Mechanical Keyboard (Hot-swappable, RGB)',
    category: 'electronics',
    price: 7999,
    originalPrice: 9999,
    rating: 4.8,
    reviewsCount: 112,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1626958390898-162d3577f593?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Designed for coders and gamers alike. The KeyCraft K8 Pro features hot-swappable Gateron Brown switches, double-shot PBT keycaps, and beautiful custom south-facing RGB presets.',
    specifications: [
      { key: 'Layout', value: 'Tenkeyless (TKL) 80% Layout' },
      { key: 'Switches', value: 'Pre-lubed Gateron G Pro Brown (Tactile)' },
      { key: 'Keycaps', value: 'Double-Shot PBT, OEM Profile' },
      { key: 'Battery', value: '4000mAh Rechargeable (Bluetooth/Wired)' }
    ],
    influencerCommissionRate: 0.03,
    userCommissionRate: 0.012,
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
  // Sync SEED_PRODUCTS to MongoDB to support multiple photos and specifications updates
  for (const product of SEED_PRODUCTS) {
    await db.collection('products').updateOne(
      { id: product.id },
      { 
        $set: { 
          image: product.image,
          images: product.images || [product.image],
          specifications: product.specifications 
        } 
      },
      { upsert: true }
    );
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
    try { await fs.access(SELLERS_FILE); } catch {
      await fs.writeFile(SELLERS_FILE, JSON.stringify({}, null, 2));
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

async function getSellersMap() {
  await getDb();
  let map = {};
  if (isMongo) {
    try {
      const sellersList = await db.collection('sellers').find({}).toArray();
      sellersList.forEach(s => {
        const { _id, ...rest } = s;
        map[_id] = { email: _id, ...rest };
      });
    } catch (err) {
      // Fallback if table doesn't exist yet
    }
  } else {
    map = await readJson(SELLERS_FILE);
  }
  return map;
}

async function saveSellersMap(sellersMap, modifiedSellerIds = null) {
  await getDb();
  if (isMongo) {
    let targets = Object.keys(sellersMap);
    if (modifiedSellerIds) {
      targets = Array.isArray(modifiedSellerIds) ? modifiedSellerIds : [modifiedSellerIds];
    }
    for (const email of targets) {
      if (sellersMap[email]) {
        const sellerDoc = { _id: email, ...sellersMap[email] };
        await db.collection('sellers').replaceOne({ _id: email }, sellerDoc, { upsert: true });
      }
    }
  } else {
    await writeJson(SELLERS_FILE, sellersMap);
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

// 5. PROMOTIONS CONFIG HELPERS
const PROMOTIONS_FILE = path.join(DATA_DIR, 'promotions.json');

const SEED_PROMOTIONS = {
  dealsTimer: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  budgetThreshold: 15000,
  announcement: {
    show: true,
    text: "🎉 AbKharido Launch: Earn up to 7% affiliate commission coins on sharing product links!",
    link: "partner"
  },
  banners: [
    {
      title: "Big Bachat Days!",
      desc: "Get up to 60% off on all premium electronic gadgets and smart accessories.",
      tag: "ELECTRONICS EXCLUSIVE",
      cat: "electronics",
      bg: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)"
    },
    {
      title: "Trends in Fashion",
      desc: "Up to 50% discount on clothing, sports wear and casual footwear.",
      tag: "NEW SEASON STYLES",
      cat: "fashion",
      bg: "linear-gradient(135deg, #fda4af 0%, #f43f5e 100%)"
    }
  ],
  categoryBanners: {
    mobiles: { image: "", show: false },
    electronics: { image: "", show: false },
    fashion: { image: "", show: false },
    home: { image: "", show: false },
    appliances: { image: "", show: false }
  }
};

async function getPromotions() {
  await getDb();
  if (isMongo) {
    const doc = await db.collection('promotions').findOne({ _id: 'global_promotions' });
    if (doc) {
      const { _id, ...rest } = doc;
      return rest;
    }
    return SEED_PROMOTIONS;
  } else {
    try {
      return await readJson(PROMOTIONS_FILE);
    } catch {
      return SEED_PROMOTIONS;
    }
  }
}

async function savePromotions(promoData) {
  await getDb();
  if (isMongo) {
    await db.collection('promotions').replaceOne({ _id: 'global_promotions' }, { _id: 'global_promotions', ...promoData }, { upsert: true });
  } else {
    await writeJson(PROMOTIONS_FILE, promoData);
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
    await db.collection('sellers').deleteMany({});

    await db.collection('stats').deleteMany({});
    await db.collection('stats').insertOne({ _id: 'global_stats', ...SEED_STATS });

    await db.collection('promotions').deleteMany({});
    await db.collection('promotions').insertOne({ _id: 'global_promotions', ...SEED_PROMOTIONS });
  } else {
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(SEED_PRODUCTS, null, 2));
    await fs.writeFile(USERS_FILE, JSON.stringify(SEED_USERS, null, 2));
    await fs.writeFile(ORDERS_FILE, JSON.stringify([], null, 2));
    await fs.writeFile(STATS_FILE, JSON.stringify(SEED_STATS, null, 2));
    await fs.writeFile(SELLERS_FILE, JSON.stringify({}, null, 2));
    await fs.writeFile(PROMOTIONS_FILE, JSON.stringify(SEED_PROMOTIONS, null, 2));
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

const verifyAdminToken = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  const adminPass = process.env.ADMIN_PASSWORD || 'AbKharidoAdmin2026';
  if (token === adminPass) {
    return next();
  }
  res.status(403).json({ error: 'Access Denied: Invalid admin authorization token' });
};

const verifyAdminOrSellerToken = async (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  const sellerId = req.headers['x-seller-id'];
  
  const adminPass = process.env.ADMIN_PASSWORD || 'AbKharidoAdmin2026';
  if (adminToken === adminPass) {
    req.isAdmin = true;
    return next();
  }
  
  if (sellerId) {
    try {
      const sellers = await getSellersMap();
      const seller = sellers[sellerId.toLowerCase().trim()];
      if (seller && seller.isApproved) {
        req.isAdmin = false;
        req.sellerId = sellerId.toLowerCase().trim();
        return next();
      }
    } catch (err) {
      // Fall through to error
    }
  }
  
  res.status(403).json({ error: 'Access Denied: Invalid admin or seller authorization' });
};

app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body;
  const adminPass = process.env.ADMIN_PASSWORD || 'AbKharidoAdmin2026';
  if (password === adminPass) {
    return res.json({ success: true, token: adminPass });
  }
  res.status(401).json({ error: 'Invalid admin PIN/password' });
});

// 1. PRODUCTS DATABASE ROUTES
app.get('/api/products', async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read products' });
  }
});

app.post('/api/products', verifyAdminOrSellerToken, async (req, res) => {
  try {
    const products = await getProducts();
    const newProduct = req.body;

    if (products.some(p => p.id === newProduct.id)) {
      return res.status(400).json({ error: 'Product ID already exists' });
    }

    if (req.isAdmin) {
      if (!newProduct.sellerId) {
        newProduct.sellerId = 'admin';
        newProduct.sellerName = 'AbKharido Direct';
      }
    } else {
      newProduct.sellerId = req.sellerId;
      const sellers = await getSellersMap();
      newProduct.sellerName = sellers[req.sellerId]?.shopName || 'Marketplace Seller';
    }

    await saveProduct(newProduct);
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save product' });
  }
});

app.delete('/api/products/:id', verifyAdminOrSellerToken, async (req, res) => {
  try {
    const products = await getProducts();
    const { id } = req.params;

    const product = products.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!req.isAdmin && product.sellerId !== req.sellerId) {
      return res.status(403).json({ error: 'Access Denied: You can only delete your own products' });
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

    // Return the generated OTP for live testing in development mode only
    if (process.env.NODE_ENV === 'production') {
      res.json({ success: true });
    } else {
      res.json({ success: true, otp: generatedOtp });
    }
  } catch (err) {
    console.error('Failed to send OTP:', err);
    res.status(500).json({ error: 'Server authentication process error.' });
  }
});

app.post('/api/auth/check-user', async (req, res) => {
  try {
    const { recipient } = req.body;
    const users = await getUsersMap();
    
    // Normalize recipient digits to standard last 10 digits
    const recipientDigits = recipient.replace(/\D/g, '');
    const recipient10 = recipientDigits.length >= 10 ? recipientDigits.slice(-10) : recipientDigits;
    const formattedUsername = recipient10;

    const exists = Object.values(users).some(u => {
      const uPhoneDigits = u.phone ? u.phone.replace(/\D/g, '') : '';
      const uPhone10 = uPhoneDigits.length >= 10 ? uPhoneDigits.slice(-10) : uPhoneDigits;
      
      const phoneMatches = uPhone10 && uPhone10 === recipient10;
      const emailMatches = u.email && recipient && u.email.toLowerCase().trim() === recipient.toLowerCase().trim();
      const usernameMatches = u.username && (u.username.toLowerCase() === formattedUsername || u.username.toLowerCase() === recipient.toLowerCase());
      
      return phoneMatches || emailMatches || usernameMatches;
    });
    
    res.json({ exists });
  } catch (err) {
    res.status(500).json({ error: 'Server validation error' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { recipient, otp, isSignup, fullName, email } = req.body;

    const isValid = await verifyOtpCode(recipient, otp);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP verification code.' });
    }

    const users = await getUsersMap();
    const recipientDigits = recipient.replace(/\D/g, '');
    const recipient10 = recipientDigits.length >= 10 ? recipientDigits.slice(-10) : recipientDigits;
    const formattedUsername = recipient10;

    let user = Object.values(users).find(u => {
      const uPhoneDigits = u.phone ? u.phone.replace(/\D/g, '') : '';
      const uPhone10 = uPhoneDigits.length >= 10 ? uPhoneDigits.slice(-10) : uPhoneDigits;
      return (uPhone10 && uPhone10 === recipient10) || u.username.toLowerCase() === formattedUsername;
    });

    if (!user) {
      // Create user profile on signup or first login
      user = {
        username: formattedUsername,
        fullName: fullName || 'Guest User',
        firstName: fullName ? fullName.split(' ')[0] : '',
        lastName: fullName ? fullName.split(' ').slice(1).join(' ') : '',
        phone: recipient,
        email: email || '',
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

// Firebase Token Verification API
app.post('/api/auth/verify-firebase', async (req, res) => {
  try {
    const { idToken, phone, isSignup, fullName, email } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Firebase idToken is required' });
    }

    let verifiedPhone = null;
    if (firebaseAdminApp) {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      verifiedPhone = decodedToken.phone_number;
    } else {
      // Development fallback decode
      const payload = decodeJwtPayload(idToken);
      if (payload) {
        verifiedPhone = payload.phone_number;
      }
    }

    if (!verifiedPhone) {
      return res.status(400).json({ error: 'Failed to verify Firebase authentication token.' });
    }

    // Normalize verifiedPhone to standard last 10 digits
    const cleanPhoneDigits = verifiedPhone.replace(/\D/g, '');
    const cleanPhone = cleanPhoneDigits.length >= 10 ? cleanPhoneDigits.slice(-10) : cleanPhoneDigits;
    const users = await getUsersMap();
    const formattedUsername = cleanPhone;

    let user = Object.values(users).find(u => {
      const uPhoneDigits = u.phone ? u.phone.replace(/\D/g, '') : '';
      const uPhone10 = uPhoneDigits.length >= 10 ? uPhoneDigits.slice(-10) : uPhoneDigits;
      return (uPhone10 && uPhone10 === cleanPhone) || u.username.toLowerCase() === formattedUsername;
    });

    if (!user) {
      // Create user profile on signup or first login
      user = {
        username: formattedUsername,
        fullName: fullName || 'Guest User',
        firstName: fullName ? fullName.split(' ')[0] : '',
        lastName: fullName ? fullName.split(' ').slice(1).join(' ') : '',
        phone: cleanPhone,
        email: email || '',
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
    console.error('Firebase token verification failed:', err);
    res.status(500).json({ error: 'Authentication verification failure.' });
  }
});

// Shiprocket Shipping Serviceability Endpoint
app.post('/api/shipping/serviceability', async (req, res) => {
  try {
    const { deliveryPincode, weight, isCod } = req.body;
    if (!deliveryPincode) {
      return res.status(400).json({ error: 'Delivery pincode is required' });
    }
    const result = await checkServiceability(deliveryPincode, weight || 0.5, isCod || false);
    res.json(result);
  } catch (err) {
    console.error('[SHIPROCKET API] Serviceability check error:', err);
    res.status(500).json({ error: 'Failed to verify shipping serviceability' });
  }
});

// Update User Profile API
app.post('/api/users/:username/update', async (req, res) => {
  try {
    const users = await getUsersMap();
    const { username } = req.params;
    const { firstName, lastName, email, pincode, address, emailVerified, isInfluencer, creatorCode, influencerId, walletCoins, walletCash, isSeller, sellerDetails } = req.body;

    // Security check: Only admins can modify creator/seller roles and balances
    if (isInfluencer !== undefined || creatorCode !== undefined || influencerId !== undefined || walletCoins !== undefined || walletCash !== undefined || isSeller !== undefined) {
      const token = req.headers['x-admin-token'];
      const adminPass = process.env.ADMIN_PASSWORD || 'AbKharidoAdmin2026';
      if (token !== adminPass) {
        return res.status(403).json({ error: 'Access Denied: Admin privileges required to update role or balances' });
      }
    }

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
    if (isSeller !== undefined) user.isSeller = isSeller;
    if (sellerDetails !== undefined) user.sellerDetails = sellerDetails;

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

app.get('/api/users', verifyAdminToken, async (req, res) => {
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

app.post('/api/seller/signup', async (req, res) => {
  try {
    const sellers = await getSellersMap();
    const { email, password, shopName, sellerAddress, payoutDetails, phone } = req.body;

    if (!email || !password || !shopName || !sellerAddress) {
      return res.status(400).json({ error: 'Please fill out all required fields' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (sellers[cleanEmail]) {
      return res.status(400).json({ error: 'A merchant account with this email already exists' });
    }

    sellers[cleanEmail] = {
      email: cleanEmail,
      phone: phone || '',
      password: password,
      shopName,
      sellerAddress,
      payoutDetails: payoutDetails || { upi: '', bankAccount: '', bankIfsc: '' },
      walletCash: 0,
      isApproved: false,
      history: []
    };

    await saveSellersMap(sellers, cleanEmail);
    res.json({ success: true, message: 'Merchant registered successfully. Awaiting admin approval.', seller: sellers[cleanEmail] });
  } catch (err) {
    console.error('Failed to register seller:', err);
    res.status(500).json({ error: 'Failed to register merchant profile' });
  }
});

app.post('/api/seller/login', async (req, res) => {
  try {
    const sellers = await getSellersMap();
    const { email, password } = req.body;

    const cleanEmail = email.toLowerCase().trim();
    const seller = sellers[cleanEmail];

    if (!seller || seller.password !== password) {
      return res.status(401).json({ error: 'Invalid merchant credentials' });
    }

    res.json({ success: true, seller });
  } catch (err) {
    res.status(500).json({ error: 'Failed to authenticate merchant' });
  }
});

app.get('/api/sellers', verifyAdminToken, async (req, res) => {
  try {
    const sellers = await getSellersMap();
    res.json(Object.values(sellers));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sellers list' });
  }
});

app.post('/api/sellers/:email/verify', verifyAdminToken, async (req, res) => {
  try {
    const sellers = await getSellersMap();
    const { email } = req.params;
    const { isApproved } = req.body;

    const cleanEmail = email.toLowerCase().trim();
    if (!sellers[cleanEmail]) {
      return res.status(404).json({ error: 'Seller account not found' });
    }

    sellers[cleanEmail].isApproved = isApproved;
    await saveSellersMap(sellers, cleanEmail);
    res.json(sellers[cleanEmail]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update merchant status' });
  }
});

app.get('/api/seller/orders', async (req, res) => {
  try {
    const { sellerId } = req.query;
    if (!sellerId) return res.status(400).json({ error: 'sellerId is required' });

    const orders = await getOrders();
    const filteredOrders = orders.filter(o => 
      o.items.some(item => item.product && item.product.sellerId === sellerId)
    ).map(o => {
      return {
        ...o,
        items: o.items.filter(item => item.product && item.product.sellerId === sellerId)
      };
    });

    res.json(filteredOrders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch seller orders' });
  }
});

app.get('/api/seller/products', async (req, res) => {
  try {
    const { sellerId } = req.query;
    if (!sellerId) return res.status(400).json({ error: 'sellerId is required' });

    const products = await getProducts();
    const filteredProducts = products.filter(p => p.sellerId === sellerId);
    res.json(filteredProducts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch seller products' });
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
    const sellers = await getSellersMap();
    const stats = await getStats();
    const { username, amount, method } = req.body;

    const cleanUsername = (username || '').toLowerCase().trim();
    const seller = sellers[cleanUsername];
    const user = users[username];

    if (!seller && !user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const payoutRecord = {
      id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      amount: Number(amount),
      method,
      status: 'Processing'
    };

    if (seller) {
      if (Number(amount) > (seller.walletCash || 0)) {
        return res.status(400).json({ error: 'Insufficient withdrawable cash balance' });
      }
      seller.walletCash = (seller.walletCash || 0) - Number(amount);
      
      if (!seller.history) seller.history = [];
      seller.history.unshift({
        id: `SLR-PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        date: payoutRecord.date,
        productName: `Withdrawal Request (${method})`,
        quantity: 1,
        amount: Number(amount),
        commissionDeducted: 0,
        earnings: -Number(amount),
        status: 'Processing'
      });

      await saveSellersMap(sellers, cleanUsername);
    } else {
      if (Number(amount) > (user.walletCash || 0)) {
        return res.status(400).json({ error: 'Insufficient withdrawable cash balance' });
      }
      user.walletCash = (user.walletCash || 0) - Number(amount);
      await saveUsersMap(users, username);
    }

    stats.payouts = [payoutRecord, ...(stats.payouts || [])];
    await saveStats(stats);

    res.json({ success: true, user: seller || user, payoutRecord });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

// 5. CHEKOUT & ORDER REGISTRATION (ATTRIBUTION PROCESS)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await getOrders();
    const { email, username } = req.query;
    
    // 1. Direct filter by username if provided
    if (username && username !== 'admin') {
      const filtered = orders.filter(o => o.customerUsername === username);
      return res.json(filtered);
    }
    
    // 2. Lookup by email address
    if (email && email !== 'admin') {
      const users = await getUsersMap();
      const user = Object.values(users).find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        const filtered = orders.filter(o => o.customerUsername === user.username);
        return res.json(filtered);
      }
      
      // Fallback: check if email param is actually user's username key
      if (users[email]) {
        const filtered = orders.filter(o => o.customerUsername === email);
        return res.json(filtered);
      }
      return res.json([]);
    }
    // Return all orders if email query is absent or is 'admin' (requires admin token validation)
    const token = req.headers['x-admin-token'];
    const adminPass = process.env.ADMIN_PASSWORD || 'AbKharidoAdmin2026';
    if (token === adminPass) {
      return res.json(orders);
    }
    res.status(403).json({ error: 'Access Denied: Admin authorization required' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

const creditSellersForOrder = (order, sellers, stats) => {
  const { items, referralApplied } = order;
  const isAff = referralApplied && referralApplied.type === 'aff';
  
  items.forEach(item => {
    const prod = item.product;
    if (prod && prod.sellerId && prod.sellerId !== 'admin') {
      const seller = sellers[prod.sellerId.toLowerCase().trim()];
      if (seller) {
        let baseEarnings = prod.price * item.quantity;
        let deductions = 0;
        
        if (isAff) {
          const rate = prod.influencerCommissionRate || 0;
          deductions = baseEarnings * rate;
        }
        
        const finalSellerEarnings = Math.max(0, Math.round((baseEarnings - deductions) * 100) / 100);
        
        seller.walletCash = (seller.walletCash || 0) + finalSellerEarnings;
        
        if (!seller.history) {
          seller.history = [];
        }
        
        seller.history.unshift({
          id: `SLR-TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          orderId: order.id,
          date: new Date().toISOString().split('T')[0],
          productName: prod.name,
          quantity: item.quantity,
          amount: baseEarnings,
          commissionDeducted: deductions,
          earnings: finalSellerEarnings,
          status: 'Credited'
        });
      }
    }
  });
};

app.post('/api/orders', async (req, res) => {
  try {
    const orders = await getOrders();
    const users = await getUsersMap();
    const sellers = await getSellersMap();
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
    
    // Register order dynamically in Shiprocket
    let trackingNumber = `12${Math.floor(1000000000 + Math.random() * 9000000000)}`; // Default AWB style
    let courierPartner = 'Shiprocket'; // Default courier fallback
    let shiprocketDetails = null;

    try {
      const srResult = await createShiprocketOrder(orderId, shippingAddress, cart, finalAmount, isCod);
      if (srResult.success) {
        trackingNumber = srResult.awbCode || trackingNumber;
        courierPartner = srResult.courier || 'Shiprocket';
        shiprocketDetails = {
          shipmentId: srResult.shipmentId,
          orderId: srResult.orderId
        };
        console.log(`[SHIPROCKET] Order synchronized successfully. AWB: ${trackingNumber}`);
      }
    } catch (srErr) {
      console.warn('[SHIPROCKET] Integration order creation failed, using mock defaults:', srErr.message);
    }

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
      courierPartner,
      shiprocketDetails
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

    const modifiedSellerEmails = [];
    if (isCod) {
      creditSellersForOrder(newOrder, sellers, stats);
      newOrder.items.forEach(item => {
        const prod = item.product;
        if (prod && prod.sellerId && prod.sellerId !== 'admin') {
          modifiedSellerEmails.push(prod.sellerId.toLowerCase().trim());
        }
      });
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
    if (modifiedSellerEmails.length > 0) {
      await saveSellersMap(sellers, modifiedSellerEmails);
    }
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
      
      const users = await getUsersMap();
      const sellers = await getSellersMap();
      const stats = await getStats();
      const modifiedUsernames = [order.customerUsername];
      
      // Process Referral Commissions now since payment is verified!
      if (order.referralApplied) {
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
            modifiedUsernames.push(creatorProfile.username);
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
            modifiedUsernames.push(userProfile.username);
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
      }

      // Credit Sellers for product sales
      creditSellersForOrder(order, sellers, stats);
      const modifiedSellerEmails = [];
      order.items.forEach(item => {
        const prod = item.product;
        if (prod && prod.sellerId && prod.sellerId !== 'admin') {
          modifiedSellerEmails.push(prod.sellerId.toLowerCase().trim());
        }
      });

      await saveUsersMap(users, modifiedUsernames);
      if (modifiedSellerEmails.length > 0) {
        await saveSellersMap(sellers, modifiedSellerEmails);
      }
      await saveStats(stats);
      await saveOrders(orders);
      
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

app.post('/api/orders/:orderId/status', verifyAdminToken, async (req, res) => {
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

// 6. DB SYSTEM REINITIALIZATION (Restricted to verified administrators)
app.post('/api/reset', verifyAdminToken, async (req, res) => {
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

// GET /api/promotions - Fetch site promos configurations
app.get('/api/promotions', async (req, res) => {
  try {
    const promos = await getPromotions();
    res.json(promos);
  } catch (err) {
    console.error('[API] Failed to get promotions:', err);
    res.status(500).json({ error: 'Failed to retrieve site configurations' });
  }
});

// POST /api/promotions - Update promotions configurations (Admin Only)
app.post('/api/promotions', verifyAdminToken, async (req, res) => {
  try {
    const promoData = req.body;
    await savePromotions(promoData);
    res.json({ success: true, message: 'Site configuration updated successfully' });
  } catch (err) {
    console.error('[API] Failed to save promotions:', err);
    res.status(500).json({ error: 'Failed to update site configurations' });
  }
});

// POST /api/admin/upload-banner - Upload customized banner image (Admin Only)
app.post('/api/admin/upload-banner', verifyAdminToken, async (req, res) => {
  try {
    const { base64Data, fileName } = req.body;
    if (!base64Data || !fileName) {
      return res.status(400).json({ error: 'Missing image data or filename' });
    }

    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');

    const cleanFileName = `banner-${Date.now()}-${fileName.replace(/\s+/g, '-').replace(/[^\w\.-]/g, '')}`;
    const publicDir = path.join(__dirname, '..', 'public', 'uploads');
    
    await fs.mkdir(publicDir, { recursive: true });
    await fs.writeFile(path.join(publicDir, cleanFileName), buffer);

    const relativeUrl = `/uploads/${cleanFileName}`;
    res.json({ success: true, imageUrl: relativeUrl });
  } catch (err) {
    console.error('[API] Banner upload error:', err);
    res.status(500).json({ error: 'Failed to upload image file' });
  }
});

// Start Express server on localhost
app.listen(PORT, () => {
  console.log(`Server running locally on port ${PORT}`);
});

export default app;
