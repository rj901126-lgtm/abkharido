import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Industry-leading noise cancellation. Two processors control 8 microphones for unprecedented noise cancelling. Auto NC Optimizer dynamically optimizes cancellation based on wearing conditions.',
    specifications: [
      { key: 'Headphone Type', value: 'Over-Ear' },
      { key: 'Connectivity', value: 'Bluetooth 5.2 & 3.5mm Wired' },
      { key: 'Battery Life', value: 'Up to 30 hours' },
      { key: 'Charging', value: 'Quick Charge (3 min for 3 hours)' }
    ],
    influencerCommissionRate: 0.03,
    userCommissionRate: 0.01,
    inStock: true
  },
  {
    id: 'sneaker-running-shoes',
    name: 'Nike Air Max Running Sneakers (Volt Green/Black)',
    category: 'fashion',
    price: 8499,
    originalPrice: 10999,
    rating: 4.4,
    reviewsCount: 310,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Break boundaries with the Nike Air Max. Featuring a light, breathable mesh upper, responsive Air cushioning, and durable rubber traction outsole.',
    specifications: [
      { key: 'Ideal For', value: 'Men & Women (Unisex)' },
      { key: 'Sole Material', value: 'Rubber Air Sole' },
      { key: 'Color', value: 'Volt Green/Black' },
      { key: 'Closure', value: 'Lace-Up' }
    ],
    influencerCommissionRate: 0.07,
    userCommissionRate: 0.03,
    inStock: true
  },
  {
    id: 'casual-cotton-shirt',
    name: 'AbKharido Basics Slim-Fit Cotton Shirt (Classic White)',
    category: 'fashion',
    price: 1299,
    originalPrice: 1999,
    rating: 4.2,
    reviewsCount: 1540,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Perfect for business or casual wear. Crafted from 100% premium long-staple cotton with a soft wash finish for ultimate comfort.',
    specifications: [
      { key: 'Material', value: '100% Premium Cotton' },
      { key: 'Fit', value: 'Slim Fit' },
      { key: 'Sleeve', value: 'Full Sleeve' },
      { key: 'Wash Care', value: 'Machine wash warm' }
    ],
    influencerCommissionRate: 0.07,
    userCommissionRate: 0.03,
    inStock: true
  },
  {
    id: 'analog-minimalist-watch',
    name: 'TimePiece Classic Minimalist Men\'s Leather Watch',
    category: 'fashion',
    price: 4999,
    originalPrice: 7999,
    rating: 4.3,
    reviewsCount: 198,
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Understated elegance. Features a 40mm stainless steel case, genuine Italian leather strap, scratch-resistant mineral glass, and Japanese quartz movement.',
    specifications: [
      { key: 'Strap Material', value: 'Genuine Italian Leather' },
      { key: 'Movement', value: 'Japanese Quartz' },
      { key: 'Water Resistance', value: '3 ATM (30 meters)' },
      { key: 'Dial Diameter', value: '40 mm' }
    ],
    influencerCommissionRate: 0.07,
    userCommissionRate: 0.03,
    inStock: true
  },
  {
    id: 'blackout-window-curtains',
    name: 'DecoFit Premium Blackout Window Curtains (Set of 2, Grey)',
    category: 'home',
    price: 1899,
    originalPrice: 2999,
    rating: 4.5,
    reviewsCount: 1104,
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Block 99% light and UV rays. Features triple-weave thermal insulated fabric to reduce noise and balance room temperature. Eyelet headers for easy hanging.',
    specifications: [
      { key: 'Dimensions', value: '7 feet x 4 feet (Door Size)' },
      { key: 'Material', value: '100% Polyester Triple-Weave' },
      { key: 'Header Type', value: 'Metal Grommets (Eyelets)' },
      { key: 'Package Contents', value: '2 Curtain Panels' }
    ],
    influencerCommissionRate: 0.05,
    userCommissionRate: 0.02,
    inStock: true
  },
  {
    id: 'ceramic-table-lamp',
    name: 'Lumina Craft Ceramic Table Lamp with Fabric Shade',
    category: 'home',
    price: 2499,
    originalPrice: 3999,
    rating: 4.4,
    reviewsCount: 88,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Add warmth to your bedroom or living room. Features a textured ceramic base in white and beige finish, complete with a neutral linen drum shade.',
    specifications: [
      { key: 'Base Material', value: 'Textured Ceramic' },
      { key: 'Shade Material', value: 'Natural Linen Fabric' },
      { key: 'Bulb Base', value: 'E27 (LED Bulb Included)' },
      { key: 'Cord Length', value: '1.5 meters with on/off switch' }
    ],
    influencerCommissionRate: 0.05,
    userCommissionRate: 0.02,
    inStock: true
  },
  {
    id: 'smart-led-tv-4k',
    name: 'AbKharido Vision 55-inch Ultra HD 4K Smart TV',
    category: 'appliances',
    price: 34999,
    originalPrice: 49999,
    rating: 4.5,
    reviewsCount: 3950,
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1552975084-6e027cd345c2?w=600&auto=format&fit=crop&q=80'
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
    id: 'double-door-refrigerator',
    name: 'FrostGuard 240L Frost-Free Double Door Refrigerator',
    category: 'appliances',
    price: 22990,
    originalPrice: 28990,
    rating: 4.3,
    reviewsCount: 654,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Convertible freezer technology. Features smart inverter compressor to optimize cooling while saving energy. Auto frost-free prevents ice build-up.',
    specifications: [
      { key: 'Capacity', value: '240 Liters' },
      { key: 'Energy Star Rating', value: '3 Star (2026 guidelines)' },
      { key: 'Compressor', value: 'Smart Inverter (10 Year Warranty)' },
      { key: 'Defrost System', value: 'Frost Free Auto Defrost' }
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
  },
  {
    id: 'loreal-shampoo',
    name: "L'Oreal Professionnel Serie Expert Shampoo (1500 ml)",
    category: 'beauty',
    price: 1850,
    originalPrice: 2100,
    rating: 4.5,
    reviewsCount: 824,
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80'],
    description: 'Professional shampoo for colored and damaged hair. Hydrates, cleanses, and restores hair fiber strength.',
    specifications: [
      { key: 'Volume', value: '1500 ml' },
      { key: 'Type', value: 'Damaged Hair Expert care' }
    ],
    influencerCommissionRate: 0.07,
    userCommissionRate: 0.03,
    inStock: true
  },
  {
    id: 'lego-police-station',
    name: 'LEGO City Police Station Toy Building Block Set (668 Pieces)',
    category: 'toys',
    price: 4999,
    originalPrice: 5999,
    rating: 4.7,
    reviewsCount: 412,
    image: 'https://images.unsplash.com/photo-1585366119957-e5737520e979?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1585366119957-e5737520e979?w=600&auto=format&fit=crop&q=80'],
    description: 'Feature-rich 3-level police station building set. Comes with standard cruiser, helicopter, garbage truck, and 5 mini-figures.',
    specifications: [
      { key: 'Ages', value: '6+' },
      { key: 'Pieces', value: '668 Blocks' }
    ],
    influencerCommissionRate: 0.05,
    userCommissionRate: 0.02,
    inStock: true
  },
  {
    id: 'organic-honey-pure',
    name: 'AbKharido Organic Raw Forest Honey (1 kg)',
    category: 'food',
    price: 450,
    originalPrice: 590,
    rating: 4.6,
    reviewsCount: 1980,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80'],
    description: '100% natural raw forest honey. Directly harvested from sustainable organic bee farms, unfiltered and chemical-free.',
    specifications: [
      { key: 'Weight', value: '1 kg' },
      { key: 'Source', value: 'Organic Himalayan Forest' }
    ],
    influencerCommissionRate: 0.05,
    userCommissionRate: 0.02,
    inStock: true
  },
  {
    id: 'vega-cruiser-helmet',
    name: 'Vega Cruiser Open Face Motorbike Helmet (ISI Certified)',
    category: 'auto',
    price: 1250,
    originalPrice: 1599,
    rating: 4.4,
    reviewsCount: 3420,
    image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop&q=80'],
    description: 'Open face ISI certified riding helmet with scratch-resistant clear visor, dynamic ventilation system, and quick-release buckle.',
    specifications: [
      { key: 'Certification', value: 'ISI Approved' },
      { key: 'Size', value: 'Medium (58cm)' }
    ],
    influencerCommissionRate: 0.05,
    userCommissionRate: 0.02,
    inStock: true
  },
  {
    id: 'mrf-cricket-bat',
    name: 'MRF Genius Grand Edition English Willow Cricket Bat',
    category: 'sports',
    price: 9999,
    originalPrice: 12999,
    rating: 4.7,
    reviewsCount: 88,
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&auto=format&fit=crop&q=80'],
    description: 'Premium English willow bat as used by elite international players. Perfect balance, thick edges, and superb punch response.',
    specifications: [
      { key: 'Willow', value: 'English Willow Grade 1' },
      { key: 'Weight', value: '1180 grams' }
    ],
    influencerCommissionRate: 0.05,
    userCommissionRate: 0.02,
    inStock: true
  },
  {
    id: 'office-chair-ergonomic',
    name: 'ComfortX Ergonomic Mesh High-Back Office Chair',
    category: 'furniture',
    price: 7499,
    originalPrice: 9999,
    rating: 4.5,
    reviewsCount: 312,
    image: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80'],
    description: 'High back work desk chair with breathable mesh back, adjustable lumbar support, 3D armrests, and premium tilt-lock mechanism.',
    specifications: [
      { key: 'Frame', value: 'Heavy Duty Nylon' },
      { key: 'Upholstery', value: 'High Tensile Mesh' }
    ],
    influencerCommissionRate: 0.05,
    userCommissionRate: 0.02,
    inStock: true
  },
  {
    id: 'alchemist-novel',
    name: 'The Alchemist (Paperback) - By Paulo Coelho',
    category: 'books',
    price: 299,
    originalPrice: 399,
    rating: 4.8,
    reviewsCount: 12500,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80'],
    description: 'A beautiful fable about Santiago, an Andalusian shepherd boy who journeys to Egypt in search of a worldly treasure.',
    specifications: [
      { key: 'Author', value: 'Paulo Coelho' },
      { key: 'Format', value: 'Paperback' }
    ],
    influencerCommissionRate: 0.07,
    userCommissionRate: 0.03,
    inStock: true
  },
  {
    id: 'ola-s1-pro',
    name: 'Ola S1 Pro Gen 2 Electric Scooter (Jet Black, 4kWh)',
    category: 'twowheelers',
    price: 147999,
    originalPrice: 152999,
    rating: 4.6,
    reviewsCount: 2150,
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80'],
    description: 'Experience next-gen electric mobility. 195 km certified range, 120 km/h top speed, touchscreen smart dashboard, and keyless navigation.',
    specifications: [
      { key: 'Range', value: '195 km (IDC certified)' },
      { key: 'Top Speed', value: '120 km/h' }
    ],
    influencerCommissionRate: 0.02,
    userCommissionRate: 0.005,
    inStock: true
  }
];

async function seedLocal() {
  const DATA_DIR = path.join(__dirname, 'api', 'data');
  const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
  
  try {
    // Check if dir exists, if not create
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Write new products to products.json file
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(SEED_PRODUCTS, null, 2));
    console.log('Local fallback products.json seeded successfully at:', PRODUCTS_FILE);
  } catch (err) {
    console.error('Failed to seed local json file:', err);
  }
}

seedLocal();
