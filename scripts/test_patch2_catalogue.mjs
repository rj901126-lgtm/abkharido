import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load models
import Product from '../server/models/Product.js';

// Load static data
import { PRODUCTS, ARCHIVED_PURGED_PRODUCTS } from '../src/db/mockData.js';

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
    results.push({ name: testName, status: 'PASS', details });
  } else {
    failed++;
    console.error(`❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
    results.push({ name: testName, status: 'FAIL', details });
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('📦 ABKHARIDO PATCH 2: CATALOGUE PURGE & TRUST REGRESSION SUITE');
  console.log('================================================================\n');

  // Start in-memory MongoDB
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  try {
    // -------------------------------------------------------------------------
    // 2.1: CATALOGUE BACKUP VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2.1: Backup Verification ---');
    const backupDir = path.resolve('./backups');
    const backupFiles = fs.readdirSync(backupDir).filter(f => f.startsWith('catalogue_backup_before_patch2_') && f.endsWith('.json'));
    assert(backupFiles.length > 0, '2.1.1: Backup file exists in backups/ directory');

    const backupData = JSON.parse(fs.readFileSync(path.join(backupDir, backupFiles[0]), 'utf-8'));
    assert(Array.isArray(backupData) && backupData.length === 40, '2.1.2: Backup file contains exactly 40 products', `found ${backupData?.length}`);

    // Verify all 40 products have required fields preserved in backup
    const hasRequiredFields = backupData.every(p => p.id && p.name && p.price !== undefined);
    assert(hasRequiredFields, '2.1.3: All backup records preserve id, name, and price fields');

    // -------------------------------------------------------------------------
    // 2.2: STATIC DATA STORE SYNCHRONIZATION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2.2: Static Products & Mock Data Sync ---');
    const productsJson = JSON.parse(fs.readFileSync(path.resolve('./products.json'), 'utf-8'));
    assert(productsJson.length === 1, '2.2.1: products.json contains exactly 1 active keeper product');
    assert(productsJson[0].id === 'signature-wireless-earphone', '2.2.2: products.json keeper product is signature-wireless-earphone');
    assert(productsJson[0].reviewsCount === 0 && productsJson[0].rating === 0, '2.2.3: keeper product reviewsCount is 0 and rating is 0');
    assert(productsJson[0].flashSale?.isActive === false, '2.2.4: keeper product flashSale.isActive is false');

    assert(PRODUCTS.length === 1, '2.2.5: src/db/mockData.js active PRODUCTS array contains exactly 1 product');
    assert(PRODUCTS[0].id === 'signature-wireless-earphone', '2.2.6: Active product in mockData is signature-wireless-earphone');
    assert(ARCHIVED_PURGED_PRODUCTS.length === 39, '2.2.7: src/db/mockData.js ARCHIVED_PURGED_PRODUCTS contains 39 archived products', `found ${ARCHIVED_PURGED_PRODUCTS.length}`);

    const serverProductsDataContent = fs.readFileSync(path.resolve('./server/data/productsData.js'), 'utf-8');
    assert(serverProductsDataContent.includes('signature-wireless-earphone'), '2.2.8: server/data/productsData.js contains keeper product');
    assert(serverProductsDataContent.includes('ARCHIVED_PURGED_PRODUCTS'), '2.2.9: server/data/productsData.js retains archived products for data integrity');

    // -------------------------------------------------------------------------
    // 2.3: API ROUTE /api/products IMPLEMENTATION & FILTER VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2.3: GET /api/products Route Filter Implementation ---');
    const productsRouteContent = fs.readFileSync(path.resolve('./src/app/api/products/route.js'), 'utf-8');
    
    assert(productsRouteContent.includes("status: { $ne: 'archived' }"), 
      '2.3.1: src/app/api/products/route.js filters out status: archived from DB queries');
    assert(productsRouteContent.includes("isArchived: { $ne: true }"), 
      '2.3.2: src/app/api/products/route.js filters out isArchived: true from DB queries');
    assert(productsRouteContent.includes("p.status !== 'archived'") && productsRouteContent.includes("!p.isArchived"), 
      '2.3.3: src/app/api/products/route.js filters out archived products from mock fallback');

    // -------------------------------------------------------------------------
    // 2.4: API ROUTE /api/products/[id] 404 & NOINDEX IMPLEMENTATION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2.4: GET /api/products/[id] 404 and X-Robots-Tag Implementation ---');
    const productDetailRouteContent = fs.readFileSync(path.resolve('./src/app/api/products/[id]/route.js'), 'utf-8');

    assert(productDetailRouteContent.includes("'X-Robots-Tag': 'noindex, nofollow'"),
      '2.4.1: src/app/api/products/[id]/route.js returns X-Robots-Tag: noindex, nofollow header on 404');
    assert(productDetailRouteContent.includes("status: 404"),
      '2.4.2: src/app/api/products/[id]/route.js returns status 404 for archived/missing items');
    assert(productDetailRouteContent.includes("sigboom-21"),
      '2.4.3: src/app/api/products/[id]/route.js resolves alias sigboom-21 to signature-wireless-earphone');
    assert(productDetailRouteContent.includes("product.status === 'archived' || product.isArchived"),
      '2.4.4: src/app/api/products/[id]/route.js explicitly checks for archived status in DB results');

    // Check frontend product page
    const productPageContent = fs.readFileSync(path.resolve('./src/app/product/[id]/page.jsx'), 'utf-8');
    assert(productPageContent.includes("notFound()"),
      '2.4.5: src/app/product/[id]/page.jsx triggers Next.js notFound() for archived products');
    assert(productPageContent.includes("index: false") && productPageContent.includes("follow: false"),
      '2.4.6: src/app/product/[id]/page.jsx sets robots { index: false, follow: false } metadata for archived products');

    // -------------------------------------------------------------------------
    // 2.5: MONGOOSE DB ARCHIVE QUERY & DATA ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2.5: Database Query Isolation ---');
    const keeperDoc = await Product.create({
      id: 'signature-wireless-earphone',
      name: 'Signature Wireless Earphone',
      price: 1499,
      originalPrice: 2999,
      description: 'RGB Bluetooth speaker / earphone',
      image: '/images/products/speaker.jpg',
      category: 'electronics',
      status: 'active',
      isArchived: false,
      reviewsCount: 0,
      stock: 50
    });
    
    // Seed unapproved brands into DB with archived status
    const archivedDoc = await Product.create({
      id: 'iphone-15-pro',
      name: 'iPhone 15 Pro',
      price: 134900,
      originalPrice: 144900,
      description: 'Apple iPhone 15 Pro 128GB',
      image: '/images/products/iphone.jpg',
      category: 'mobiles',
      status: 'archived',
      isArchived: true,
      reviewsCount: 0,
      stock: 0
    });

    const activeDbProducts = await Product.find({
      status: { $ne: 'archived' },
      isArchived: { $ne: true }
    });
    assert(activeDbProducts.length === 1 && activeDbProducts[0].id === 'signature-wireless-earphone',
      '2.5.1: Active DB query only returns active non-archived products');

    const archivedItem = await Product.findOne({
      id: 'iphone-15-pro',
      $or: [{ status: 'archived' }, { isArchived: true }]
    });
    assert(archivedItem !== null && archivedItem.name === 'iPhone 15 Pro',
      '2.5.2: Archived product exists in DB for order history preservation but is flagged archived');

    // -------------------------------------------------------------------------
    // 2.6: REMOVAL OF FALSE MARKETING CLAIMS
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2.6: Audit of False Claims in Codebase ---');
    const filesToAudit = [
      'src/views/Home.jsx',
      'src/views/ProductDetails.jsx',
      'src/components/Footer.jsx',
      'src/components/ClientLayout.jsx',
      'src/components/AdminPromotions.jsx',
      'src/utils/categoryData.js',
      'src/views/Login.jsx',
      'src/views/Orders.jsx',
      'src/views/CategoriesPage.jsx',
      'src/views/SellerDashboard.jsx',
      'src/views/ProductCatalog.jsx',
      'src/views/InfoPage.jsx',
      'src/app/layout.jsx'
    ];

    const forbiddenPhrases = [
      '100% Genuine Brand Warranty',
      'Official Brand Partner',
      '10,000+ happy customers',
      'BUY 2 GET 1 FREE CARNIVAL',
      '100% Genuine Authorized Inventory',
      'authentic brand warranty india'
    ];

    for (const relPath of filesToAudit) {
      const fullPath = path.resolve(relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const phrase of forbiddenPhrases) {
          assert(!content.includes(phrase), `2.6: "${relPath}" contains no "${phrase}"`);
        }
      }
    }

  } catch (err) {
    console.error('💥 Test suite encountered fatal error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
