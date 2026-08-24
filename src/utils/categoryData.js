// Comprehensive Category Taxonomy with Sub-Categories and Category-Specific Popular Brands

export const CATEGORY_DETAILS = {
  mobiles: {
    id: 'mobiles',
    name: 'Mobiles & Smartphones',
    icon: '📱',
    tagline: 'Direct Brand Authorization with Official 1-Year Pan-India Warranty',
    subCategories: [
      { id: '5g-mobiles', name: '5G Flagships', icon: '📱', query: '5G', badge: 'HOT' },
      { id: 'budget-smartphones', name: 'Budget Phones', icon: '🏷️', query: 'Smartphone', badge: 'UNDER ₹15K' },
      { id: 'gaming-phones', name: 'Gaming Phones', icon: '🎮', query: 'Gaming Phone', badge: 'HIGH FPS' },
      { id: 'smartwatches', name: 'Smartwatches & Bands', icon: '⌚', query: 'Smartwatch', badge: 'AMOLED' },
      { id: 'fast-chargers', name: 'Fast Chargers & Cables', icon: '🔌', query: 'Charger', badge: '65W-120W' },
      { id: 'cases-covers', name: 'Cases & Screen Glass', icon: '🛡️', query: 'Case', badge: 'PROTECT' }
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
    subCategories: [
      { id: 'headphones', name: 'Wireless Headphones', icon: '🎧', query: 'Headphones', badge: 'ANC' },
      { id: 'earbuds', name: 'TWS Spatial Earbuds', icon: '🎵', query: 'Earbuds', badge: 'DOLBY' },
      { id: 'laptops', name: 'Laptops & MacBooks', icon: '💻', query: 'Laptop', badge: 'INTEL / M3' },
      { id: 'soundbars', name: 'Bluetooth Soundbars', icon: '🔊', query: 'Speaker', badge: 'BASS PRO' },
      { id: 'smart-tvs', name: 'Smart 4K Ultra TVs', icon: '📺', query: 'TV', badge: 'QLED' },
      { id: 'pc-accessories', name: 'PC & Gaming Accessories', icon: '⌨️', query: 'Accessories', badge: 'PRO' }
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
    subCategories: [
      { id: 'mens-shirts', name: "Men's Luxury Shirts & Tees", icon: '👕', query: 'Shirt', badge: '100% COTTON' },
      { id: 'womens-ethnic', name: "Women's Ethnic & Sarees", icon: '👗', query: 'Dress', badge: 'DESIGNER' },
      { id: 'footwear', name: 'Athletic Shoes & Sneakers', icon: '👟', query: 'Shoes', badge: 'AIR CUSHION' },
      { id: 'watches', name: 'Chronograph Watches', icon: '⌚', query: 'Watch', badge: 'TITANIUM' },
      { id: 'jeans-trousers', name: 'Denim Jeans & Trousers', icon: '👖', query: 'Jeans', badge: 'SLIM FIT' },
      { id: 'sunglasses-bags', name: 'Designer Sunglasses & Bags', icon: '🕶️', query: 'Accessories', badge: 'UV400' }
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
    subCategories: [
      { id: 'kitchen-fryers', name: 'Kitchen Air Fryers & Mixers', icon: '🍳', query: 'Kitchen', badge: 'DIGITAL' },
      { id: 'inverter-acs', name: 'Smart Inverter ACs & Coolers', icon: '❄️', query: 'AC', badge: '5-STAR' },
      { id: 'vacuums', name: 'Robotic & Hand Vacuums', icon: '🧹', query: 'Vacuum', badge: 'AI MAP' },
      { id: 'bedding', name: 'Bedding & Luxury Linen', icon: '🛏️', query: 'Bedding', badge: '400 TC' },
      { id: 'smart-lighting', name: 'Smart LED Lighting', icon: '💡', query: 'Lighting', badge: 'RGB' },
      { id: 'water-purifiers', name: 'Water Purifiers & Dispensers', icon: '🚰', query: 'Purifier', badge: 'RO+UV' }
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
    subCategories: [
      { id: 'skincare', name: 'Serums & Glow Care', icon: '🧴', query: 'Skin', badge: 'VITAMIN C' },
      { id: 'fragrances', name: 'Luxury Fragrances & Deos', icon: '🌸', query: 'Perfume', badge: 'EAU DE PARFUM' },
      { id: 'haircare', name: 'Shampoos & Hair Spa', icon: '💇', query: 'Hair', badge: 'KERATIN' },
      { id: 'makeup', name: 'Long-Stay Matte Makeup', icon: '💄', query: 'Makeup', badge: 'LONG-STAY' },
      { id: 'grooming', name: "Men's Beard & Trimmers", icon: '🪒', query: 'Grooming', badge: 'CORDLESS' },
      { id: 'ayurveda', name: 'Pure Organic Ayurveda', icon: '🌿', query: 'Ayurveda', badge: 'ORGANIC' }
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
    subCategories: [
      { id: 'gym-equipment', name: 'Gym & Dumbbells Gear', icon: '🏋️', query: 'Gym', badge: 'CAST IRON' },
      { id: 'cricket-gear', name: 'Cricket Bats & Full Kits', icon: '🏏', query: 'Cricket', badge: 'WILLOW' },
      { id: 'activewear', name: 'Gym Activewear & Tights', icon: '🎽', query: 'Activewear', badge: 'DRY FIT' },
      { id: 'gear-cycles', name: '21-Speed Gear Cycles', icon: '🚴', query: 'Cycle', badge: 'SHIMANO' },
      { id: 'nutrition', name: 'Whey Protein & Creatine', icon: '🥤', query: 'Nutrition', badge: 'ISOLATE' },
      { id: 'yoga-mats', name: 'Yoga & Recovery Mats', icon: '🧘', query: 'Yoga', badge: 'NON-SLIP' }
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
  if (!catId || catId === 'all') return null;
  const key = catId.toLowerCase().trim();
  return CATEGORY_DETAILS[key] || null;
};
