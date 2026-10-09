/* Mock Database for AbKharido.com (Verified Inventory) */

export const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: 'LayoutGrid' },
  { id: 'mobiles', name: 'Mobiles', icon: 'Smartphone' },
  { id: 'electronics', name: 'Electronics', icon: 'Laptop' },
  { id: 'fashion', name: 'Fashion', icon: 'Shirt' },
  { id: 'home', name: 'Home & Living', icon: 'Home' },
  { id: 'appliances', name: 'Appliances', icon: 'Tv' }
];

export const ARCHIVED_PURGED_PRODUCTS = [
  {
    "id": "iphone-15-pro",
    "name": "Apple iPhone 15 Pro (Titanium Gray, 128 GB)",
    "category": "mobiles",
    "price": 129990,
    "originalPrice": 134900,
    "rating": 4.7,
    "reviewsCount": 1845,
    "image": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Experience iPhone 15 Pro. Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.",
    "specifications": [
      {
        "key": "Display",
        "value": "6.1-inch Super Retina XDR OLED"
      },
      {
        "key": "Processor",
        "value": "A17 Pro Chip with 6-Core GPU"
      },
      {
        "key": "Rear Camera",
        "value": "48MP Main + 12MP Ultra Wide + 12MP Telephoto"
      },
      {
        "key": "Front Camera",
        "value": "12MP TrueDepth Front Camera"
      },
      {
        "key": "Battery Life",
        "value": "Up to 23 hours video playback"
      }
    ],
    "influencerCommissionRate": 0.02,
    "userCommissionRate": 0.005,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "source_mock_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "samsung-s24-ultra",
    "name": "Samsung Galaxy S24 Ultra 5G (Titanium Yellow, 256 GB)",
    "category": "mobiles",
    "price": 129999,
    "originalPrice": 139999,
    "rating": 4.8,
    "reviewsCount": 942,
    "image": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity and possibility.",
    "specifications": [
      {
        "key": "Display",
        "value": "6.8-inch Dynamic AMOLED 2X, QHD+"
      },
      {
        "key": "Processor",
        "value": "Snapdragon 8 Gen 3 for Galaxy"
      },
      {
        "key": "Rear Camera",
        "value": "200MP Main + 50MP + 12MP + 10MP Quad Camera"
      },
      {
        "key": "Front Camera",
        "value": "12MP Front Camera"
      },
      {
        "key": "S-Pen Support",
        "value": "Yes, Included in-box"
      }
    ],
    "influencerCommissionRate": 0.02,
    "userCommissionRate": 0.005,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "source_mock_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "macbook-air-m3",
    "name": "Apple MacBook Air M3 (13.6-inch, 8GB RAM, 256GB SSD)",
    "category": "electronics",
    "price": 104900,
    "originalPrice": 114900,
    "rating": 4.6,
    "reviewsCount": 320,
    "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "The MacBook Air with M3 chip is superportable, superfast, and supercharged for work, play, and everything you do. Up to 18 hours of battery life.",
    "specifications": [
      {
        "key": "Display",
        "value": "13.6-inch Liquid Retina Display"
      },
      {
        "key": "Processor",
        "value": "Apple M3 Chip with 8-Core CPU"
      },
      {
        "key": "Memory",
        "value": "8GB Unified Memory"
      },
      {
        "key": "Storage",
        "value": "256GB Superfast SSD"
      },
      {
        "key": "OS",
        "value": "macOS Sonoma"
      }
    ],
    "influencerCommissionRate": 0.03,
    "userCommissionRate": 0.01,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "source_mock_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "sony-wh1000xm5",
    "name": "Sony WH-1000XM5 Wireless Noise Cancelling Headphones (Black)",
    "category": "electronics",
    "price": 29990,
    "originalPrice": 34990,
    "rating": 4.5,
    "reviewsCount": 2712,
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Industry-leading noise cancellation. Two processors control 8 microphones for unprecedented noise cancelling. Auto NC Optimizer dynamically optimizes cancellation based on wearing conditions.",
    "specifications": [
      {
        "key": "Headphone Type",
        "value": "Over-Ear"
      },
      {
        "key": "Connectivity",
        "value": "Bluetooth 5.2 & 3.5mm Wired"
      },
      {
        "key": "Battery Life",
        "value": "Up to 30 hours"
      },
      {
        "key": "Charging",
        "value": "Quick Charge (3 min for 3 hours)"
      }
    ],
    "influencerCommissionRate": 0.03,
    "userCommissionRate": 0.01,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "source_mock_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "sneaker-running-shoes",
    "name": "Nike Air Max Running Sneakers (Volt Green/Black)",
    "category": "fashion",
    "price": 8499,
    "originalPrice": 10999,
    "rating": 4.4,
    "reviewsCount": 310,
    "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Break boundaries with the Nike Air Max. Featuring a light, breathable mesh upper, responsive Air cushioning, and durable rubber traction outsole.",
    "specifications": [
      {
        "key": "Ideal For",
        "value": "Men & Women (Unisex)"
      },
      {
        "key": "Sole Material",
        "value": "Rubber Air Sole"
      },
      {
        "key": "Color",
        "value": "Volt Green/Black"
      },
      {
        "key": "Closure",
        "value": "Lace-Up"
      }
    ],
    "influencerCommissionRate": 0.07,
    "userCommissionRate": 0.03,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "casual-cotton-shirt",
    "name": "AbKharido Basics Slim-Fit Cotton Shirt (Classic White)",
    "category": "fashion",
    "price": 1299,
    "originalPrice": 1999,
    "rating": 4.2,
    "reviewsCount": 1540,
    "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Perfect for business or casual wear. Crafted from 100% premium long-staple cotton with a soft wash finish for ultimate comfort.",
    "specifications": [
      {
        "key": "Material",
        "value": "100% Premium Cotton"
      },
      {
        "key": "Fit",
        "value": "Slim Fit"
      },
      {
        "key": "Sleeve",
        "value": "Full Sleeve"
      },
      {
        "key": "Wash Care",
        "value": "Machine wash warm"
      }
    ],
    "influencerCommissionRate": 0.07,
    "userCommissionRate": 0.03,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "analog-minimalist-watch",
    "name": "TimePiece Classic Minimalist Men's Leather Watch",
    "category": "fashion",
    "price": 4999,
    "originalPrice": 7999,
    "rating": 4.3,
    "reviewsCount": 198,
    "image": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Understated elegance. Features a 40mm stainless steel case, genuine Italian leather strap, scratch-resistant mineral glass, and Japanese quartz movement.",
    "specifications": [
      {
        "key": "Strap Material",
        "value": "Genuine Italian Leather"
      },
      {
        "key": "Movement",
        "value": "Japanese Quartz"
      },
      {
        "key": "Water Resistance",
        "value": "3 ATM (30 meters)"
      },
      {
        "key": "Dial Diameter",
        "value": "40 mm"
      }
    ],
    "influencerCommissionRate": 0.07,
    "userCommissionRate": 0.03,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "blackout-window-curtains",
    "name": "DecoFit Premium Blackout Window Curtains (Set of 2, Grey)",
    "category": "home",
    "price": 1899,
    "originalPrice": 2999,
    "rating": 4.5,
    "reviewsCount": 1104,
    "image": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Block 99% light and UV rays. Features triple-weave thermal insulated fabric to reduce noise and balance room temperature. Eyelet headers for easy hanging.",
    "specifications": [
      {
        "key": "Dimensions",
        "value": "7 feet x 4 feet (Door Size)"
      },
      {
        "key": "Material",
        "value": "100% Polyester Triple-Weave"
      },
      {
        "key": "Header Type",
        "value": "Metal Grommets (Eyelets)"
      },
      {
        "key": "Package Contents",
        "value": "2 Curtain Panels"
      }
    ],
    "influencerCommissionRate": 0.05,
    "userCommissionRate": 0.02,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "ceramic-table-lamp",
    "name": "Lumina Craft Ceramic Table Lamp with Fabric Shade",
    "category": "home",
    "price": 2499,
    "originalPrice": 3999,
    "rating": 4.4,
    "reviewsCount": 88,
    "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Add warmth to your bedroom or living room. Features a textured ceramic base in white and beige finish, complete with a neutral linen drum shade.",
    "specifications": [
      {
        "key": "Base Material",
        "value": "Textured Ceramic"
      },
      {
        "key": "Shade Material",
        "value": "Natural Linen Fabric"
      },
      {
        "key": "Bulb Base",
        "value": "E27 (LED Bulb Included)"
      },
      {
        "key": "Cord Length",
        "value": "1.5 meters with on/off switch"
      }
    ],
    "influencerCommissionRate": 0.05,
    "userCommissionRate": 0.02,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "smart-led-tv-4k",
    "name": "AbKharido Vision 55-inch Ultra HD 4K Smart TV",
    "category": "appliances",
    "price": 34999,
    "originalPrice": 49999,
    "rating": 4.5,
    "reviewsCount": 3950,
    "image": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1552975084-6e027cd345c2?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Immerse yourself in cinematic 4K resolution. Equipped with Dolby Vision, HDR10+, and 30W Dolby Atmos sound, powered by Android TV for access to all popular streaming platforms.",
    "specifications": [
      {
        "key": "Resolution",
        "value": "4K Ultra HD (3840 x 2160)"
      },
      {
        "key": "Sound",
        "value": "30 Watts Speakers with Dolby Atmos"
      },
      {
        "key": "Operating System",
        "value": "Android TV 11 with built-in Chromecast"
      },
      {
        "key": "Ports",
        "value": "3 HDMI, 2 USB, Bluetooth 5.0, WiFi"
      }
    ],
    "influencerCommissionRate": 0.04,
    "userCommissionRate": 0.015,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "double-door-refrigerator",
    "name": "FrostGuard 240L Frost-Free Double Door Refrigerator",
    "category": "appliances",
    "price": 22990,
    "originalPrice": 28990,
    "rating": 4.3,
    "reviewsCount": 654,
    "image": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Convertible freezer technology. Features smart inverter compressor to optimize cooling while saving energy. Auto frost-free prevents ice build-up.",
    "specifications": [
      {
        "key": "Capacity",
        "value": "240 Liters"
      },
      {
        "key": "Energy Star Rating",
        "value": "3 Star (2026 guidelines)"
      },
      {
        "key": "Compressor",
        "value": "Smart Inverter (10 Year Warranty)"
      },
      {
        "key": "Defrost System",
        "value": "Frost Free Auto Defrost"
      }
    ],
    "influencerCommissionRate": 0.04,
    "userCommissionRate": 0.015,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "mechanical-keyboard-pro",
    "name": "KeyCraft K8 Pro Mechanical Keyboard (Hot-swappable, RGB)",
    "category": "electronics",
    "price": 7999,
    "originalPrice": 9999,
    "rating": 4.8,
    "reviewsCount": 112,
    "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1626958390898-162d3577f593?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Designed for coders and gamers alike. The KeyCraft K8 Pro features hot-swappable Gateron Brown switches, double-shot PBT keycaps, and beautiful custom south-facing RGB presets.",
    "specifications": [
      {
        "key": "Layout",
        "value": "Tenkeyless (TKL) 80% Layout"
      },
      {
        "key": "Switches",
        "value": "Pre-lubed Gateron G Pro Brown (Tactile)"
      },
      {
        "key": "Keycaps",
        "value": "Double-Shot PBT, OEM Profile"
      },
      {
        "key": "Battery",
        "value": "4000mAh Rechargeable (Bluetooth/Wired)"
      }
    ],
    "influencerCommissionRate": 0.03,
    "userCommissionRate": 0.012,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "source_mock_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "loreal-shampoo",
    "name": "L'Oreal Professionnel Serie Expert Shampoo (1500 ml)",
    "category": "beauty",
    "price": 1850,
    "originalPrice": 2100,
    "rating": 4.5,
    "reviewsCount": 824,
    "image": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Professional shampoo for colored and damaged hair. Hydrates, cleanses, and restores hair fiber strength.",
    "specifications": [
      {
        "key": "Volume",
        "value": "1500 ml"
      },
      {
        "key": "Type",
        "value": "Damaged Hair Expert care"
      }
    ],
    "influencerCommissionRate": 0.07,
    "userCommissionRate": 0.03,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "lego-police-station",
    "name": "LEGO City Police Station Toy Building Block Set (668 Pieces)",
    "category": "toys",
    "price": 4999,
    "originalPrice": 5999,
    "rating": 4.7,
    "reviewsCount": 412,
    "image": "/uploads/lego_police_station.jpg",
    "images": [
      "/uploads/lego_police_station.jpg"
    ],
    "description": "Feature-rich 3-level police station building set. Comes with standard cruiser, helicopter, garbage truck, and 5 mini-figures.",
    "specifications": [
      {
        "key": "Ages",
        "value": "6+"
      },
      {
        "key": "Pieces",
        "value": "668 Blocks"
      }
    ],
    "influencerCommissionRate": 0.05,
    "userCommissionRate": 0.02,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "organic-honey-pure",
    "name": "AbKharido Organic Raw Forest Honey (1 kg)",
    "category": "food",
    "price": 450,
    "originalPrice": 590,
    "rating": 4.6,
    "reviewsCount": 1980,
    "image": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "100% natural raw forest honey. Directly harvested from sustainable organic bee farms, unfiltered and chemical-free.",
    "specifications": [
      {
        "key": "Weight",
        "value": "1 kg"
      },
      {
        "key": "Source",
        "value": "Organic Himalayan Forest"
      }
    ],
    "influencerCommissionRate": 0.05,
    "userCommissionRate": 0.02,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "vega-cruiser-helmet",
    "name": "Vega Cruiser Open Face Motorbike Helmet (ISI Certified)",
    "category": "auto",
    "price": 1250,
    "originalPrice": 1599,
    "rating": 4.4,
    "reviewsCount": 3420,
    "image": "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Open face ISI certified riding helmet with scratch-resistant clear visor, dynamic ventilation system, and quick-release buckle.",
    "specifications": [
      {
        "key": "Certification",
        "value": "ISI Approved"
      },
      {
        "key": "Size",
        "value": "Medium (58cm)"
      }
    ],
    "influencerCommissionRate": 0.05,
    "userCommissionRate": 0.02,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "mrf-cricket-bat",
    "name": "MRF Genius Grand Edition English Willow Cricket Bat",
    "category": "sports",
    "price": 9999,
    "originalPrice": 12999,
    "rating": 4.7,
    "reviewsCount": 88,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Premium English willow bat as used by elite international players. Perfect balance, thick edges, and superb punch response.",
    "specifications": [
      {
        "key": "Willow",
        "value": "English Willow Grade 1"
      },
      {
        "key": "Weight",
        "value": "1180 grams"
      }
    ],
    "influencerCommissionRate": 0.05,
    "userCommissionRate": 0.02,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "office-chair-ergonomic",
    "name": "ComfortX Ergonomic Mesh High-Back Office Chair",
    "category": "furniture",
    "price": 7499,
    "originalPrice": 9999,
    "rating": 4.5,
    "reviewsCount": 312,
    "image": "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "High back work desk chair with breathable mesh back, adjustable lumbar support, 3D armrests, and premium tilt-lock mechanism.",
    "specifications": [
      {
        "key": "Frame",
        "value": "Heavy Duty Nylon"
      },
      {
        "key": "Upholstery",
        "value": "High Tensile Mesh"
      }
    ],
    "influencerCommissionRate": 0.05,
    "userCommissionRate": 0.02,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "alchemist-novel",
    "name": "The Alchemist (Paperback) - By Paulo Coelho",
    "category": "books",
    "price": 299,
    "originalPrice": 399,
    "rating": 4.8,
    "reviewsCount": 12500,
    "image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "A beautiful fable about Santiago, an Andalusian shepherd boy who journeys to Egypt in search of a worldly treasure.",
    "specifications": [
      {
        "key": "Author",
        "value": "Paulo Coelho"
      },
      {
        "key": "Format",
        "value": "Paperback"
      }
    ],
    "influencerCommissionRate": 0.07,
    "userCommissionRate": 0.03,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "ola-s1-pro",
    "name": "Ola S1 Pro Gen 2 Electric Scooter (Jet Black, 4kWh)",
    "category": "twowheelers",
    "price": 147999,
    "originalPrice": 152999,
    "rating": 4.6,
    "reviewsCount": 2150,
    "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Experience next-gen electric mobility. 195 km certified range, 120 km/h top speed, touchscreen smart dashboard, and keyless navigation.",
    "specifications": [
      {
        "key": "Range",
        "value": "195 km (IDC certified)"
      },
      {
        "key": "Top Speed",
        "value": "120 km/h"
      }
    ],
    "influencerCommissionRate": 0.02,
    "userCommissionRate": 0.005,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "samsung-a35",
    "name": "Samsung Galaxy A35 5G (Awesome Lilac, 128 GB)",
    "category": "mobiles",
    "price": 27999,
    "originalPrice": 30999,
    "rating": 4.3,
    "reviewsCount": 318,
    "image": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Premium glass back design, stunning AMOLED display, and triple rear camera with OIS makes Galaxy A35 your perfect daily partner.",
    "specifications": [
      {
        "key": "Display",
        "value": "6.6-inch Super AMOLED 120Hz"
      },
      {
        "key": "Rear Camera",
        "value": "50MP Main + 8MP + 5MP Triple Camera"
      },
      {
        "key": "Processor",
        "value": "Exynos 1380 Octa-Core"
      }
    ],
    "influencerCommissionRate": 0.02,
    "userCommissionRate": 0.005,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "oneplus-12r",
    "name": "OnePlus 12R (Cool Blue, 256 GB)",
    "category": "mobiles",
    "price": 39999,
    "originalPrice": 42999,
    "rating": 4.5,
    "reviewsCount": 855,
    "image": "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Smooth Beyond Belief. Driven by flagship hardware, 100W SUPERVOOC charging, and 4th Gen LTPO display.",
    "specifications": [
      {
        "key": "Display",
        "value": "6.78-inch ProXDR AMOLED 120Hz"
      },
      {
        "key": "Processor",
        "value": "Snapdragon 8 Gen 2"
      },
      {
        "key": "Charging",
        "value": "100W SUPERVOOC Power Adapter"
      }
    ],
    "influencerCommissionRate": 0.025,
    "userCommissionRate": 0.006,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "redmi-note-13-pro",
    "name": "Xiaomi Redmi Note 13 Pro 5G (Coral Purple, 128 GB)",
    "category": "mobiles",
    "price": 25999,
    "originalPrice": 28999,
    "rating": 4.4,
    "reviewsCount": 425,
    "image": "https://images.unsplash.com/photo-1565630916779-e303be97b6f5?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1565630916779-e303be97b6f5?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Featuring a flagship-grade 200MP camera with OIS, 1.5K curved AMOLED display, and turbocharging.",
    "specifications": [
      {
        "key": "Display",
        "value": "6.67-inch 1.5K AMOLED 120Hz"
      },
      {
        "key": "Rear Camera",
        "value": "200MP OIS + 8MP + 2MP Triple"
      },
      {
        "key": "Processor",
        "value": "Snapdragon 7s Gen 2"
      }
    ],
    "influencerCommissionRate": 0.02,
    "userCommissionRate": 0.005,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "hp-pavilion-15",
    "name": "HP Pavilion 15 (AMD Ryzen 5, 16GB RAM, 512GB SSD)",
    "category": "electronics",
    "price": 58999,
    "originalPrice": 64999,
    "rating": 4.2,
    "reviewsCount": 188,
    "image": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "A premium lightweight laptop loaded with powerful AMD hardware, Backlit keyboard, and dual B&O speakers.",
    "specifications": [
      {
        "key": "Display",
        "value": "15.6-inch Full HD IPS Display"
      },
      {
        "key": "Processor",
        "value": "AMD Ryzen 5 5600U"
      },
      {
        "key": "RAM & Storage",
        "value": "16GB DDR4 RAM, 512GB NVMe SSD"
      }
    ],
    "influencerCommissionRate": 0.02,
    "userCommissionRate": 0.005,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "ipad-air-m2",
    "name": "Apple iPad Air M2 (11-inch, Liquid Retina, Wi-Fi, 128GB)",
    "category": "electronics",
    "price": 59900,
    "originalPrice": 64900,
    "rating": 4.6,
    "reviewsCount": 115,
    "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Apple iPad Air supercharged by the M2 processor. Supports Apple Pencil Pro and Magic Keyboard.",
    "specifications": [
      {
        "key": "Display",
        "value": "11-inch Liquid Retina Display"
      },
      {
        "key": "Processor",
        "value": "Apple M2 Chip"
      }
    ],
    "influencerCommissionRate": 0.02,
    "userCommissionRate": 0.005,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "mens-slim-shirt",
    "name": "Men's Casual Slim Fit Cotton Shirt (Navy Blue)",
    "category": "fashion",
    "price": 1299,
    "originalPrice": 2499,
    "rating": 4.1,
    "reviewsCount": 84,
    "image": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "High-quality premium cotton fabric shirt tailored for casual styling. Breathable and comfortable.",
    "specifications": [
      {
        "key": "Material",
        "value": "100% Pure Cotton"
      },
      {
        "key": "Fit",
        "value": "Slim Fit"
      }
    ],
    "influencerCommissionRate": 0.05,
    "userCommissionRate": 0.015,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "nike-air-max",
    "name": "Nike Air Max Comfort Running Shoes (Black/White)",
    "category": "fashion",
    "price": 8999,
    "originalPrice": 9999,
    "rating": 4.5,
    "reviewsCount": 218,
    "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Plush Nike Air unit cushion, mesh ventilation overlays, durable grip rubber outer soles.",
    "specifications": [
      {
        "key": "Sole Material",
        "value": "Phylon Cushioned Midsole, Rubber Outsole"
      }
    ],
    "influencerCommissionRate": 0.04,
    "userCommissionRate": 0.01,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "levis-511-jeans",
    "name": "Levi's 511 Slim Fit Stretchable Denim Jeans",
    "category": "fashion",
    "price": 2499,
    "originalPrice": 3499,
    "rating": 4.2,
    "reviewsCount": 110,
    "image": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Modern slim jeans with room to move. Levi's 511 is a classic design since day one.",
    "specifications": [
      {
        "key": "Material",
        "value": "99% Cotton, 1% Elastane"
      }
    ],
    "influencerCommissionRate": 0.04,
    "userCommissionRate": 0.01,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "cotton-bedcover",
    "name": "Premium Cotton Double Bed Sheet with 2 Pillow Covers",
    "category": "home",
    "price": 1499,
    "originalPrice": 2499,
    "rating": 4.2,
    "reviewsCount": 78,
    "image": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "High thread count luxury bed sheets crafted for maximum softness and durability.",
    "specifications": [
      {
        "key": "Thread Count",
        "value": "300 TC"
      },
      {
        "key": "Material",
        "value": "100% Organic Cotton"
      }
    ],
    "influencerCommissionRate": 0.05,
    "userCommissionRate": 0.015,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "wooden-lamp",
    "name": "Modern Wooden Base Bedroom Table Lamp",
    "category": "home",
    "price": 1899,
    "originalPrice": 2999,
    "rating": 4.3,
    "reviewsCount": 54,
    "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Handcrafted minimalist table lamp adds natural warmth to your bedside or living space.",
    "specifications": [
      {
        "key": "Base Material",
        "value": "Solid Mango Wood"
      }
    ],
    "influencerCommissionRate": 0.05,
    "userCommissionRate": 0.015,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "lg-washing-machine",
    "name": "LG 8 kg Front Load Washing Machine with Inverter DD",
    "category": "appliances",
    "price": 34999,
    "originalPrice": 39999,
    "rating": 4.5,
    "reviewsCount": 218,
    "image": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Fully automatic washing machine with AI Direct Drive tech, Steam Clean, and 5-star power rating.",
    "specifications": [
      {
        "key": "Capacity",
        "value": "8.0 kg"
      },
      {
        "key": "Energy Rating",
        "value": "5 Star"
      }
    ],
    "influencerCommissionRate": 0.02,
    "userCommissionRate": 0.005,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "philips-airfryer",
    "name": "Philips Digital Air Fryer with Touch Panel (4.1L)",
    "category": "appliances",
    "price": 7999,
    "originalPrice": 9999,
    "rating": 4.6,
    "reviewsCount": 422,
    "image": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Cook delicious fried dishes with up to 90% less oil. Quickclean basket and automatic shutdown.",
    "specifications": [
      {
        "key": "Capacity",
        "value": "4.1 Litres"
      }
    ],
    "influencerCommissionRate": 0.04,
    "userCommissionRate": 0.01,
    "inStock": false,
    "source_api_json": true,
    "source_server_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "leather-biker-jacket",
    "name": "AbKharido Leather Biker Jacket - Slim Fit (Pitch Black)",
    "category": "fashion",
    "price": 4999,
    "originalPrice": 9999,
    "rating": 4.2,
    "reviewsCount": 88,
    "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Add a rugged edge to your outfit with this pure leather biker jacket. Crafted from top-grade sheepskin leather, it features custom metal hardware and dual lining.",
    "specifications": [
      {
        "key": "Material",
        "value": "100% Genuine Sheepskin Leather"
      },
      {
        "key": "Fit",
        "value": "Slim Fit Biker Cut"
      },
      {
        "key": "Closure",
        "value": "Asymmetrical Heavy-Duty Zippers"
      },
      {
        "key": "Pockets",
        "value": "3 Outer Zipper Pockets, 1 Inner Pocket"
      }
    ],
    "colorModels": [
      {
        "name": "Pitch Black",
        "primaryImage": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
        "images": [
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80"
        ],
        "variants": [
          {
            "name": "S (38)",
            "price": 4999,
            "originalPrice": 9999,
            "stock": 4,
            "sku": "JKT-BLK-S"
          },
          {
            "name": "M (40)",
            "price": 4999,
            "originalPrice": 9999,
            "stock": 12,
            "sku": "JKT-BLK-M"
          },
          {
            "name": "L (42)",
            "price": 4999,
            "originalPrice": 9999,
            "stock": 8,
            "sku": "JKT-BLK-L"
          },
          {
            "name": "XL (44)",
            "price": 5299,
            "originalPrice": 10499,
            "stock": 3,
            "sku": "JKT-BLK-XL"
          },
          {
            "name": "XXL (46)",
            "price": 5499,
            "originalPrice": 10999,
            "stock": 0,
            "sku": "JKT-BLK-XXL"
          }
        ]
      },
      {
        "name": "Vintage Brown",
        "primaryImage": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
        "images": [
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80"
        ],
        "variants": [
          {
            "name": "M (40)",
            "price": 4999,
            "originalPrice": 9999,
            "stock": 7,
            "sku": "JKT-BRN-M"
          },
          {
            "name": "L (42)",
            "price": 4999,
            "originalPrice": 9999,
            "stock": 5,
            "sku": "JKT-BRN-L"
          },
          {
            "name": "XL (44)",
            "price": 5299,
            "originalPrice": 10499,
            "stock": 0,
            "sku": "JKT-BRN-XL"
          }
        ]
      }
    ],
    "influencerCommissionRate": 0.07,
    "userCommissionRate": 0.03,
    "inStock": false,
    "source_mock_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "red-running-shoes",
    "name": "FlexRun Pro Men Red Sports Running Shoes",
    "category": "fashion",
    "price": 2499,
    "originalPrice": 4999,
    "rating": 4.4,
    "reviewsCount": 1540,
    "image": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Engineered for daily runs, the FlexRun Pro features an ultra-breathable mesh upper and responsiveness cushioning. The lightweight sole protects your joints.",
    "specifications": [
      {
        "key": "Type",
        "value": "Road Running Shoes"
      },
      {
        "key": "Outer Material",
        "value": "Engineered Mesh"
      },
      {
        "key": "Sole Material",
        "value": "EVA Midsole with Rubber Outsole"
      },
      {
        "key": "Weight",
        "value": "240g (Single Shoe)"
      }
    ],
    "colorModels": [
      {
        "name": "Crimson Red",
        "primaryImage": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80",
        "images": [
          "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80"
        ],
        "variants": [
          {
            "name": "UK 7 / EU 41",
            "price": 2499,
            "originalPrice": 4999,
            "stock": 5,
            "sku": "SHOE-RED-7"
          },
          {
            "name": "UK 8 / EU 42",
            "price": 2499,
            "originalPrice": 4999,
            "stock": 15,
            "sku": "SHOE-RED-8"
          },
          {
            "name": "UK 9 / EU 43",
            "price": 2499,
            "originalPrice": 4999,
            "stock": 9,
            "sku": "SHOE-RED-9"
          },
          {
            "name": "UK 10 / EU 44",
            "price": 2499,
            "originalPrice": 4999,
            "stock": 3,
            "sku": "SHOE-RED-10"
          },
          {
            "name": "UK 11 / EU 45",
            "price": 2699,
            "originalPrice": 5299,
            "stock": 0,
            "sku": "SHOE-RED-11"
          }
        ]
      },
      {
        "name": "Stealth Black",
        "primaryImage": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80",
        "images": [
          "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80"
        ],
        "variants": [
          {
            "name": "UK 8 / EU 42",
            "price": 2499,
            "originalPrice": 4999,
            "stock": 8,
            "sku": "SHOE-BLK-8"
          },
          {
            "name": "UK 9 / EU 43",
            "price": 2499,
            "originalPrice": 4999,
            "stock": 6,
            "sku": "SHOE-BLK-9"
          }
        ]
      }
    ],
    "influencerCommissionRate": 0.07,
    "userCommissionRate": 0.03,
    "inStock": false,
    "source_mock_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "chronograph-watch",
    "name": "Imperium Chronograph Men Analog Watch (Royal Gold & Pearl)",
    "category": "fashion",
    "price": 8999,
    "originalPrice": 17999,
    "rating": 4.3,
    "reviewsCount": 198,
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "The Imperium Chronograph defines status. Featuring a 42mm surgical stainless steel case plated in gold, white sunray dial, and full stopwatch functionalities.",
    "specifications": [
      {
        "key": "Display Type",
        "value": "Analog Chronograph"
      },
      {
        "key": "Movement",
        "value": "Japanese Quartz Movement"
      },
      {
        "key": "Water Resistance",
        "value": "50 Meters (5 ATM)"
      },
      {
        "key": "Strap Material",
        "value": "Genuine Croco-Pattern Leather"
      }
    ],
    "colorModels": [
      {
        "name": "Royal Gold & Pearl",
        "primaryImage": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
        "images": [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&auto=format&fit=crop&q=80"
        ],
        "variants": [
          {
            "name": "Leather Strap (42mm)",
            "price": 8999,
            "originalPrice": 17999,
            "stock": 7,
            "sku": "WTCH-GLD-LTH"
          },
          {
            "name": "Stainless Mesh (42mm)",
            "price": 9999,
            "originalPrice": 19999,
            "stock": 4,
            "sku": "WTCH-GLD-MSH"
          }
        ]
      }
    ],
    "influencerCommissionRate": 0.07,
    "userCommissionRate": 0.03,
    "inStock": false,
    "source_mock_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "coffee-maker-espresso",
    "name": "BaristaExpress 15-Bar Espresso & Cappuccino Maker",
    "category": "home",
    "price": 14999,
    "originalPrice": 24999,
    "rating": 4.4,
    "reviewsCount": 654,
    "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Bring the cafe home. With a professional 15-bar Italian pump pressure and a high-performance steam wand, you can froth milk for lattes and cappuccinos like a barista.",
    "specifications": [
      {
        "key": "Pressure",
        "value": "15 Bar Italian Pump"
      },
      {
        "key": "Water Tank Capacity",
        "value": "1.8 Liters Removable"
      },
      {
        "key": "Heater Type",
        "value": "Thermo-Block Instant heating"
      },
      {
        "key": "Accessories",
        "value": "Portafilter, Single/Double shot filters, Tamper-Scoop"
      }
    ],
    "colorModels": [
      {
        "name": "Brushed Steel",
        "primaryImage": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80",
        "images": [
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80"
        ],
        "variants": [
          {
            "name": "Standard Edition",
            "price": 14999,
            "originalPrice": 24999,
            "stock": 8,
            "sku": "COF-15BAR-STD"
          },
          {
            "name": "Barista Pack (+ Milk Pitcher & Tamper)",
            "price": 16499,
            "originalPrice": 26999,
            "stock": 3,
            "sku": "COF-15BAR-PRO"
          }
        ]
      }
    ],
    "influencerCommissionRate": 0.05,
    "userCommissionRate": 0.02,
    "inStock": false,
    "source_mock_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "ergonomic-office-chair",
    "name": "ErgoComfort High-Back Mesh Ergonomic Office Chair",
    "category": "home",
    "price": 11999,
    "originalPrice": 19999,
    "rating": 4.3,
    "reviewsCount": 423,
    "image": "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Correct your posture during long work hours. The ErgoComfort features adaptive lumbar support, 3D adjustable armrests, and premium breathable Korean mesh.",
    "specifications": [
      {
        "key": "Support",
        "value": "Dynamic Self-Adjusting Lumbar Support"
      },
      {
        "key": "Armrests",
        "value": "3D Adjustable (Height, Depth, Angle)"
      },
      {
        "key": "Base",
        "value": "Heavy Duty Nylon Base with Silent Castors"
      },
      {
        "key": "Weight Capacity",
        "value": "Up to 135 kg"
      }
    ],
    "colorModels": [
      {
        "name": "Onyx Black",
        "primaryImage": "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80",
        "images": [
          "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=600&auto=format&fit=crop&q=80"
        ],
        "variants": [
          {
            "name": "Standard Headrest",
            "price": 11999,
            "originalPrice": 19999,
            "stock": 11,
            "sku": "CHR-ERG-STD"
          },
          {
            "name": "3D Armrest + Footrest Pro",
            "price": 14499,
            "originalPrice": 22999,
            "stock": 4,
            "sku": "CHR-ERG-PRO"
          }
        ]
      }
    ],
    "influencerCommissionRate": 0.05,
    "userCommissionRate": 0.02,
    "inStock": false,
    "source_mock_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "smart-air-purifier",
    "name": "PureAir Smart HEPA H13 Air Purifier with WiFi Control",
    "category": "appliances",
    "price": 8999,
    "originalPrice": 12999,
    "rating": 4.6,
    "reviewsCount": 1150,
    "image": "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1626315582236-fa2c23565e31?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Clean air in minutes. Utilizing a True HEPA H13 filter that captures 99.97% of airborne pollutants down to 0.1 microns, including dust, smoke, pollen, and allergens.",
    "specifications": [
      {
        "key": "CADR Value",
        "value": "250 m³/h (Covers up to 350 sq.ft)"
      },
      {
        "key": "Filter Layers",
        "value": "Pre-Filter + True HEPA H13 + Activated Carbon"
      },
      {
        "key": "Connectivity",
        "value": "WiFi - Smart Life App / Alexa / Google Assistant"
      },
      {
        "key": "Noise Level",
        "value": "Ultra Silent 22dB in Sleep Mode"
      }
    ],
    "colorModels": [
      {
        "name": "Glacier White",
        "primaryImage": "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80",
        "images": [
          "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80"
        ],
        "variants": [
          {
            "name": "Standard H13 Unit",
            "price": 8999,
            "originalPrice": 12999,
            "stock": 16,
            "sku": "AP-H13-STD"
          },
          {
            "name": "Unit + Extra Pet Carbon Filter",
            "price": 10499,
            "originalPrice": 14999,
            "stock": 5,
            "sku": "AP-H13-COMBO"
          }
        ]
      }
    ],
    "influencerCommissionRate": 0.04,
    "userCommissionRate": 0.015,
    "inStock": false,
    "source_mock_data": true,
    "status": "archived",
    "isArchived": true
  },
  {
    "id": "ultra-hd-led-tv",
    "name": "Spectra 55-inch 4K Ultra HD Smart LED Android TV",
    "category": "appliances",
    "price": 34999,
    "originalPrice": 49999,
    "rating": 4.5,
    "reviewsCount": 3950,
    "image": "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80",
    "images": [
      "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1552975084-6e027cd345c2?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Immerse yourself in cinematic 4K resolution. Equipped with Dolby Vision, HDR10+, and 30W Dolby Atmos sound, powered by Android TV for access to all popular streaming platforms.",
    "specifications": [
      {
        "key": "Resolution",
        "value": "4K Ultra HD (3840 x 2160)"
      },
      {
        "key": "Refresh Rate",
        "value": "60 Hz Native Motion Enhancement"
      },
      {
        "key": "Sound Output",
        "value": "30 Watts Dolby Atmos & DTS Virtual:X"
      },
      {
        "key": "Operating System",
        "value": "Android TV 11 with Google Play & Chromecast"
      },
      {
        "key": "Connectivity",
        "value": "3 HDMI Ports, 2 USB, Dual-band WiFi, Bluetooth 5.0"
      },
      {
        "key": "Warranty",
        "value": "Archived"
      },
      {
        "key": "In-The-Box",
        "value": "1 TV Unit, Remote Control, Wall Mount Bracket, Power Cable, Manual"
      }
    ],
    "colorModels": [
      {
        "name": "Bezel-less Black",
        "primaryImage": "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80",
        "images": [
          "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1552975084-6e027cd345c2?w=600&auto=format&fit=crop&q=80"
        ],
        "variants": [
          {
            "name": "55-inch 4K",
            "price": 34999,
            "originalPrice": 49999,
            "stock": 12,
            "sku": "TV-4K-55"
          },
          {
            "name": "43-inch 4K",
            "price": 24999,
            "originalPrice": 34999,
            "stock": 7,
            "sku": "TV-4K-43"
          },
          {
            "name": "65-inch 4K",
            "price": 54999,
            "originalPrice": 74999,
            "stock": 2,
            "sku": "TV-4K-65"
          }
        ]
      }
    ],
    "influencerCommissionRate": 0.04,
    "userCommissionRate": 0.015,
    "inStock": false,
    "source_mock_data": true,
    "status": "archived",
    "isArchived": true
  }
];

export const PRODUCTS = [
  {
  "id": "signature-wireless-earphone",
  "name": "Signature Sigboom 21 wireless Bluetooth Speaker",
  "category": "electronics",
  "price": 379,
  "originalPrice": 758,
  "rating": 0,
  "reviewsCount": 0,
  "reviews": [],
  "badge": "TOP CHOICE",
  "image": "https://res.cloudinary.com/rx1klbob/image/upload/v1784995324/abkharido/products/r687it063mcwcn507c9w.jpg",
  "images": [
    "https://res.cloudinary.com/rx1klbob/image/upload/v1784995324/abkharido/products/r687it063mcwcn507c9w.jpg"
  ],
  "description": "AbKharido Original Signature Sigboom 21 Wireless Bluetooth Speaker. Features powerful 360° Dynamic RGB Party Lights, Deep Bass Sound, Built-in Phone Stand on top, FM Radio, TF card, USB, AUX, and Bluetooth 5.1 connectivity. Splash-proof and long-lasting battery life.",
  "specifications": [
    {
      "key": "Connectivity",
      "value": "Bluetooth 5.1, AUX, USB, TF Card, FM"
    },
    {
      "key": "Lighting",
      "value": "360° Dynamic Multi-Color RGB Party Lights"
    },
    {
      "key": "Special Feature",
      "value": "Built-in Smartphone Stand Mount"
    },
    {
      "key": "Sound Output",
      "value": "High Bass Stereo Drivers"
    },
    {
      "key": "Battery",
      "value": "Up to 12 Hours Playtime"
    },
    {
      "key": "Warranty",
      "value": "6 Months Seller Warranty"
    }
  ],
  "colorModels": [
    {
      "name": "Party RGB Edition",
      "primaryImage": "https://res.cloudinary.com/rx1klbob/image/upload/v1784995324/abkharido/products/r687it063mcwcn507c9w.jpg",
      "images": [
        "https://res.cloudinary.com/rx1klbob/image/upload/v1784995324/abkharido/products/r687it063mcwcn507c9w.jpg"
      ],
      "variants": [
        {
          "name": "Standard",
          "price": 379,
          "originalPrice": 758,
          "stock": 45,
          "sku": "SIG-BOOM-21-STD"
        }
      ]
    }
  ],
  "inStock": true,
  "stock": 45,
  "freeDelivery": true,
  "flashSale": {
    "isActive": false,
    "price": 379,
    "endTime": "2026-07-26T00:00:00.000Z"
  },
  "status": "published"
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
    { id: 'TXN-101', date: '2026-06-25', productName: 'Signature Sigboom 21 wireless Bluetooth Speaker', type: 'user', rate: 0.012, amount: 379, earnings: 4, status: 'Approved' }
  ],
  payouts: []
};
