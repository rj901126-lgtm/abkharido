/* Mock Database for AbKharido.com */

export const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: 'LayoutGrid' },
  { id: 'mobiles', name: 'Mobiles', icon: 'Smartphone' },
  { id: 'electronics', name: 'Electronics', icon: 'Laptop' },
  { id: 'fashion', name: 'Fashion', icon: 'Shirt' },
  { id: 'home', name: 'Home & Living', icon: 'Home' },
  { id: 'appliances', name: 'Appliances', icon: 'Tv' }
];

export const PRODUCTS = [
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
    influencerCommissionRate: 0.02, // 2% cash
    userCommissionRate: 0.005,      // 0.5% coins
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
    influencerCommissionRate: 0.03, // 3% cash
    userCommissionRate: 0.01,       // 1% coins
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
    userCommissionRate: 0.012, // 1.2% coins
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
    influencerCommissionRate: 0.07, // 7% cash (Fashion gets max commission)
    userCommissionRate: 0.03,       // 3% coins
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
    influencerCommissionRate: 0.05, // 5% cash
    userCommissionRate: 0.02,       // 2% coins
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
    influencerCommissionRate: 0.04, // 4% cash
    userCommissionRate: 0.015,      // 1.5% coins
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

export const INITIAL_USER = {
  username: 'amit_kumar',
  fullName: 'Amit Kumar',
  email: 'amit.kumar@gmail.com',
  isInfluencer: false,
  influencerId: '',
  walletCoins: 120, // AbKharido Coins (1 coin = ₹1)
  walletCash: 0.00,  // Withdrawable cash for influencers
  ordersCount: 5,
  payoutDetails: {
    upi: '',
    bankAccount: '',
    bankIfsc: ''
  }
};

export const INITIAL_PARTNER_STATS = {
  clicks: 14,
  conversions: 2,
  history: [
    { id: 'TXN-101', date: '2026-06-25', productName: 'Sony WH-1000XM5 Wireless Headphones', type: 'user', rate: 0.012, amount: 29990, earnings: 360, status: 'Approved' },
    { id: 'TXN-902', date: '2026-07-02', productName: 'FlexRun Pro Men Red Running Shoes', type: 'user', rate: 0.03, amount: 2499, earnings: 75, status: 'Pending' }
  ],
  payouts: []
};
