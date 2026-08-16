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
    colorModels: [
      {
        name: 'Natural Titanium',
        primaryImage: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: '128 GB', price: 129990, originalPrice: 134900, stock: 15, sku: 'IP15P-NT-128' },
          { name: '256 GB', price: 139990, originalPrice: 144900, stock: 8, sku: 'IP15P-NT-256' },
          { name: '512 GB', price: 159990, originalPrice: 164900, stock: 3, sku: 'IP15P-NT-512' },
          { name: '1 TB', price: 179990, originalPrice: 184900, stock: 0, sku: 'IP15P-NT-1TB' }
        ]
      },
      {
        name: 'Black Titanium',
        primaryImage: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: '128 GB', price: 129990, originalPrice: 134900, stock: 12, sku: 'IP15P-BT-128' },
          { name: '256 GB', price: 139990, originalPrice: 144900, stock: 6, sku: 'IP15P-BT-256' },
          { name: '512 GB', price: 159990, originalPrice: 164900, stock: 2, sku: 'IP15P-BT-512' }
        ]
      },
      {
        name: 'White Titanium',
        primaryImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: '128 GB', price: 129990, originalPrice: 134900, stock: 5, sku: 'IP15P-WT-128' },
          { name: '256 GB', price: 139990, originalPrice: 144900, stock: 4, sku: 'IP15P-WT-256' }
        ]
      }
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
    colorModels: [
      {
        name: 'Titanium Yellow',
        primaryImage: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: '256 GB / 12GB RAM', price: 129999, originalPrice: 139999, stock: 14, sku: 'S24U-TY-256' },
          { name: '512 GB / 12GB RAM', price: 139999, originalPrice: 149999, stock: 5, sku: 'S24U-TY-512' },
          { name: '1 TB / 12GB RAM', price: 159999, originalPrice: 169999, stock: 0, sku: 'S24U-TY-1TB' }
        ]
      },
      {
        name: 'Titanium Gray',
        primaryImage: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: '256 GB / 12GB RAM', price: 129999, originalPrice: 139999, stock: 10, sku: 'S24U-TG-256' },
          { name: '512 GB / 12GB RAM', price: 139999, originalPrice: 149999, stock: 4, sku: 'S24U-TG-512' }
        ]
      }
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
    colorModels: [
      {
        name: 'Space Gray',
        primaryImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: '8GB RAM / 256GB SSD', price: 104900, originalPrice: 114900, stock: 12, sku: 'MBA-M3-SG-256' },
          { name: '16GB RAM / 512GB SSD', price: 124900, originalPrice: 134900, stock: 6, sku: 'MBA-M3-SG-512' },
          { name: '24GB RAM / 512GB SSD', price: 144900, originalPrice: 154900, stock: 0, sku: 'MBA-M3-SG-1TB' }
        ]
      },
      {
        name: 'Midnight',
        primaryImage: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: '8GB RAM / 256GB SSD', price: 104900, originalPrice: 114900, stock: 8, sku: 'MBA-M3-MN-256' },
          { name: '16GB RAM / 512GB SSD', price: 124900, originalPrice: 134900, stock: 4, sku: 'MBA-M3-MN-512' }
        ]
      }
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
    colorModels: [
      {
        name: 'Midnight Black',
        primaryImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: 'Standard Edition', price: 29990, originalPrice: 34990, stock: 20, sku: 'SONY-XM5-BLK' },
          { name: 'Pro Travel Pack (+ Hard Case)', price: 31990, originalPrice: 37990, stock: 5, sku: 'SONY-XM5-BLK-PRO' }
        ]
      },
      {
        name: 'Platinum Silver',
        primaryImage: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: 'Standard Edition', price: 29990, originalPrice: 34990, stock: 12, sku: 'SONY-XM5-SLV' }
        ]
      }
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
    colorModels: [
      {
        name: 'Pitch Black',
        primaryImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: 'S (38)', price: 4999, originalPrice: 9999, stock: 4, sku: 'JKT-BLK-S' },
          { name: 'M (40)', price: 4999, originalPrice: 9999, stock: 12, sku: 'JKT-BLK-M' },
          { name: 'L (42)', price: 4999, originalPrice: 9999, stock: 8, sku: 'JKT-BLK-L' },
          { name: 'XL (44)', price: 5299, originalPrice: 10499, stock: 3, sku: 'JKT-BLK-XL' },
          { name: 'XXL (46)', price: 5499, originalPrice: 10999, stock: 0, sku: 'JKT-BLK-XXL' }
        ]
      },
      {
        name: 'Vintage Brown',
        primaryImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: 'M (40)', price: 4999, originalPrice: 9999, stock: 7, sku: 'JKT-BRN-M' },
          { name: 'L (42)', price: 4999, originalPrice: 9999, stock: 5, sku: 'JKT-BRN-L' },
          { name: 'XL (44)', price: 5299, originalPrice: 10499, stock: 0, sku: 'JKT-BRN-XL' }
        ]
      }
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
    colorModels: [
      {
        name: 'Crimson Red',
        primaryImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: 'UK 7 / EU 41', price: 2499, originalPrice: 4999, stock: 5, sku: 'SHOE-RED-7' },
          { name: 'UK 8 / EU 42', price: 2499, originalPrice: 4999, stock: 15, sku: 'SHOE-RED-8' },
          { name: 'UK 9 / EU 43', price: 2499, originalPrice: 4999, stock: 9, sku: 'SHOE-RED-9' },
          { name: 'UK 10 / EU 44', price: 2499, originalPrice: 4999, stock: 3, sku: 'SHOE-RED-10' },
          { name: 'UK 11 / EU 45', price: 2699, originalPrice: 5299, stock: 0, sku: 'SHOE-RED-11' }
        ]
      },
      {
        name: 'Stealth Black',
        primaryImage: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: 'UK 8 / EU 42', price: 2499, originalPrice: 4999, stock: 8, sku: 'SHOE-BLK-8' },
          { name: 'UK 9 / EU 43', price: 2499, originalPrice: 4999, stock: 6, sku: 'SHOE-BLK-9' }
        ]
      }
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
    colorModels: [
      {
        name: 'Royal Gold & Pearl',
        primaryImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: 'Leather Strap (42mm)', price: 8999, originalPrice: 17999, stock: 7, sku: 'WTCH-GLD-LTH' },
          { name: 'Stainless Mesh (42mm)', price: 9999, originalPrice: 19999, stock: 4, sku: 'WTCH-GLD-MSH' }
        ]
      }
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
    colorModels: [
      {
        name: 'Brushed Steel',
        primaryImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: 'Standard Edition', price: 14999, originalPrice: 24999, stock: 8, sku: 'COF-15BAR-STD' },
          { name: 'Barista Pack (+ Milk Pitcher & Tamper)', price: 16499, originalPrice: 26999, stock: 3, sku: 'COF-15BAR-PRO' }
        ]
      }
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
    colorModels: [
      {
        name: 'Onyx Black',
        primaryImage: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: 'Standard Headrest', price: 11999, originalPrice: 19999, stock: 11, sku: 'CHR-ERG-STD' },
          { name: '3D Armrest + Footrest Pro', price: 14499, originalPrice: 22999, stock: 4, sku: 'CHR-ERG-PRO' }
        ]
      }
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
    colorModels: [
      {
        name: 'Glacier White',
        primaryImage: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: 'Standard H13 Unit', price: 8999, originalPrice: 12999, stock: 16, sku: 'AP-H13-STD' },
          { name: 'Unit + Extra Pet Carbon Filter', price: 10499, originalPrice: 14999, stock: 5, sku: 'AP-H13-COMBO' }
        ]
      }
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
    colorModels: [
      {
        name: 'Bezel-less Black',
        primaryImage: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1552975084-6e027cd345c2?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: '43-inch 4K', price: 24999, originalPrice: 34999, stock: 7, sku: 'TV-4K-43' },
          { name: '55-inch 4K', price: 34999, originalPrice: 49999, stock: 12, sku: 'TV-4K-55' },
          { name: '65-inch 4K', price: 54999, originalPrice: 74999, stock: 2, sku: 'TV-4K-65' }
        ]
      }
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
    colorModels: [
      {
        name: 'Retro Charcoal & Cyan',
        primaryImage: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80'
        ],
        variants: [
          { name: 'Tactile Brown Switches', price: 7999, originalPrice: 9999, stock: 14, sku: 'KB-K8-BRN' },
          { name: 'Linear Red Switches', price: 7999, originalPrice: 9999, stock: 6, sku: 'KB-K8-RED' },
          { name: 'Clicky Blue Switches', price: 7999, originalPrice: 9999, stock: 0, sku: 'KB-K8-BLU' }
        ]
      }
    ],
    influencerCommissionRate: 0.03,
    userCommissionRate: 0.012,
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

