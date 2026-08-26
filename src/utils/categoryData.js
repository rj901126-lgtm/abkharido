// Comprehensive Category Taxonomy with Sub-Categories, Visual Thumbnails, Starting Prices, Quick Filter Chips & Popular Brands

export const CATEGORY_DETAILS = {
  all: {
    id: 'all',
    name: 'All Categories',
    icon: '🛍️',
    tagline: 'Direct Brand Authorization with Official 1-Year Pan-India Warranty',
    promoTicker: '⚡ All-India Megastore Carnival: Instant Extra 15% Off with AB Coins on 10,000+ Verified Products',
    subCategories: [
      { 
        id: '5g-mobiles', 
        name: '5G Smartphones', 
        icon: '📱', 
        query: '5G', 
        badge: 'HOT', 
        startingPrice: 'From ₹12,999', 
        discount: 'Min 25% Off',
        img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80',
        quickChips: ['Apple iPhone', 'Samsung Galaxy', 'OnePlus 5G', 'Under ₹15,000']
      },
      { 
        id: 'laptops', 
        name: 'Laptops & MacBooks', 
        icon: '💻', 
        query: 'Laptop', 
        badge: 'M3 / i7', 
        startingPrice: 'From ₹28,990', 
        discount: 'Flat ₹8,000 Off',
        img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&q=80',
        quickChips: ['MacBook Air', 'Gaming RTX', 'Intel Core i7']
      },
      { 
        id: 'mens-fashion', 
        name: "Men & Women Wear", 
        icon: '👗', 
        query: 'Fashion', 
        badge: 'TRENDING', 
        startingPrice: 'From ₹699', 
        discount: 'Min 40% Off',
        img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80',
        quickChips: ['Pure Cotton Shirts', 'Ethnic Sarees', 'Casual Wear']
      },
      { 
        id: 'smartwatches-audio', 
        name: 'Audio & Wearables', 
        icon: '🎧', 
        query: 'Headphones', 
        badge: 'STUDIO', 
        startingPrice: 'From ₹999', 
        discount: 'Min 50% Off',
        img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80',
        quickChips: ['boAt Airdopes', 'Sony ANC', 'Noise Watch']
      },
      { 
        id: 'home-kitchen', 
        name: 'Home & Kitchen', 
        icon: '🏠', 
        query: 'Kitchen', 
        badge: 'BESTSELLER', 
        startingPrice: 'From ₹499', 
        discount: 'Buy 1 Get 1',
        img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&q=80',
        quickChips: ['Air Fryers', 'Bedding Linen', 'Smart Purifiers']
      },
      { 
        id: 'beauty-wellness', 
        name: 'Beauty & Fitness', 
        icon: '✨', 
        query: 'Beauty', 
        badge: '100% PURE', 
        startingPrice: 'From ₹299', 
        discount: 'Flat 30% Off',
        img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&q=80',
        quickChips: ['Glow Serums', 'Whey Protein', 'Dumbbells Set']
      }
    ],
    popularBrands: [
      { name: 'Apple', desc: 'iPhone 16 & MacBook', icon: '🍏', query: 'Apple', offer: 'Flat ₹5,000 Off' },
      { name: 'Samsung', desc: 'Galaxy AI & Ultra 5G', icon: '🌌', query: 'Samsung', offer: 'No Cost EMI' },
      { name: 'Sony', desc: 'WH-1000XM5 Studio', icon: '🎧', query: 'Sony', offer: 'Spatial Audio' },
      { name: 'Nike', desc: 'Air Jordan & Running', icon: '👟', query: 'Nike', offer: 'Flat 30% Off' },
      { name: 'boAt', desc: 'Airdopes & Speakers', icon: '⛵', query: 'boAt', offer: 'Up to 70% Off' },
      { name: 'Philips', desc: 'Smart Living & Care', icon: '💡', query: 'Philips', offer: 'Top Rated' }
    ]
  },

  mobiles: {
    id: 'mobiles',
    name: 'Mobiles & Smartphones',
    icon: '📱',
    tagline: 'Direct Brand Authorization with Official 1-Year Pan-India Warranty',
    promoTicker: '⚡ Mega Mobile Carnival: Extra ₹1,000 Instant Bank Off + 50 AB Coins on all 5G Smartphones!',
    subCategories: [
      { 
        id: '5g-mobiles', 
        name: '5G Flagships', 
        icon: '📱', 
        query: '5G', 
        badge: 'HOT', 
        startingPrice: 'From ₹12,999', 
        discount: 'Min 25% Off',
        img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80',
        quickChips: ['Under ₹15,000', '₹15K - ₹30K', 'Flagship > ₹50K', '120Hz AMOLED', '5000mAh Battery']
      },
      { 
        id: 'budget-smartphones', 
        name: 'Budget Phones', 
        icon: '🏷️', 
        query: 'Smartphone', 
        badge: 'UNDER ₹15K', 
        startingPrice: 'From ₹6,999', 
        discount: 'Up to 40% Off',
        img: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=200&q=80',
        quickChips: ['Under ₹8,000', 'Under ₹12,000', '6GB RAM', 'Dual Camera']
      },
      { 
        id: 'gaming-phones', 
        name: 'Gaming Phones', 
        icon: '🎮', 
        query: 'Gaming Phone', 
        badge: 'HIGH FPS', 
        startingPrice: 'From ₹19,999', 
        discount: 'Liquid Cooling',
        img: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=200&q=80',
        quickChips: ['Snapdragon 8 Gen', '144Hz Refresh', 'Fast 120W Charge']
      },
      { 
        id: 'smartwatches', 
        name: 'Smartwatches & Bands', 
        icon: '⌚', 
        query: 'Smartwatch', 
        badge: 'AMOLED', 
        startingPrice: 'From ₹1,499', 
        discount: 'Min 50% Off',
        img: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=200&q=80',
        quickChips: ['Bluetooth Calling', 'AMOLED Display', 'Waterproof IP68']
      },
      { 
        id: 'fast-chargers', 
        name: 'Fast Chargers & Cables', 
        icon: '🔌', 
        query: 'Charger', 
        badge: '65W-120W', 
        startingPrice: 'From ₹399', 
        discount: 'Flat ₹200 Off',
        img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&q=80',
        quickChips: ['65W GaN', 'Type-C Braided', 'Wireless Pad']
      },
      { 
        id: 'cases-covers', 
        name: 'Cases & Screen Glass', 
        icon: '🛡️', 
        query: 'Case', 
        badge: 'PROTECT', 
        startingPrice: 'From ₹199', 
        discount: 'Buy 2 Get 1',
        img: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200&q=80',
        quickChips: ['Military Drop Test', 'MagSafe Clear', '9H Tempered']
      }
    ],
    popularBrands: [
      { name: 'Apple', desc: 'iPhone 16 & Pro Max', icon: '🍏', query: 'Apple', offer: 'Flat ₹5,000 Off' },
      { name: 'Samsung', desc: 'Galaxy AI & Ultra 5G', icon: '🌌', query: 'Samsung', offer: 'No Cost EMI' },
      { name: 'OnePlus', desc: 'Never Settle 5G', icon: '🔴', query: 'OnePlus', offer: 'Min 20% Off' },
      { name: 'Xiaomi', desc: 'Redmi & Note 5G', icon: '🟠', query: 'Xiaomi', offer: 'Under ₹12,999' },
      { name: 'Realme', desc: 'Speed Flagship Series', icon: '🟡', query: 'Realme', offer: 'Launch Offers' },
      { name: 'Vivo', desc: 'Zeiss Portrait Masters', icon: '🔷', query: 'Vivo', offer: 'Special Deal' }
    ]
  },

  electronics: {
    id: 'electronics',
    name: 'Electronics & Audio',
    icon: '🎧',
    tagline: 'Quantum Studio Acoustics, 4K Displays & Performance Laptops',
    promoTicker: '🎧 Audio & Gadget Fest: Flat 40% Off on Sony & boAt ANC Headphones | 100% Genuine Studio Acoustics',
    subCategories: [
      { 
        id: 'headphones', 
        name: 'Wireless Headphones', 
        icon: '🎧', 
        query: 'Headphones', 
        badge: 'ANC', 
        startingPrice: 'From ₹1,999', 
        discount: 'Min 30% Off',
        img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&q=80',
        quickChips: ['Active Noise Cancel', '60Hr Battery', 'Spatial Audio', 'Over-Ear Cushion']
      },
      { 
        id: 'earbuds', 
        name: 'TWS Spatial Earbuds', 
        icon: '🎵', 
        query: 'Earbuds', 
        badge: 'DOLBY', 
        startingPrice: 'From ₹999', 
        discount: 'Up to 60% Off',
        img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=120&q=80',
        quickChips: ['Low Latency Gaming', 'Dual Mic ENC', 'Wireless Charging']
      },
      { 
        id: 'laptops', 
        name: 'Laptops & MacBooks', 
        icon: '💻', 
        query: 'Laptop', 
        badge: 'INTEL / M3', 
        startingPrice: 'From ₹28,990', 
        discount: 'Flat ₹8,000 Off',
        img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=120&q=80',
        quickChips: ['Intel Core i7/i5', '16GB RAM SSD', 'Gaming RTX GPU', 'Ultra-Slim Student']
      },
      { 
        id: 'soundbars', 
        name: 'Bluetooth Soundbars', 
        icon: '🔊', 
        query: 'Speaker', 
        badge: 'BASS PRO', 
        startingPrice: 'From ₹2,499', 
        discount: 'Min 35% Off',
        img: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=120&q=80',
        quickChips: ['Dolby Atmos', 'Wireless Subwoofer', 'Party RGB Lights']
      },
      { 
        id: 'smart-tvs', 
        name: 'Smart 4K Ultra TVs', 
        icon: '📺', 
        query: 'TV', 
        badge: 'QLED', 
        startingPrice: 'From ₹9,990', 
        discount: 'Min 40% Off',
        img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=120&q=80',
        quickChips: ['43-inch 4K', '55-inch QLED', 'Google TV OS', 'Dolby Vision']
      },
      { 
        id: 'pc-accessories', 
        name: 'PC & Gaming Gear', 
        icon: '⌨️', 
        query: 'Accessories', 
        badge: 'PRO', 
        startingPrice: 'From ₹499', 
        discount: 'Flat 20% Off',
        img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=120&q=80',
        quickChips: ['Mechanical RGB', 'Ergonomic Mouse', '4K Webcam', 'USB-C Hub']
      }
    ],
    popularBrands: [
      { name: 'Sony', desc: 'WH-1000XM5 & Bravia', icon: '🎧', query: 'Sony', offer: 'Studio Audio #1' },
      { name: 'boAt', desc: 'Airdopes & Bassheads', icon: '⛵', query: 'boAt', offer: 'Up to 70% Off' },
      { name: 'JBL', desc: 'Signature Bass Sound', icon: '🔊', query: 'JBL', offer: 'Extra 10% Off' },
      { name: 'Apple', desc: 'MacBook Air & iPad Pro', icon: '💻', query: 'Apple', offer: 'Student Deals' },
      { name: 'Noise', desc: 'ColorFit Smart Wearables', icon: '⚡', query: 'Noise', offer: 'Bestseller' },
      { name: 'HP & Dell', desc: 'Pavilion & XPS Laptops', icon: '🖥️', query: 'Laptop', offer: 'Intel Core i7' }
    ]
  },

  fashion: {
    id: 'fashion',
    name: 'Fashion & Luxury Apparel',
    icon: '👗',
    tagline: 'Direct-from-Designer Couture, Runway Footwear & Royal Chronographs',
    promoTicker: '✨ VIP Wardrobe Sale: Buy 2 Get 1 Free on Top Fashion Brands + Extra 10% Instant Wallet Cashback',
    subCategories: [
      { 
        id: 'mens-shirts', 
        name: "Men's Luxury Shirts", 
        icon: '👕', 
        query: 'Shirt', 
        badge: '100% COTTON', 
        startingPrice: 'From ₹699', 
        discount: 'Min 40% Off',
        img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=120&q=80',
        quickChips: ['Pure Linen', 'Slim Formal', 'Oversized Streetwear', 'Under ₹999']
      },
      { 
        id: 'womens-ethnic', 
        name: "Women's Ethnic & Sarees", 
        icon: '👗', 
        query: 'Dress', 
        badge: 'DESIGNER', 
        startingPrice: 'From ₹899', 
        discount: 'Min 50% Off',
        img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=120&q=80',
        quickChips: ['Kanjivaram Silk', 'Anarkali Kurta', 'Floral Georgette', 'Party Wear']
      },
      { 
        id: 'footwear', 
        name: 'Athletic Shoes & Sneakers', 
        icon: '👟', 
        query: 'Shoes', 
        badge: 'AIR CUSHION', 
        startingPrice: 'From ₹1,299', 
        discount: 'Flat 35% Off',
        img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&q=80',
        quickChips: ['Running Air Cushion', 'Casual White Kicks', 'Memory Foam Sole']
      },
      { 
        id: 'watches', 
        name: 'Chronograph Watches', 
        icon: '⌚', 
        query: 'Watch', 
        badge: 'TITANIUM', 
        startingPrice: 'From ₹1,499', 
        discount: 'Min 30% Off',
        img: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=120&q=80',
        quickChips: ['Titanium Metal Strap', 'Sapphire Glass', 'Water Resistant 50M']
      },
      { 
        id: 'jeans-trousers', 
        name: 'Denim Jeans & Trousers', 
        icon: '👖', 
        query: 'Jeans', 
        badge: 'SLIM FIT', 
        startingPrice: 'From ₹799', 
        discount: 'Min 40% Off',
        img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=120&q=80',
        quickChips: ['Stretch Denim', 'Tapered Fit', 'Cargo Pants']
      },
      { 
        id: 'sunglasses-bags', 
        name: 'Designer Sunglasses & Bags', 
        icon: '🕶️', 
        query: 'Accessories', 
        badge: 'UV400', 
        startingPrice: 'From ₹499', 
        discount: 'Flat 50% Off',
        img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=120&q=80',
        quickChips: ['Polarized UV400', 'Leather Tote Bag', 'Aviator Classic']
      }
    ],
    popularBrands: [
      { name: 'Nike', desc: 'Air Jordan & Pegasus', icon: '👟', query: 'Nike', offer: 'Flat 30% Off' },
      { name: 'Adidas', desc: 'Ultraboost & Originals', icon: '🏃', query: 'Adidas', offer: 'Min 40% Off' },
      { name: 'Puma', desc: 'Nitro Running & Gym', icon: '🐆', query: 'Puma', offer: 'Buy 1 Get 1' },
      { name: 'Levi\'s', desc: '511 Classic Denim', icon: '👖', query: 'Levi', offer: 'Authentic Fit' },
      { name: 'Zara', desc: 'Runway Summer Couture', icon: '✨', query: 'Zara', offer: 'New Season' },
      { name: 'Titan', desc: 'Royal Chronographs', icon: '⌚', query: 'Titan', offer: 'Up to 25% Off' }
    ]
  },

  home: {
    id: 'home',
    name: 'Home & Kitchen Living',
    icon: '🏠',
    tagline: 'Smart Inverter Air Conditioners, Digital Kitchen & Luxury Bedding',
    promoTicker: '🏠 Direct Factory Home Fest: Zero-Cost EMI & Free Doorstep Setup on all Smart Appliances',
    subCategories: [
      { 
        id: 'kitchen-fryers', 
        name: 'Air Fryers & Mixers', 
        icon: '🍳', 
        query: 'Kitchen', 
        badge: 'DIGITAL', 
        startingPrice: 'From ₹1,499', 
        discount: 'Min 35% Off',
        img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=120&q=80',
        quickChips: ['Digital Air Fryer', '750W Mixer Grinder', 'Tri-Ply Cookware']
      },
      { 
        id: 'inverter-acs', 
        name: 'Inverter ACs & Coolers', 
        icon: '❄️', 
        query: 'AC', 
        badge: '5-STAR', 
        startingPrice: 'From ₹24,990', 
        discount: 'Free Install',
        img: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=120&q=80',
        quickChips: ['1.5 Ton 5-Star', 'Convertible 6-in-1', 'Copper Condenser']
      },
      { 
        id: 'vacuums', 
        name: 'Robotic & Hand Vacuums', 
        icon: '🧹', 
        query: 'Vacuum', 
        badge: 'AI MAP', 
        startingPrice: 'From ₹2,999', 
        discount: 'Flat ₹3,000 Off',
        img: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=120&q=80',
        quickChips: ['LiDAR Smart Map', 'Wet & Dry Mopping', 'Cordless Stick']
      },
      { 
        id: 'bedding', 
        name: 'Bedding & Luxury Linen', 
        icon: '🛏️', 
        query: 'Bedding', 
        badge: '400 TC', 
        startingPrice: 'From ₹599', 
        discount: 'Buy 1 Get 1',
        img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=120&q=80',
        quickChips: ['100% Egyptian Cotton', 'King Size Bedsheet', 'Microfiber Pillows']
      },
      { 
        id: 'smart-lighting', 
        name: 'Smart LED Lighting', 
        icon: '💡', 
        query: 'Lighting', 
        badge: 'RGB', 
        startingPrice: 'From ₹299', 
        discount: 'Min 40% Off',
        img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=120&q=80',
        quickChips: ['16M Colors RGB', 'WiFi Alexa App', 'Motion Sensor']
      },
      { 
        id: 'water-purifiers', 
        name: 'RO+UV Water Purifiers', 
        icon: '🚰', 
        query: 'Purifier', 
        badge: 'RO+UV', 
        startingPrice: 'From ₹6,999', 
        discount: 'Free Filter Kit',
        img: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=120&q=80',
        quickChips: ['Copper + Mineral', 'Stainless Steel Tank', 'TDS Controller']
      }
    ],
    popularBrands: [
      { name: 'Philips', desc: 'Smart Air & Grooming', icon: '💡', query: 'Philips', offer: 'Top Rated' },
      { name: 'Dyson', desc: 'Airwrap & V15 Vacuums', icon: '🌀', query: 'Dyson', offer: 'Direct Tech' },
      { name: 'Havells', desc: 'Inverter Fans & Wires', icon: '⚡', query: 'Havells', offer: 'Energy Saver' },
      { name: 'Prestige', desc: 'Tri-Ply Cookware & Gas', icon: '🍳', query: 'Prestige', offer: 'Min 35% Off' },
      { name: 'Voltas', desc: 'All-Weather Inverters', icon: '❄️', query: 'Voltas', offer: 'Free Delivery' },
      { name: 'LG', desc: 'Direct Drive Smart Care', icon: '🫧', query: 'LG', offer: '10 Yr Warranty' }
    ]
  },

  beauty: {
    id: 'beauty',
    name: 'Beauty & Personal Care',
    icon: '💄',
    tagline: 'Dermatologist-Approved Skincare, Luxury Fragrances & Organic Ayurveda',
    promoTicker: '💄 Glamour Weekend: Flat 25% Off on Maybelline & L\'Oreal + Free Luxury Beauty Pouch on ₹999+',
    subCategories: [
      { 
        id: 'skincare', 
        name: 'Serums & Glow Care', 
        icon: '🧴', 
        query: 'Skin', 
        badge: 'VITAMIN C', 
        startingPrice: 'From ₹349', 
        discount: 'Min 25% Off',
        img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=120&q=80',
        quickChips: ['10% Niacinamide', 'SPF 50 Sunscreen', 'Hyaluronic Acid']
      },
      { 
        id: 'fragrances', 
        name: 'Luxury Fragrances & Deos', 
        icon: '🌸', 
        query: 'Perfume', 
        badge: 'EAU DE PARFUM', 
        startingPrice: 'From ₹499', 
        discount: 'Min 30% Off',
        img: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=120&q=80',
        quickChips: ['Long-Lasting EDP', 'French Oud', 'Pocket Deodorants']
      },
      { 
        id: 'haircare', 
        name: 'Shampoos & Hair Spa', 
        icon: '💇', 
        query: 'Hair', 
        badge: 'KERATIN', 
        startingPrice: 'From ₹299', 
        discount: 'Buy 2 Get 1',
        img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=120&q=80',
        quickChips: ['Sulphate Free', 'Anti-Hairfall Red Onion', 'Keratin Smooth']
      },
      { 
        id: 'makeup', 
        name: 'Matte Makeup & Lipsticks', 
        icon: '💄', 
        query: 'Makeup', 
        badge: 'LONG-STAY', 
        startingPrice: 'From ₹199', 
        discount: 'Flat 20% Off',
        img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=120&q=80',
        quickChips: ['Liquid Matte 16H', 'Waterproof Mascara', 'Compact Powder']
      },
      { 
        id: 'grooming', 
        name: "Men's Beard & Trimmers", 
        icon: '🪒', 
        query: 'Grooming', 
        badge: 'CORDLESS', 
        startingPrice: 'From ₹699', 
        discount: 'Min 40% Off',
        img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=120&q=80',
        quickChips: ['Titanium Blade', '90Min Cordless', 'Beard Growth Oil']
      },
      { 
        id: 'ayurveda', 
        name: 'Pure Organic Ayurveda', 
        icon: '🌿', 
        query: 'Ayurveda', 
        badge: 'ORGANIC', 
        startingPrice: 'From ₹249', 
        discount: '100% Pure',
        img: 'https://images.unsplash.com/photo-1608248597359-2169b2d28f43?w=120&q=80',
        quickChips: ['Kumkumadi Oil', 'Aloe Vera Gel', 'Cold Pressed Castor']
      }
    ],
    popularBrands: [
      { name: 'L\'Oréal Paris', desc: 'Revitalift & Infallible', icon: '💄', query: 'L\'Oreal', offer: 'Salon Choice' },
      { name: 'Maybelline', desc: 'SuperStay & Fit Me', icon: '💋', query: 'Maybelline', offer: 'Flat 20% Off' },
      { name: 'Nivea', desc: 'Deep Moisture Body Milk', icon: '🧴', query: 'Nivea', offer: 'Daily Fresh' },
      { name: 'Plum', desc: '100% Vegan & Green Tea', icon: '🌱', query: 'Plum', offer: 'Clean Beauty' },
      { name: 'The Derma Co', desc: 'Niacinamide & Salicylic', icon: '🧪', query: 'Derma', offer: 'Dermat Tested' },
      { name: 'Bombay Shaving', desc: 'Precision Beard Trimmers', icon: '🪒', query: 'Shaving', offer: 'Super Kit' }
    ]
  },

  sports: {
    id: 'sports',
    name: 'Sports, Fitness & Outdoor',
    icon: '🏋️',
    tagline: 'Professional Gym Equipment, English Willow Bats & Isolate Nutrition',
    promoTicker: '🏋️ Pro Fitness Pass: Extra 15% Off on Gym Dumbbells & Certified Whey Protein | Guaranteed Authenticity',
    subCategories: [
      { 
        id: 'gym-equipment', 
        name: 'Gym & Dumbbells Gear', 
        icon: '🏋️', 
        query: 'Gym', 
        badge: 'CAST IRON', 
        startingPrice: 'From ₹799', 
        discount: 'Min 30% Off',
        img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&q=80',
        quickChips: ['Hex Dumbbells Set', 'Adjustable Bench', 'Resistance Bands']
      },
      { 
        id: 'cricket-gear', 
        name: 'Cricket Bats & Full Kits', 
        icon: '🏏', 
        query: 'Cricket', 
        badge: 'WILLOW', 
        startingPrice: 'From ₹999', 
        discount: 'Min 25% Off',
        img: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=120&q=80',
        quickChips: ['Kashmir Willow', 'English Willow Grade 1', 'Leather Match Ball']
      },
      { 
        id: 'activewear', 
        name: 'Gym Activewear & Tights', 
        icon: '🎽', 
        query: 'Activewear', 
        badge: 'DRY FIT', 
        startingPrice: 'From ₹499', 
        discount: 'Min 40% Off',
        img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=120&q=80',
        quickChips: ['Compression Tights', 'Breathable Sleeveless', 'Anti-Odor Shorts']
      },
      { 
        id: 'gear-cycles', 
        name: '21-Speed Gear Cycles', 
        icon: '🚴', 
        query: 'Cycle', 
        badge: 'SHIMANO', 
        startingPrice: 'From ₹6,999', 
        discount: 'Free Helmet',
        img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=120&q=80',
        quickChips: ['Dual Disc Brakes', 'Shimano 21-Speed', 'Alloy MTB Frame']
      },
      { 
        id: 'nutrition', 
        name: 'Whey Protein & Creatine', 
        icon: '🥤', 
        query: 'Nutrition', 
        badge: 'ISOLATE', 
        startingPrice: 'From ₹1,499', 
        discount: '100% Lab Tested',
        img: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=120&q=80',
        quickChips: ['100% Whey Isolate', 'Micronized Creatine', 'BCAA Recovery']
      },
      { 
        id: 'yoga-mats', 
        name: 'Yoga & Recovery Mats', 
        icon: '🧘', 
        query: 'Yoga', 
        badge: 'NON-SLIP', 
        startingPrice: 'From ₹399', 
        discount: 'Flat 50% Off',
        img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=120&q=80',
        quickChips: ['6mm High Density', 'Non-Slip Eco TPE', 'Carrying Strap Included']
      }
    ],
    popularBrands: [
      { name: 'Decathlon', desc: 'Kipsta & Domyos Pro', icon: '🏅', query: 'Decathlon', offer: 'Direct Price' },
      { name: 'SS Cricket', desc: 'English Willow Heritage', icon: '🏏', query: 'SS', offer: 'Pro Approved' },
      { name: 'Optimum Nutrition', desc: 'Gold Standard 100% Whey', icon: '🥛', query: 'ON', offer: '100% Authentic' },
      { name: 'Cultsport', desc: 'Smart Connected Cardio', icon: '👟', query: 'Cultsport', offer: 'Live Coach' },
      { name: 'Nivia', desc: 'FIFA Match Quality Balls', icon: '⚽', query: 'Nivia', offer: 'Tournament Grade' },
      { name: 'Vector X', desc: 'Gloves, Mats & Jump Ropes', icon: '🥊', query: 'Vector', offer: 'Budget Pro' }
    ]
  }
};

// Fallback general brands for "all" categories
export const ALL_POPULAR_BRANDS = [
  { name: 'Apple', desc: 'iPhone & Mac', icon: '🍏', query: 'Apple', offer: 'Official Auth' },
  { name: 'Samsung', desc: 'Galaxy AI & 5G', icon: '🌌', query: 'Samsung', offer: 'No Cost EMI' },
  { name: 'Sony', desc: 'Studio Audio & TVs', icon: '🎧', query: 'Sony', offer: 'Spatial Sound' },
  { name: 'Nike', desc: 'Athletic & Air', icon: '👟', query: 'Nike', offer: 'Flat 30% Off' },
  { name: 'boAt', desc: 'Airdopes & Soundbars', icon: '⛵', query: 'boAt', offer: 'Up to 70% Off' },
  { name: 'Philips', desc: 'Smart Home & Care', icon: '💡', query: 'Philips', offer: 'Top Rated' }
];

export const getCategoryData = (catId) => {
  if (!catId) return CATEGORY_DETAILS.all;
  const key = catId.toLowerCase().trim();
  return CATEGORY_DETAILS[key] || CATEGORY_DETAILS.all;
};

// 🌟 Polished Category Groups Taxonomy (Matching Blinkit/Zepto UI Standard)
export const ALL_CATEGORY_SECTIONS = [
  {
    title: 'Grocery & Kitchen',
    slug: 'grocery',
    items: [
      {
        id: 'fruits-veg',
        name: 'Fruits &\nVegetables',
        category: 'grocery',
        query: 'Fruits',
        img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80',
      },
      {
        id: 'dairy-bread-eggs',
        name: 'Dairy, Bread\n& Eggs',
        category: 'grocery',
        query: 'Dairy',
        img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80',
      },
      {
        id: 'atta-rice-dals',
        name: 'Atta, Rice,\nOil & Dals',
        category: 'grocery',
        query: 'Rice',
        img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&q=80',
      },
      {
        id: 'meat-fish-eggs',
        name: 'Meat, Fish\n& Eggs',
        category: 'grocery',
        query: 'Meat',
        img: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&q=80',
      },
      {
        id: 'masala-dry-fruits',
        name: 'Masala &\nDry Fruits',
        category: 'grocery',
        query: 'Masala',
        img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=80',
      },
      {
        id: 'breakfast-sauces',
        name: 'Breakfast &\nSauces',
        category: 'grocery',
        query: 'Breakfast',
        img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=80',
      },
      {
        id: 'packaged-food',
        name: 'Packaged\nFood',
        category: 'grocery',
        query: 'Noodles',
        img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&q=80',
      },
      {
        id: 'organic-staples',
        name: 'Organic &\nSuperfoods',
        category: 'grocery',
        query: 'Organic',
        img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80',
      },
    ]
  },
  {
    title: 'Snacks & Drinks',
    slug: 'snacks',
    items: [
      {
        id: 'tea-coffee-more',
        name: 'Tea, Coffee\n& More',
        category: 'grocery',
        query: 'Tea',
        img: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200&q=80',
      },
      {
        id: 'ice-creams-more',
        name: 'Ice Creams\n& More',
        category: 'grocery',
        query: 'Ice Cream',
        img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&q=80',
      },
      {
        id: 'frozen-food',
        name: 'Frozen\nFood',
        category: 'grocery',
        query: 'Frozen',
        img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80',
      },
      {
        id: 'sweet-cravings',
        name: 'Sweet\nCravings',
        category: 'grocery',
        query: 'Chocolate',
        img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200&q=80',
      },
      {
        id: 'cold-drinks-juices',
        name: 'Cold Drinks\n& Juices',
        category: 'grocery',
        query: 'Juice',
        img: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=200&q=80',
      },
      {
        id: 'munchies-chips',
        name: 'Munchies\n& Chips',
        category: 'grocery',
        query: 'Chips',
        img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&q=80',
      },
      {
        id: 'biscuits-cookies',
        name: 'Biscuits\n& Cookies',
        category: 'grocery',
        query: 'Cookies',
        img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&q=80',
      },
      {
        id: 'energy-sports-drinks',
        name: 'Energy &\nHealth Drinks',
        category: 'grocery',
        query: 'Energy Drink',
        img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200&q=80',
      },
    ]
  },
  {
    title: 'Electronics & Gadgets',
    slug: 'electronics',
    items: [
      {
        id: '5g-smartphones',
        name: 'Smartphones\n& 5G',
        category: 'mobiles',
        query: 'Smartphone',
        img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80',
      },
      {
        id: 'earbuds-audio',
        name: 'Earbuds &\nHeadphones',
        category: 'electronics',
        query: 'Earbuds',
        img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80',
      },
      {
        id: 'smartwatches-bands',
        name: 'Smartwatches\n& Bands',
        category: 'electronics',
        query: 'Smartwatch',
        img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80',
      },
      {
        id: 'laptops-macbooks',
        name: 'Laptops &\nMacBooks',
        category: 'electronics',
        query: 'Laptop',
        img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&q=80',
      },
      {
        id: 'smart-tvs-speakers',
        name: 'Smart TVs\n& Soundbars',
        category: 'electronics',
        query: 'TV',
        img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=200&q=80',
      },
      {
        id: 'powerbanks-cables',
        name: 'Chargers &\nPowerbanks',
        category: 'electronics',
        query: 'Powerbank',
        img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&q=80',
      },
      {
        id: 'gaming-consoles',
        name: 'Gaming &\nAccessories',
        category: 'electronics',
        query: 'Gaming',
        img: 'https://images.unsplash.com/photo-1600861194942-f88481e1d071?w=200&q=80',
      },
      {
        id: 'cameras-drones',
        name: 'Cameras &\nPhotography',
        category: 'electronics',
        query: 'Camera',
        img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&q=80',
      },
    ]
  },
  {
    title: 'Fashion & Lifestyle',
    slug: 'fashion',
    items: [
      {
        id: 'mens-tshirts',
        name: "Men's Shirts\n& T-Shirts",
        category: 'fashion',
        query: 'Shirt',
        img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&q=80',
      },
      {
        id: 'womens-ethnic',
        name: "Women's Ethnic\n& Sarees",
        category: 'fashion',
        query: 'Dress',
        img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&q=80',
      },
      {
        id: 'running-shoes',
        name: 'Athletic Shoes\n& Sneakers',
        category: 'fashion',
        query: 'Shoes',
        img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80',
      },
      {
        id: 'luxury-watches',
        name: 'Watches &\nChronographs',
        category: 'fashion',
        query: 'Watch',
        img: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=200&q=80',
      },
      {
        id: 'sunglasses-eyewear',
        name: 'Sunglasses\n& Frames',
        category: 'fashion',
        query: 'Sunglasses',
        img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=200&q=80',
      },
      {
        id: 'backpacks-luggage',
        name: 'Bags &\nLuggage',
        category: 'fashion',
        query: 'Bag',
        img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&q=80',
      },
      {
        id: 'jeans-trousers',
        name: 'Jeans &\nTrousers',
        category: 'fashion',
        query: 'Jeans',
        img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&q=80',
      },
      {
        id: 'jewellery-accessories',
        name: 'Jewellery &\nAccessories',
        category: 'fashion',
        query: 'Jewellery',
        img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&q=80',
      },
    ]
  },
  {
    title: 'Home & Living',
    slug: 'home',
    items: [
      {
        id: 'kitchen-appliances',
        name: 'Kitchen &\nAir Fryers',
        category: 'home',
        query: 'Kitchen',
        img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&q=80',
      },
      {
        id: 'bedsheets-curtains',
        name: 'Bedsheets &\nCurtains',
        category: 'home',
        query: 'Bedsheet',
        img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&q=80',
      },
      {
        id: 'home-decor-lamps',
        name: 'Home Decor\n& Lighting',
        category: 'home',
        query: 'Lamp',
        img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&q=80',
      },
      {
        id: 'cookware-dining',
        name: 'Cookware &\nDinner Sets',
        category: 'home',
        query: 'Cookware',
        img: 'https://images.unsplash.com/photo-1584990347449-399318b76319?w=200&q=80',
      },
      {
        id: 'cleaning-storage',
        name: 'Cleaning &\nOrganizers',
        category: 'home',
        query: 'Vacuum',
        img: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&q=80',
      },
      {
        id: 'water-air-purifiers',
        name: 'Air & Water\nPurifiers',
        category: 'home',
        query: 'Purifier',
        img: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=200&q=80',
      },
    ]
  },
  {
    title: 'Beauty & Personal Care',
    slug: 'beauty',
    items: [
      {
        id: 'skincare-serums',
        name: 'Skincare &\nFace Serums',
        category: 'beauty',
        query: 'Skincare',
        img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&q=80',
      },
      {
        id: 'haircare-shampoos',
        name: 'Hair Care &\nOils',
        category: 'beauty',
        query: 'Hair',
        img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200&q=80',
      },
      {
        id: 'fragrances-deodorants',
        name: 'Perfumes &\nDeodorants',
        category: 'beauty',
        query: 'Perfume',
        img: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=200&q=80',
      },
      {
        id: 'mens-grooming',
        name: "Men's Shaving\n& Trimmers",
        category: 'beauty',
        query: 'Trimmer',
        img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=200&q=80',
      },
      {
        id: 'makeup-cosmetics',
        name: 'Makeup &\nLipsticks',
        category: 'beauty',
        query: 'Makeup',
        img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&q=80',
      },
      {
        id: 'oral-hygiene',
        name: 'Bath & Oral\nCare',
        category: 'beauty',
        query: 'Soap',
        img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=80',
      },
    ]
  },
  {
    title: 'Sports & Fitness',
    slug: 'sports',
    items: [
      {
        id: 'gym-dumbbells',
        name: 'Gym Weights\n& Dumbbells',
        category: 'sports',
        query: 'Dumbbell',
        img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&q=80',
      },
      {
        id: 'whey-creatine',
        name: 'Whey Protein\n& Nutrition',
        category: 'sports',
        query: 'Protein',
        img: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=200&q=80',
      },
      {
        id: 'sports-cricket',
        name: 'Cricket &\nOutdoor Kits',
        category: 'sports',
        query: 'Cricket',
        img: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&q=80',
      },
      {
        id: 'gym-activewear',
        name: 'Dry-Fit &\nActivewear',
        category: 'sports',
        query: 'Activewear',
        img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&q=80',
      },
      {
        id: 'gear-bicycles',
        name: 'Cycles &\nRiding Gear',
        category: 'sports',
        query: 'Cycle',
        img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=200&q=80',
      },
      {
        id: 'yoga-recovery',
        name: 'Yoga Mats &\nFoam Rollers',
        category: 'sports',
        query: 'Yoga',
        img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&q=80',
      },
    ]
  }
];

