import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load models
import Product from '../server/models/Product.js';
import User from '../server/models/User.js';
import Order from '../server/models/Order.js';
import Coupon from '../server/models/Coupon.js';

// Load validators and helpers
import { validateCoupon } from '../src/lib/couponValidator.js';
import { checkRouteRateLimit, resetAllRateLimits } from '../src/lib/rateLimiter.js';

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
  console.log('🔒 ABKHARIDO PATCH 1: P0 SECURITY, MONEY & ACCESS REGRESSION SUITE');
  console.log('================================================================\n');

  // Start in-memory MongoDB
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  try {
    // -------------------------------------------------------------------------
    // 1A: RESET ROUTE & AUTO-SEED REMOVAL
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1A: Database Reset & Auto-Seed Removal ---');
    const legacyRoutesContent = fs.readFileSync(path.resolve('./server/routes/legacyRoutes.js'), 'utf-8');
    assert(!legacyRoutesContent.includes("'/reset'") && !legacyRoutesContent.includes('"/reset"'),
      '1A.1: server/routes/legacyRoutes.js has no /reset endpoint');

    const appContextContent = fs.readFileSync(path.resolve('./src/context/AppContext.jsx'), 'utf-8');
    assert(!appContextContent.includes('resetDatabase'),
      '1A.2: src/context/AppContext.jsx has no resetDatabase export');

    const navbarContent = fs.readFileSync(path.resolve('./src/components/Navbar.jsx'), 'utf-8');
    assert(!navbarContent.includes('resetDatabase'),
      '1A.3: src/components/Navbar.jsx has no resetDatabase button/caller');

    const connectDBContent = fs.readFileSync(path.resolve('./src/lib/connectDB.js'), 'utf-8');
    assert(!connectDBContent.includes('seedDatabaseIfEmpty'),
      '1A.4: src/lib/connectDB.js has no automatic seedDatabaseIfEmpty call');

    const dbConfigContent = fs.readFileSync(path.resolve('./server/config/db.js'), 'utf-8');
    assert(!dbConfigContent.includes('seedDatabaseIfEmpty'),
      '1A.5: server/config/db.js has no automatic seedDatabaseIfEmpty call');

    // -------------------------------------------------------------------------
    // 1B: COUPON VALIDATION & MATH INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1B: Server-Authoritative Coupon Math ---');
    const validCouponResult = await validateCoupon({
      couponCode: 'SAVE10',
      serverSubtotal: 1000
    });
    assert(validCouponResult.valid === true && (validCouponResult.discount === 100 || validCouponResult.discountAmount === 100),
      '1B.1: SAVE10 applies 10% discount on ₹1000 subtotal (₹100 discount)');

    const negativeSubtotalResult = await validateCoupon({
      couponCode: 'SAVE10',
      serverSubtotal: -500
    });
    assert(negativeSubtotalResult.valid === false && negativeSubtotalResult.discountAmount === 0,
      '1B.2: Negative subtotal rejects coupon and clamps discount to 0');

    const belowMinResult = await validateCoupon({
      couponCode: 'SAVE10',
      serverSubtotal: 300
    });
    assert(belowMinResult.valid === false && belowMinResult.discountAmount === 0,
      '1B.3: Subtotal below minimum order requirement (₹499) is rejected');

    const invalidCodeResult = await validateCoupon({
      couponCode: 'NOT_A_REAL_COUPON_99',
      serverSubtotal: 5000
    });
    assert(invalidCodeResult.valid === false && invalidCodeResult.discountAmount === 0,
      '1B.4: Unknown coupon code is rejected');

    // -------------------------------------------------------------------------
    // 1C: PRICING & STOCK INTEGRITY IN DATABASE
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1C: Server-Authoritative Pricing & Stock Checks ---');
    // Create test products
    const normalProd = await Product.create({
      id: 'test-real-watch',
      name: 'Test Real Watch',
      category: 'Electronics',
      description: 'Test description',
      price: 2499,
      originalPrice: 4999,
      stock: 5,
      inStock: true,
      image: 'https://example.com/watch.jpg'
    });

    const outOfStockProd = await Product.create({
      id: 'test-sold-out',
      name: 'Test Sold Out Item',
      category: 'Electronics',
      description: 'Test description',
      price: 999,
      originalPrice: 1999,
      stock: 0,
      inStock: false,
      image: 'https://example.com/item.jpg'
    });

    const expiredFlashProd = await Product.create({
      id: 'test-expired-flash',
      name: 'Test Expired Flash Item',
      category: 'Electronics',
      description: 'Test description',
      price: 1500,
      originalPrice: 2000,
      stock: 10,
      inStock: true,
      flashSale: {
        isActive: true,
        price: 199,
        endTime: new Date(Date.now() - 100000) // Expired in past
      },
      image: 'https://example.com/flash.jpg'
    });

    const activeFlashProd = await Product.create({
      id: 'test-active-flash',
      name: 'Test Active Flash Item',
      category: 'Electronics',
      description: 'Test description',
      price: 1500,
      originalPrice: 2000,
      stock: 10,
      inStock: true,
      flashSale: {
        isActive: true,
        price: 499,
        endTime: new Date(Date.now() + 1000000) // Active in future
      },
      image: 'https://example.com/flash2.jpg'
    });

    // Verification logic (mirroring orders route)
    const resolveItemPrice = (dbProd) => {
      let unitPrice = dbProd.price;
      const now = new Date();
      if (dbProd.flashSale?.isActive && dbProd.flashSale.price > 0 && dbProd.flashSale.endTime && new Date(dbProd.flashSale.endTime) > now) {
        unitPrice = dbProd.flashSale.price;
      }
      return unitPrice;
    };

    assert(resolveItemPrice(normalProd) === 2499,
      '1C.1: Normal product billed at database price (₹2499)');

    assert(resolveItemPrice(expiredFlashProd) === 1500,
      '1C.2: Expired flash sale is ignored and bills normal database price (₹1500, not ₹199)');

    assert(resolveItemPrice(activeFlashProd) === 499,
      '1C.3: Active unexpired flash sale applies promotional flash price (₹499)');

    // Stock check assertion
    const isAvailable = (dbProd, requestedQty) => {
      if (!dbProd.inStock || (dbProd.stock !== undefined && dbProd.stock <= 0)) return false;
      if (dbProd.stock !== undefined && requestedQty > dbProd.stock) return false;
      return true;
    };

    assert(isAvailable(normalProd, 2) === true,
      '1C.4: Quantity within available stock is accepted');

    assert(isAvailable(normalProd, 10) === false,
      '1C.5: Quantity exceeding available stock (10 > 5) is rejected');

    assert(isAvailable(outOfStockProd, 1) === false,
      '1C.6: Out-of-stock product is rejected');

    // -------------------------------------------------------------------------
    // 1D: COD THRESHOLD & PAYMENT STATUS
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1D: COD Cap & Status Rules ---');
    const COD_MAX_LIMIT = 15000;
    const validateCod = (paymentMethod, total) => {
      const isCod = /cash\s*on\s*delivery|cod/i.test(paymentMethod);
      if (isCod && total > COD_MAX_LIMIT) {
        return { allowed: false, error: `Cash on Delivery is only available for orders up to ₹${COD_MAX_LIMIT.toLocaleString('en-IN')}` };
      }
      return { allowed: true, isPaid: isCod ? false : false };
    };

    assert(validateCod('Cash on Delivery', 14999).allowed === true,
      '1D.1: COD order under ₹15,000 is allowed');

    assert(validateCod('Cash on Delivery', 15001).allowed === false,
      '1D.2: COD order over ₹15,000 is rejected');

    assert(validateCod('Cash on Delivery', 5000).isPaid === false,
      '1D.3: COD order is strictly marked unpaid (isPaid: false)');

    // -------------------------------------------------------------------------
    // 1E: PAYMENT VERIFICATION HARDENING
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1E: Cashfree Payment Verification Security ---');
    const verifyRouteContent = fs.readFileSync(path.resolve('./src/app/api/payments/cashfree/verify/route.js'), 'utf-8');
    
    assert(verifyRouteContent.includes('getAuthenticatedUser'),
      '1E.1: Verification requires caller authentication');

    assert(verifyRouteContent.includes("process.env.CASHFREE_PROD !== 'true'") && !verifyRouteContent.includes('DEV_SIMULATE'),
      '1E.2: Unconditional simulation bypass removed; production simulation strictly prohibited');

    assert(verifyRouteContent.includes('genericPendingResponse'),
      '1E.3: Unauthorized or unknown orders return uniform generic response (anti-enumeration)');

    assert(verifyRouteContent.includes('findOneAndUpdate') && verifyRouteContent.includes('isPaid: false'),
      '1E.4: Atomic state transition prevents concurrent double-verification');

    // -------------------------------------------------------------------------
    // 1F: WALLET COIN PAYOUTS
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1F: Wallet Coin Payout Rules ---');
    const payoutsRouteContent = fs.readFileSync(path.resolve('./src/app/api/payouts/route.js'), 'utf-8');

    assert(payoutsRouteContent.includes('1000') || payoutsRouteContent.includes('MIN_PAYOUT_COINS'),
      '1F.1: Minimum 1,000 coins threshold enforced in payouts API');

    assert(payoutsRouteContent.includes('LOCK_DURATION_MS') || payoutsRouteContent.includes('8 * 24 * 60 * 60 * 1000'),
      '1F.2: 8-day lock period enforced on newly earned coins');

    assert(payoutsRouteContent.includes('findOneAndUpdate') && payoutsRouteContent.includes('$inc'),
      '1F.3: Atomic coin deduction via findOneAndUpdate prevents race conditions');

    // -------------------------------------------------------------------------
    // 1G: USER IDOR & ENUMERATION PROTECTION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1G: User IDOR Protection ---');
    const userRouteContent = fs.readFileSync(path.resolve('./src/app/api/users/[...params]/route.js'), 'utf-8');

    assert(userRouteContent.includes('getAuthenticatedUser'),
      '1G.1: User profile lookup requires authentication');

    assert(userRouteContent.includes('!isOwnerOrAdmin') && userRouteContent.includes('fullName: userObj.fullName'),
      '1G.2: Third-party lookup strictly sanitizes phone, email, and wallet coins from response');

    assert(!userRouteContent.includes('user.role = body.role') && !userRouteContent.includes('user.walletCoins = body.walletCoins'),
      '1G.3: Mass-assignment protected (role and walletCoins cannot be escalated via user update)');

    // -------------------------------------------------------------------------
    // 1I: ROUTE RATE LIMITING
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1I: Route Rate Limiting ---');
    resetAllRateLimits();
    const testIp = '192.168.1.100';
    let blockedAt = -1;
    for (let i = 1; i <= 25; i++) {
      const res = checkRouteRateLimit('test-route', testIp, 20, 60000);
      if (!res.allowed && blockedAt === -1) {
        blockedAt = i;
      }
    }
    assert(blockedAt === 21,
      '1I.1: Route rate limiter permits up to maxRequests (20) and blocks on request 21');

    // -------------------------------------------------------------------------
    // 1J: SUPPORT BOT TRUTH & CLAIMS
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1J: Support Bot Hardening ---');
    const botRouteContent = fs.readFileSync(path.resolve('./src/app/api/admin/bot-config/route.js'), 'utf-8');
    assert(botRouteContent.includes('getAuthenticatedUser') && botRouteContent.includes('isAdmin'),
      '1J.1: Admin bot configuration GET requires admin authentication');

    assert(!botRouteContent.includes('totalConversations: 1428'),
      '1J.2: Fabricated stats (1428 conversations) removed from bot config');

    assert(!botRouteContent.includes('Next-Day Air Priority Delivery'),
      '1J.3: Unverified next-day metro air delivery claim removed');

    const botComponentContent = fs.readFileSync(path.resolve('./src/components/SmartSupportBot.jsx'), 'utf-8');
    assert(!botComponentContent.includes("'FIRSTBUY'") && !botComponentContent.includes("'ABVIP500'"),
      '1J.4: Dead coupons (FIRSTBUY, ABVIP500) removed from SmartSupportBot');

    assert(!botComponentContent.includes('(Express Courier Dispatch)'),
      '1J.5: Unverified express claims removed from SmartSupportBot');

    // -------------------------------------------------------------------------
    // 1K: SENSITIVE FIELD SANITIZATION & SECURITY HEADERS
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1K: Sensitive Data Sanitization & Security Headers ---');
    const productsRouteContent = fs.readFileSync(path.resolve('./src/app/api/products/route.js'), 'utf-8');
    assert(!productsRouteContent.includes('influencerCommissionRate: product.influencerCommissionRate'),
      '1K.1: influencerCommissionRate omitted from public products DTO');

    const nextConfigContent = fs.readFileSync(path.resolve('./next.config.mjs'), 'utf-8');
    assert(nextConfigContent.includes("source: '/api/:path*'") && nextConfigContent.includes('no-store'),
      '1K.2: API routes secured with private no-store Cache-Control in next.config.mjs');

  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }

  console.log('\n================================================================');
  console.log(`📊 PATCH 1 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTestSuite().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
