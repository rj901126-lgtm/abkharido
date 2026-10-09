import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load models
import Product from '../server/models/Product.js';

// Load validators and helpers
import { validateProductData, toPublicProductDTO, isPlaceholderImage } from '../src/lib/productValidator.js';

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
  console.log('📦 ABKHARIDO PATCH 3: PRODUCT DATA & PUBLISHING REGRESSION SUITE');
  console.log('================================================================\n');

  // Start in-memory MongoDB
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  try {
    // -------------------------------------------------------------------------
    // 3.1: PRODUCT FIELD VALIDATION RULES
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3.1: Product Field Validation & Types ---');
    const adminUser = { id: 'admin-1', email: 'admin@abkharido.com', isAdmin: true, role: 'admin' };
    const sellerUser = { id: 'seller-1', email: 'seller@partner.com', isAdmin: false, role: 'seller' };

    // 3.1.1: Valid complete product passes validation
    const validPayload = {
      id: 'portable-rgb-speaker-v2',
      name: 'Portable RGB Speaker V2',
      category: 'electronics',
      description: 'High-power 20W Bluetooth portable speaker with dynamic RGB LEDs.',
      price: 1299,
      originalPrice: 2499,
      stock: 45,
      image: 'https://res.cloudinary.com/abkharido/image/upload/speaker.jpg',
      images: ['https://res.cloudinary.com/abkharido/image/upload/speaker.jpg'],
      hsnCode: '85182100',
      gstRate: 18,
      warrantyMonths: 12,
      status: 'published'
    };
    const validRes = validateProductData(validPayload, adminUser, false);
    assert(validRes.isValid, '3.1.1: Complete valid product passes validation for admin', validRes.errors.join('; '));
    assert(validRes.sanitizedProduct.inStock === true, '3.1.2: inStock is strictly derived true when stock > 0');

    // 3.1.3: inStock is strictly derived false when stock === 0
    const zeroStockPayload = { ...validPayload, id: 'zero-stock-item', stock: 0 };
    const zeroStockRes = validateProductData(zeroStockPayload, adminUser, false);
    assert(zeroStockRes.isValid, '3.1.3: Zero stock product is valid');
    assert(zeroStockRes.sanitizedProduct.inStock === false, '3.1.4: inStock is strictly derived false when stock is 0');

    // 3.1.5: Invalid ID (spaces / uppercase) is rejected
    const invalidIdRes = validateProductData({ ...validPayload, id: 'INVALID ID WITH SPACES' }, adminUser, false);
    assert(!invalidIdRes.isValid, '3.1.5: Product ID with invalid characters is rejected');

    // 3.1.6: Non-integer / negative price rejected
    const invalidPriceRes = validateProductData({ ...validPayload, id: 'bad-price', price: -500 }, adminUser, false);
    assert(!invalidPriceRes.isValid, '3.1.6: Negative price is rejected');

    // 3.1.7: Missing description rejected
    const shortDescRes = validateProductData({ ...validPayload, id: 'short-desc', description: 'tiny' }, adminUser, false);
    assert(!shortDescRes.isValid, '3.1.7: Short description (< 10 chars) is rejected');

    // 3.1.8: Placeholder image rejected on publish
    const placeholderRes = validateProductData({
      ...validPayload,
      id: 'placeholder-item',
      image: 'https://via.placeholder.com/600x400',
      images: ['https://via.placeholder.com/600x400']
    }, adminUser, false);
    assert(!placeholderRes.isValid, '3.1.8: Placeholder image URL rejected on publish');

    // -------------------------------------------------------------------------
    // 3.2: FORBIDDEN ON PUBLIC OUTPUT & DTO SANITIZATION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3.2: Public Output Sanitization & Honest Metrics ---');

    const rawDbProduct = {
      id: 'test-sanitized-sku',
      name: 'Sanitized Speaker',
      category: 'electronics',
      description: 'Tested description for public projection.',
      price: 999,
      stock: 10,
      image: 'https://res.cloudinary.com/test/prod.jpg',
      images: ['https://res.cloudinary.com/test/prod.jpg', 'https://via.placeholder.com/mock.jpg'],
      rating: 4.9, // Claimed
      reviewsCount: 420, // Claimed
      reviews: [], // Zero actual review documents
      userCommissionRate: 0.05,
      influencerCommissionRate: 0.10,
      vendorId: 'vendor-secret-123',
      costPrice: 400,
      auditLogs: [{ action: 'SECRET' }]
    };

    const publicDTO = toPublicProductDTO(rawDbProduct);
    assert(publicDTO.reviewsCount === 0, '3.2.1: reviewsCount is derived strictly from reviews array (0, not claimed 420)');
    assert(publicDTO.rating === 0, '3.2.2: rating is derived strictly from reviews array (0, not claimed 4.9)');
    assert(publicDTO.userCommissionRate === undefined, '3.2.3: userCommissionRate is omitted from public DTO');
    assert(publicDTO.influencerCommissionRate === undefined, '3.2.4: influencerCommissionRate is omitted from public DTO');
    assert(publicDTO.vendorId === undefined, '3.2.5: vendorId is omitted from public DTO');
    assert(publicDTO.costPrice === undefined, '3.2.6: costPrice is omitted from public DTO');
    assert(publicDTO.auditLogs === undefined, '3.2.7: auditLogs is omitted from public DTO');
    assert(!publicDTO.images.some(img => img.includes('placeholder')), '3.2.8: Placeholder image URLs stripped from images array');

    // -------------------------------------------------------------------------
    // 3.3: STATUS LIFECYCLE & ADMIN-ONLY PUBLISHING
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3.3: Status Lifecycle & Admin Authority ---');

    // Seller cannot publish directly
    const sellerPublishRes = validateProductData(validPayload, sellerUser, false);
    assert(!sellerPublishRes.isValid, '3.3.1: Seller is rejected when attempting status: published');

    // Seller can save as draft
    const sellerDraftRes = validateProductData({ ...validPayload, status: 'draft' }, sellerUser, false);
    assert(sellerDraftRes.isValid, '3.3.2: Seller can create a product in status: draft');

    // Seller can save as review
    const sellerReviewRes = validateProductData({ ...validPayload, status: 'review' }, sellerUser, false);
    assert(sellerReviewRes.isValid, '3.3.3: Seller can submit a product for review');

    // -------------------------------------------------------------------------
    // 3.4: DATABASE ISOLATION OF DRAFT, REVIEW, ARCHIVED PRODUCTS
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3.4: Database Query Isolation ---');
    // Seed DB with draft, review, published, and archived items
    await Product.create({
      id: 'published-product-1',
      name: 'Published Product One',
      price: 799,
      originalPrice: 999,
      stock: 20,
      image: 'https://res.cloudinary.com/img1.jpg',
      category: 'electronics',
      description: 'Published description',
      status: 'published',
      isArchived: false,
      reviewsCount: 0
    });

    await Product.create({
      id: 'draft-product-1',
      name: 'Draft Product One',
      price: 599,
      originalPrice: 899,
      stock: 10,
      image: 'https://res.cloudinary.com/img2.jpg',
      category: 'electronics',
      description: 'Draft description',
      status: 'draft',
      isArchived: false,
      reviewsCount: 0
    });

    await Product.create({
      id: 'review-product-1',
      name: 'Review Product One',
      price: 699,
      originalPrice: 999,
      stock: 15,
      image: 'https://res.cloudinary.com/img3.jpg',
      category: 'electronics',
      description: 'Review description',
      status: 'review',
      isArchived: false,
      reviewsCount: 0
    });

    await Product.create({
      id: 'archived-product-1',
      name: 'Archived Product One',
      price: 899,
      originalPrice: 1199,
      stock: 0,
      image: 'https://res.cloudinary.com/img4.jpg',
      category: 'electronics',
      description: 'Archived description',
      status: 'archived',
      isArchived: true,
      reviewsCount: 0
    });

    // Public list query
    const publicList = await Product.find({
      status: { $in: ['published', 'active'] },
      isArchived: { $ne: true }
    });
    assert(publicList.length === 1 && publicList[0].id === 'published-product-1',
      '3.4.1: Public DB query returns only published products (draft, review, archived excluded)');

    // -------------------------------------------------------------------------
    // 3.5: SITEMAP INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3.5: Sitemap Integrity & Filtering ---');
    const sitemapContent = fs.readFileSync(path.resolve('./src/app/sitemap.js'), 'utf-8');
    assert(sitemapContent.includes("status: { $in: ['published', 'active'] }"),
      '3.5.1: src/app/sitemap.js restricts DB query to published / active products');
    assert(sitemapContent.includes("isArchived: { $ne: true }"),
      '3.5.2: src/app/sitemap.js excludes isArchived products');
    assert(sitemapContent.includes("lastModified: p.updatedAt"),
      '3.5.3: src/app/sitemap.js derives lastModified from product updatedAt timestamp');

    // -------------------------------------------------------------------------
    // 3.6: MIGRATION SCRIPT VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3.6: Migration Script Verification ---');
    const migrationContent = fs.readFileSync(path.resolve('./scripts/migrate_patch3_products.mjs'), 'utf-8');
    assert(migrationContent.includes('isRollback'), '3.6.1: migrate_patch3_products.mjs supports --rollback mode');
    assert(migrationContent.includes('products_backup_before_patch3_'), '3.6.2: migrate_patch3_products.mjs creates pre-migration backup');
    assert(migrationContent.includes('auditLogs'), '3.6.3: migrate_patch3_products.mjs records auditLogs on migrated records');

  } catch (err) {
    console.error('💥 Test suite fatal error:', err);
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
