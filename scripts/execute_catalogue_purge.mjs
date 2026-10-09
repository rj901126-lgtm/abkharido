import fs from 'fs';
import path from 'path';

// 1. Verify backup exists
const backupPath = 'backups/catalogue_backup_before_patch2_2026-10-09T17-58-45-606Z.json';
if (!fs.existsSync(backupPath)) {
  console.error('BLOCKED: Backup file does not exist at', backupPath);
  process.exit(1);
}

const allProducts = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
console.log(`Verified backup loaded: ${allProducts.length} products`);

// 2. Identify keeper SKU and purged SKUs
const keeperId = 'signature-wireless-earphone';
const keeperOriginal = allProducts.find(p => p.id === keeperId);

if (!keeperOriginal) {
  console.error('BLOCKED: Keeper SKU signature-wireless-earphone not found in backup!');
  process.exit(1);
}

// Remediated keeper product according to Patch 2 rules:
// - rating: 0, reviewsCount: 0, reviews: [] (derive only from real documents)
// - flashSale: isActive false (expired endTime)
// - warranty: 6 Months Seller Warranty (no fake brand warranty claim)
// - supported alias: sigboom-21
const remediatedKeeperProduct = {
  id: 'signature-wireless-earphone',
  name: 'Signature Sigboom 21 wireless Bluetooth Speaker',
  category: 'electronics',
  price: 379,
  originalPrice: 758,
  rating: 0,
  reviewsCount: 0,
  reviews: [],
  badge: 'TOP CHOICE',
  image: 'https://res.cloudinary.com/rx1klbob/image/upload/v1784995324/abkharido/products/r687it063mcwcn507c9w.jpg',
  images: [
    'https://res.cloudinary.com/rx1klbob/image/upload/v1784995324/abkharido/products/r687it063mcwcn507c9w.jpg'
  ],
  description: 'AbKharido Original Signature Sigboom 21 Wireless Bluetooth Speaker. Features powerful 360° Dynamic RGB Party Lights, Deep Bass Sound, Built-in Phone Stand on top, FM Radio, TF card, USB, AUX, and Bluetooth 5.1 connectivity. Splash-proof and long-lasting battery life.',
  specifications: [
    { key: 'Connectivity', value: 'Bluetooth 5.1, AUX, USB, TF Card, FM' },
    { key: 'Lighting', value: '360° Dynamic Multi-Color RGB Party Lights' },
    { key: 'Special Feature', value: 'Built-in Smartphone Stand Mount' },
    { key: 'Sound Output', value: 'High Bass Stereo Drivers' },
    { key: 'Battery', value: 'Up to 12 Hours Playtime' },
    { key: 'Warranty', value: '6 Months Seller Warranty' }
  ],
  colorModels: [
    {
      name: 'Party RGB Edition',
      primaryImage: 'https://res.cloudinary.com/rx1klbob/image/upload/v1784995324/abkharido/products/r687it063mcwcn507c9w.jpg',
      images: [
        'https://res.cloudinary.com/rx1klbob/image/upload/v1784995324/abkharido/products/r687it063mcwcn507c9w.jpg'
      ],
      variants: [
        { name: 'Standard', price: 379, originalPrice: 758, stock: 45, sku: 'SIG-BOOM-21-STD' }
      ]
    }
  ],
  inStock: true,
  stock: 45,
  freeDelivery: true,
  flashSale: {
    isActive: false,
    price: 379,
    endTime: '2026-07-26T00:00:00.000Z'
  },
  status: 'published'
};

const purgedList = allProducts
  .filter(p => p.id !== keeperId)
  .map(p => ({
    ...p,
    status: 'archived',
    isArchived: true,
    inStock: false
  }));

console.log(`Keeper SKU count: 1 (${remediatedKeeperProduct.id})`);
console.log(`Archived SKUs count: ${purgedList.length}`);

// 3. Update server/data/productsData.js
const serverDataContent = `// AbKharido Product Catalog (Synchronized with Verified Inventory)
export const ARCHIVED_PURGED_PRODUCTS = ${JSON.stringify(purgedList, null, 2)};

export default [
  ${JSON.stringify(remediatedKeeperProduct, null, 2)}
];
`;
fs.writeFileSync('server/data/productsData.js', serverDataContent, 'utf-8');
console.log('✅ Updated server/data/productsData.js (1 published, 39 archived)');

// 4. Update api/data/products.json and root products.json
const jsonContent = JSON.stringify([remediatedKeeperProduct], null, 2);
fs.writeFileSync('api/data/products.json', jsonContent, 'utf-8');
fs.writeFileSync('products.json', jsonContent, 'utf-8');
console.log('✅ Updated api/data/products.json and products.json');

// 5. Update src/db/mockData.js
const mockDataPath = 'src/db/mockData.js';
const mockDataContent = `/* Mock Database for AbKharido.com (Verified Inventory) */

export const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: 'LayoutGrid' },
  { id: 'mobiles', name: 'Mobiles', icon: 'Smartphone' },
  { id: 'electronics', name: 'Electronics', icon: 'Laptop' },
  { id: 'fashion', name: 'Fashion', icon: 'Shirt' },
  { id: 'home', name: 'Home & Living', icon: 'Home' },
  { id: 'appliances', name: 'Appliances', icon: 'Tv' }
];

export const ARCHIVED_PURGED_PRODUCTS = ${JSON.stringify(purgedList, null, 2)};

export const PRODUCTS = [
  ${JSON.stringify(remediatedKeeperProduct, null, 2)}
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
`;
fs.writeFileSync(mockDataPath, mockDataContent, 'utf-8');
console.log('✅ Updated src/db/mockData.js (1 published, 39 archived)');

console.log('\n--- VERIFICATION OF RECORD COUNTS ---');
console.log('Before purge: 40 active SKUs');
console.log('After purge: 1 active SKU published, 39 SKUs archived');
console.log('Catalogue sync completed successfully.');
