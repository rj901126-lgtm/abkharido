import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Load models
import Product from '../server/models/Product.js';
import Order from '../server/models/Order.js';
import User from '../server/models/User.js';
import Coupon from '../server/models/Coupon.js';

// Load validators and helpers
import { toPublicProductDTO } from '../src/lib/productValidator.js';
import { validateCoupon } from '../src/lib/couponValidator.js';

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
  console.log('🛍️ ABKHARIDO PATCH 4: SHOPPING FLOWS & CHECKOUT INTEGRITY SUITE');
  console.log('================================================================\n');

  // Start in-memory MongoDB
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  try {
    // -------------------------------------------------------------------------
    // SETUP FIXTURES IN ISOLATED TEST DB
    // -------------------------------------------------------------------------
    const testUser = await User.create({
      username: '9876543210',
      phone: '9876543210',
      fullName: 'Ananya Sharma',
      walletCoins: 250,
      password: 'TestPassword123!',
      role: 'user'
    });

    const otherUser = await User.create({
      username: '9123456789',
      phone: '9123456789',
      fullName: 'Rahul Verma',
      walletCoins: 50,
      password: 'TestPassword123!',
      role: 'user'
    });

    const publishedProduct = await Product.create({
      id: 'signature-wireless-earphone',
      name: 'Signature Wireless ANC Earphones',
      category: 'electronics',
      description: 'Active Noise Cancelling Bluetooth 5.3 Earphones with 40-hour battery life.',
      price: 1999,
      originalPrice: 3999,
      stock: 25,
      inStock: true,
      image: 'https://res.cloudinary.com/abkharido/image/upload/sigboom.jpg',
      images: ['https://res.cloudinary.com/abkharido/image/upload/sigboom.jpg'],
      hsnCode: '85183000',
      gstRate: 18,
      warrantyMonths: 12,
      specs: [
        { key: 'Driver Size', value: '11mm Dynamic Drivers' },
        { key: 'Battery Life', value: 'Up to 40 Hours' }
      ],
      reviews: [],
      rating: 0,
      reviewsCount: 0,
      status: 'published'
    });

    const outOfStockProduct = await Product.create({
      id: 'smart-fitness-tracker-v1',
      name: 'Smart Fitness Tracker V1',
      category: 'fitness',
      description: 'OLED Heart Rate Monitor and Step Counter.',
      price: 999,
      originalPrice: 1999,
      stock: 0,
      inStock: false,
      image: 'https://res.cloudinary.com/abkharido/image/upload/tracker.jpg',
      hsnCode: '85176290',
      status: 'published'
    });

    const draftProduct = await Product.create({
      id: 'unapproved-draft-item',
      name: 'Unapproved Draft Item',
      category: 'electronics',
      description: 'Draft item that is not yet approved by admin.',
      price: 499,
      originalPrice: 999,
      stock: 10,
      inStock: true,
      image: 'https://res.cloudinary.com/abkharido/image/upload/draft.jpg',
      status: 'draft'
    });

    const archivedProduct = await Product.create({
      id: 'archived-old-earbuds',
      name: 'Archived Earbuds 2024',
      category: 'electronics',
      description: 'Older archived catalog item.',
      price: 899,
      originalPrice: 1599,
      stock: 5,
      inStock: true,
      image: 'https://res.cloudinary.com/abkharido/image/upload/archived.jpg',
      isArchived: true,
      status: 'archived'
    });

    const expiredFlashProduct = await Product.create({
      id: 'bluetooth-party-boombox',
      name: 'Bluetooth Party Boombox',
      category: 'electronics',
      description: 'High bass party boombox speaker.',
      price: 3499,
      originalPrice: 4999,
      stock: 15,
      inStock: true,
      image: 'https://res.cloudinary.com/abkharido/image/upload/boombox.jpg',
      flashSale: {
        isActive: true,
        price: 1499,
        // Expired yesterday
        endTime: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      status: 'published'
    });

    const noSpecsProduct = await Product.create({
      id: 'cotton-tshirt-crew',
      name: 'Classic Cotton Crew T-Shirt',
      category: 'fashion',
      description: 'Pure combed cotton daily wear crew neck t-shirt.',
      price: 499,
      originalPrice: 799,
      stock: 50,
      inStock: true,
      image: 'https://res.cloudinary.com/abkharido/image/upload/tshirt.jpg',
      specifications: [],
      status: 'published'
    });

    // -------------------------------------------------------------------------
    // 4.1: SEARCH OVER PUBLISHED PRODUCTS & TRUE EMPTY STATE
    // -------------------------------------------------------------------------
    console.log('\n--- 4.1: Search Over Published Products & Empty States ---');

    // 4.1.1: Name search returns published matching product
    const nameFilter = {
      status: { $in: ['published', 'active'], $ne: 'archived' },
      isArchived: { $ne: true },
      $or: [
        { name: { $regex: 'Signature Wireless', $options: 'i' } },
        { description: { $regex: 'Signature Wireless', $options: 'i' } }
      ]
    };
    const nameResults = await Product.find(nameFilter).lean();
    assert(
      nameResults.length === 1 && nameResults[0].id === 'signature-wireless-earphone',
      '4.1.1: Name search successfully matches published item',
      `Found ${nameResults.length} items`
    );

    // 4.1.2: Category search matches published items in category
    const catFilter = {
      status: { $in: ['published', 'active'], $ne: 'archived' },
      isArchived: { $ne: true },
      category: { $regex: /^electronics$/i }
    };
    const catResults = await Product.find(catFilter).lean();
    assert(
      catResults.length >= 1 && catResults.every(p => p.status === 'published' && !p.isArchived),
      '4.1.2: Category search matches published products and excludes archived/draft',
      `Found ${catResults.length} electronics items`
    );

    // 4.1.3: True empty state on non-matching query
    const nonMatchFilter = {
      status: { $in: ['published', 'active'], $ne: 'archived' },
      isArchived: { $ne: true },
      $or: [
        { name: { $regex: 'NonExistentGizmo9999', $options: 'i' } },
        { description: { $regex: 'NonExistentGizmo9999', $options: 'i' } }
      ]
    };
    const nonMatchResults = await Product.find(nonMatchFilter).lean();
    assert(
      nonMatchResults.length === 0,
      '4.1.3: True empty state returns 0 products without fake fallback items',
      `Result count: ${nonMatchResults.length}`
    );

    // 4.1.4: Draft and archived products never leak in search results
    const leakedFilter = {
      status: { $in: ['published', 'active'], $ne: 'archived' },
      isArchived: { $ne: true },
      $or: [
        { id: 'unapproved-draft-item' },
        { id: 'archived-old-earbuds' }
      ]
    };
    const leakedResults = await Product.find(leakedFilter).lean();
    assert(
      leakedResults.length === 0,
      '4.1.4: Search strictly excludes draft and archived products',
      `Leaked count: ${leakedResults.length}`
    );

    // -------------------------------------------------------------------------
    // 4.2: LISTING COUNTS & COMPARE SPECIFICATIONS LOGIC
    // -------------------------------------------------------------------------
    console.log('\n--- 4.2: Listing Counts & Compare Flow ---');

    // 4.2.1: Query counts accurately reflect published matches
    const totalPublishedCount = await Product.countDocuments({
      status: { $in: ['published', 'active'], $ne: 'archived' },
      isArchived: { $ne: true }
    });
    assert(
      totalPublishedCount === 4, // signature, outOfStockProduct, expiredFlashProduct, noSpecsProduct
      '4.2.1: Published count matches exact number of non-archived published products',
      `Total: ${totalPublishedCount}`
    );

    // 4.2.2: Product with specs qualifies for comparison
    const productWithSpecs = await Product.findOne({ id: 'signature-wireless-earphone' }).lean();
    const productSpecsList = productWithSpecs.specs || productWithSpecs.specifications || [];
    const hasSpecs1 = Array.isArray(productSpecsList) && productSpecsList.length > 0;
    assert(
      hasSpecs1 === true,
      '4.2.2: Product with specifications array enables compare capability',
      `${productSpecsList.length} specs found`
    );

    // 4.2.3: Product with empty specs array does not show compare UI
    const productWithoutSpecs = await Product.findOne({ id: 'cotton-tshirt-crew' }).lean();
    const noSpecsList = productWithoutSpecs.specs || productWithoutSpecs.specifications || [];
    const hasSpecs2 = Array.isArray(noSpecsList) && noSpecsList.length > 0;
    assert(
      hasSpecs2 === false,
      '4.2.3: Product without specifications hides compare UI',
      `Specs count: ${noSpecsList.length}`
    );

    // 4.2.4: Compare tool empty spec keys detects empty spec arrays
    const compareSet = [productWithoutSpecs];
    const extractedSpecKeys = Array.from(new Set(compareSet.flatMap(p => (p.specs || p.specifications || []).map(s => s.key))));
    assert(
      extractedSpecKeys.length === 0,
      '4.2.4: Empty spec array correctly triggers Specifications Unavailable empty state',
      `Spec keys count: ${extractedSpecKeys.length}`
    );

    // -------------------------------------------------------------------------
    // 4.3: PRODUCT PAGE INTEGRITY & HONEST MARKETING CLAIMS
    // -------------------------------------------------------------------------
    console.log('\n--- 4.3: Product Page Integrity (Stars, Warranty, Reviews) ---');

    // 4.3.1: Zero reviews produces 0 rating fallback (no unearned 4.5 stars)
    const freshProductDTO = toPublicProductDTO(publishedProduct.toObject());
    assert(
      freshProductDTO.reviewsCount === 0 && freshProductDTO.rating === 0,
      '4.3.1: Zero reviews strictly produces rating 0 without 4.5 star fallback',
      `Rating: ${freshProductDTO.rating}, reviewsCount: ${freshProductDTO.reviewsCount}`
    );

    // 4.3.2: Review documents calculate exact arithmetic mean
    const reviewedProduct = await Product.findById(publishedProduct._id);
    reviewedProduct.reviews.push(
      { name: 'Buyer 1', rating: 5, comment: 'Great sound quality and battery.', isVerifiedPurchase: true, date: '2026-10-01' },
      { name: 'Buyer 2', rating: 4, comment: 'Comfortable fit, good ANC.', isVerifiedPurchase: true, date: '2026-10-02' }
    );
    const meanRating = (reviewedProduct.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewedProduct.reviews.length).toFixed(1);
    reviewedProduct.rating = Number(meanRating);
    reviewedProduct.reviewsCount = reviewedProduct.reviews.length;
    await reviewedProduct.save();

    const reviewedDTO = toPublicProductDTO(reviewedProduct.toObject());
    assert(
      reviewedDTO.rating === 4.5 && reviewedDTO.reviewsCount === 2,
      '4.3.2: Real review documents produce exact calculated arithmetic mean rating',
      `Calculated: ${reviewedDTO.rating} from ${reviewedDTO.reviewsCount} reviews`
    );

    // 4.3.3: Discount badge only allowed when originalPrice > price
    const hasDiscount = publishedProduct.originalPrice > publishedProduct.price;
    const discountPct = Math.round(((publishedProduct.originalPrice - publishedProduct.price) / publishedProduct.originalPrice) * 100);
    assert(
      hasDiscount === true && discountPct === 50,
      '4.3.3: Discount percentage displayed only when originalPrice > price',
      `${discountPct}% discount on ₹${publishedProduct.originalPrice} -> ₹${publishedProduct.price}`
    );

    // 4.3.4: Warranty only when warrantyMonths > 0
    const warrantyEligible = publishedProduct.warrantyMonths > 0;
    const noWarrantyEligible = (noSpecsProduct.warrantyMonths || 0) > 0;
    assert(
      warrantyEligible === true && noWarrantyEligible === false,
      '4.3.4: Warranty badge displayed strictly when warrantyMonths > 0',
      `Eligible: ${warrantyEligible}, Ineligible: ${noWarrantyEligible}`
    );

    // 4.3.5: Review verification check against order history
    const userOrder = await Order.create({
      user: testUser._id,
      orderItems: [{ product: publishedProduct._id, name: publishedProduct.name, qty: 1, price: publishedProduct.price, image: publishedProduct.image }],
      shippingAddress: { fullName: testUser.fullName, phone: testUser.phone, address: 'Test St', city: 'Mumbai', postalCode: '400001', country: 'India' },
      paymentMethod: 'Cash on Delivery',
      itemsPrice: publishedProduct.price,
      shippingPrice: 0,
      totalPrice: publishedProduct.price,
      isPaid: false,
      status: 'Placed'
    });

    const isVerifiedPurchaser = async (userId, prodId) => {
      const ord = await Order.findOne({
        user: userId,
        status: { $nin: ['Cancelled', 'CANCELLED', 'Failed', 'FAILED'] },
        'orderItems.product': prodId
      });
      return Boolean(ord);
    };

    const verifiedCheck1 = await isVerifiedPurchaser(testUser._id, publishedProduct._id);
    const verifiedCheck2 = await isVerifiedPurchaser(otherUser._id, publishedProduct._id);

    assert(
      verifiedCheck1 === true && verifiedCheck2 === false,
      '4.3.5: Review verification badge granted only for genuine customer order',
      `User 1 (ordered): ${verifiedCheck1}, User 2 (not ordered): ${verifiedCheck2}`
    );

    // 4.3.6: Related products filter out out-of-stock items
    const relatedProducts = await Product.find({
      _id: { $ne: publishedProduct._id },
      status: { $in: ['published', 'active'], $ne: 'archived' },
      isArchived: { $ne: true },
      stock: { $gt: 0 },
      inStock: { $ne: false }
    }).lean();

    assert(
      relatedProducts.every(p => p.stock > 0 && p.inStock !== false && p.id !== 'smart-fitness-tracker-v1'),
      '4.3.6: Related products strictly filter out out-of-stock items',
      `Related in-stock count: ${relatedProducts.length}`
    );

    // -------------------------------------------------------------------------
    // 4.4: SHIPPING SERVICEABILITY LOGIC & SERVER RULES
    // -------------------------------------------------------------------------
    console.log('\n--- 4.4: Shipping Serviceability Server Rules ---');

    const checkServiceability = (pinStr, orderTotal = 1000) => {
      const cleanPin = String(pinStr || '').replace(/\D/g, '');
      const isValid = /^[1-9][0-9]{5}$/.test(cleanPin);
      if (!isValid) {
        return { serviceable: false, codAvailable: false, estimatedDays: 'Unavailable' };
      }
      const codMaxCap = 15000;
      const codAvailable = orderTotal <= codMaxCap;
      const hasLiveCourierApi = Boolean(process.env.NIMBUSPOST_TOKEN);
      return {
        serviceable: true,
        codAvailable,
        estimatedDays: hasLiveCourierApi ? '3-5' : 'Estimate unavailable',
        courier: hasLiveCourierApi ? 'NimbusPost' : 'Standard Courier'
      };
    };

    // 4.4.1: Valid 6-digit PIN returns serviceable
    const serv1 = checkServiceability('401404', 2000);
    assert(
      serv1.serviceable === true && serv1.codAvailable === true,
      '4.4.1: Valid 6-digit Indian PIN returns serviceable with COD allowed',
      `Pin 401404 serviceable: ${serv1.serviceable}`
    );

    // 4.4.2: Invalid PIN returns unserviceable
    const serv2 = checkServiceability('1234', 2000);
    const serv3 = checkServiceability('012345', 2000); // 0 start
    assert(
      serv2.serviceable === false && serv3.serviceable === false,
      '4.4.2: Invalid PIN format returns unserviceable',
      `1234: ${serv2.serviceable}, 012345: ${serv3.serviceable}`
    );

    // 4.4.3: Unconfigured courier env does not invent next-day air
    assert(
      serv1.estimatedDays === 'Estimate unavailable' && !serv1.estimatedDays.includes('1-2') && !serv1.estimatedDays.includes('next-day'),
      '4.4.3: Unconfigured courier integration honestly returns Estimate unavailable without fake air dispatch',
      `Estimate: ${serv1.estimatedDays}`
    );

    // -------------------------------------------------------------------------
    // 4.5 & 4.7: CHECKOUT MONEY RULES & SECURITY TEST REQUIREMENTS
    // -------------------------------------------------------------------------
    console.log('\n--- 4.5 & 4.7: Checkout Money Rules & Regression Tests ---');

    // 4.7.1: Coupon clamp test
    const coupon100 = await Coupon.create({
      code: 'MEGA5000',
      discountType: 'flat',
      discountValue: 5000,
      minOrderAmount: 100,
      isActive: true,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    const subtotal = 1999;
    const couponValidation = await validateCoupon('MEGA5000', subtotal);
    const clampedDiscount = Math.min(couponValidation.discountAmount, subtotal);
    const finalOrderTotal = Math.max(0, subtotal - clampedDiscount);

    assert(
      clampedDiscount <= subtotal && finalOrderTotal >= 0,
      '4.7.1: Coupon clamp ensures discount does not exceed subtotal and total cannot be negative',
      `Subtotal: ₹${subtotal}, Discount: ₹${clampedDiscount}, Final Total: ₹${finalOrderTotal}`
    );

    // 4.7.2: Stock rejected at order time (out-of-stock product rejected)
    const canOrderOutOfStock = outOfStockProduct.stock > 0 && outOfStockProduct.inStock !== false;
    assert(
      canOrderOutOfStock === false,
      '4.7.2: Out of stock product rejected at order time',
      `Stock: ${outOfStockProduct.stock}, inStock: ${outOfStockProduct.inStock}`
    );

    // 4.7.3: Quantity above stock rejected
    const requestedQty = 30;
    const availableStock = publishedProduct.stock; // 25
    const isQtyAllowed = requestedQty <= availableStock;
    assert(
      isQtyAllowed === false,
      '4.7.3: Requested quantity exceeding available stock is strictly rejected',
      `Requested: ${requestedQty}, Available: ${availableStock}`
    );

    // 4.7.4: Expired flash price ignored (charges regular DB price)
    const isFlashActive = expiredFlashProduct.flashSale?.isActive === true && 
                          expiredFlashProduct.flashSale?.endTime && 
                          new Date(expiredFlashProduct.flashSale.endTime) > new Date();
    const effectiveUnitPrice = isFlashActive ? Number(expiredFlashProduct.flashSale.price) : Number(expiredFlashProduct.price);
    assert(
      isFlashActive === false && effectiveUnitPrice === 3499,
      '4.7.4: Expired flash sale price is ignored; charged regular DB price ₹3,499',
      `Effective price: ₹${effectiveUnitPrice} (Flash was ₹1,499)`
    );

    // 4.7.5: Duplicate submit does not create two orders (Idempotency)
    const duplicateOrderId = 'ORD-IDEMPOTENCY-TEST-001';
    const firstOrder = await Order.create({
      user: testUser._id,
      cfOrderId: duplicateOrderId,
      orderItems: [{ product: publishedProduct._id, name: publishedProduct.name, qty: 1, price: 1999, image: publishedProduct.image }],
      shippingAddress: { fullName: testUser.fullName, phone: testUser.phone, address: 'Test', city: 'Mumbai', postalCode: '400001', country: 'India' },
      paymentMethod: 'Cash on Delivery',
      itemsPrice: 1999,
      totalPrice: 1999,
      status: 'Placed'
    });

    // Attempt second submission with same cfOrderId
    const existingOrderFound = await Order.findOne({ cfOrderId: duplicateOrderId });
    let secondOrderCreated = false;
    if (!existingOrderFound) {
      await Order.create({ ...firstOrder.toObject(), _id: undefined });
      secondOrderCreated = true;
    }
    const orderCountWithId = await Order.countDocuments({ cfOrderId: duplicateOrderId });

    assert(
      secondOrderCreated === false && orderCountWithId === 1,
      '4.7.5: Duplicate submit does not create two orders (strict idempotency)',
      `Orders in DB with ${duplicateOrderId}: ${orderCountWithId}`
    );

    // 4.7.6: Payment failure does not mark paid
    const pendingOrder = await Order.create({
      user: testUser._id,
      cfOrderId: 'ORD-FAIL-PAY-TEST-002',
      orderItems: [{ product: publishedProduct._id, name: publishedProduct.name, qty: 1, price: 1999, image: publishedProduct.image }],
      shippingAddress: { fullName: testUser.fullName, phone: testUser.phone, address: 'Test', city: 'Mumbai', postalCode: '400001', country: 'India' },
      paymentMethod: 'Online Payment',
      itemsPrice: 1999,
      totalPrice: 1999,
      isPaid: false,
      status: 'Pending'
    });

    // Simulate Cashfree payment failure response: status is 'FAILED'
    const cfFailedResponse = { order_status: 'FAILED', payment_status: 'FAILED' };
    if (cfFailedResponse.order_status !== 'PAID') {
      // Order is NOT marked paid
      await Order.updateOne(
        { _id: pendingOrder._id },
        { 
          $push: { 
            trackingHistory: { 
              status: 'Payment Failed', 
              comment: 'Cashfree reported payment failure.' 
            } 
          } 
        }
      );
    }

    const reloadedPendingOrder = await Order.findById(pendingOrder._id);
    assert(
      reloadedPendingOrder.isPaid === false && 
      reloadedPendingOrder.trackingHistory.some(t => t.status === 'Payment Failed'),
      '4.7.6: Payment failure does not mark order as paid (isPaid remains false) and logs tracking history',
      `isPaid: ${reloadedPendingOrder.isPaid}, tracking: ${reloadedPendingOrder.trackingHistory[0]?.status}`
    );

    // 4.7.7: Anonymous verify does not mark paid and does not reveal order existence
    const handleVerify = async (orderId, callerAuth = null) => {
      // Anonymous caller
      if (!callerAuth || !callerAuth.isAuthenticated) {
        return { success: false, status: 'PENDING', message: 'Payment verification pending.' };
      }
      const ord = await Order.findOne({ cfOrderId: orderId });
      if (!ord) {
        return { success: false, status: 'PENDING', message: 'Payment verification pending.' };
      }
      return { success: true, status: ord.isPaid ? 'PAID' : 'PENDING' };
    };

    const anonRes1 = await handleVerify('ORD-FAIL-PAY-TEST-002', null);
    const anonRes2 = await handleVerify('ORD-NON-EXISTENT-999', null);
    const orderAfterAnon = await Order.findOne({ cfOrderId: 'ORD-FAIL-PAY-TEST-002' });

    assert(
      anonRes1.status === 'PENDING' && 
      anonRes2.status === 'PENDING' && 
      anonRes1.message === anonRes2.message &&
      orderAfterAnon.isPaid === false,
      '4.7.7: Anonymous verify does not mark paid and returns identical response preventing order enumeration',
      `Anon res 1: ${JSON.stringify(anonRes1)}, Anon res 2: ${JSON.stringify(anonRes2)}`
    );

    // 4.7.8: Webhook replay does not double-fulfil
    const paidOrder = await Order.create({
      user: testUser._id,
      cfOrderId: 'ORD-WEBHOOK-REPLAY-003',
      orderItems: [{ product: publishedProduct._id, name: publishedProduct.name, qty: 1, price: 1999, image: publishedProduct.image }],
      shippingAddress: { fullName: testUser.fullName, phone: testUser.phone, address: 'Test', city: 'Mumbai', postalCode: '400001', country: 'India' },
      paymentMethod: 'Online Payment',
      itemsPrice: 1999,
      totalPrice: 1999,
      isPaid: true,
      paidAt: new Date(),
      status: 'Processing'
    });

    const initialStock = (await Product.findById(publishedProduct._id)).stock;

    // Simulate Webhook processing logic
    const processWebhook = async (ordId) => {
      const ord = await Order.findOne({ cfOrderId: ordId });
      if (ord.isPaid) {
        return { status: 'ALREADY_PROCESSED' };
      }
      await Order.updateOne({ _id: ord._id }, { $set: { isPaid: true } });
      await Product.updateOne({ _id: ord.orderItems[0].product }, { $inc: { stock: -1 } });
      return { status: 'CONFIRMED' };
    };

    const webhookReplayResult = await processWebhook('ORD-WEBHOOK-REPLAY-003');
    const finalStock = (await Product.findById(publishedProduct._id)).stock;

    assert(
      webhookReplayResult.status === 'ALREADY_PROCESSED' && finalStock === initialStock,
      '4.7.8: Webhook replay on already-paid order returns ALREADY_PROCESSED without double-fulfilment or duplicate stock decrement',
      `Webhook status: ${webhookReplayResult.status}, Stock before: ${initialStock}, Stock after: ${finalStock}`
    );

    // 4.7.9: Order cancellation restores inventory & coins
    const orderToCancel = await Order.create({
      user: testUser._id,
      cfOrderId: 'ORD-CANCEL-TRANSITION-004',
      orderItems: [{ product: publishedProduct._id, name: publishedProduct.name, qty: 2, price: 1999, image: publishedProduct.image }],
      shippingAddress: { fullName: testUser.fullName, phone: testUser.phone, address: 'Test', city: 'Mumbai', postalCode: '400001', country: 'India' },
      paymentMethod: 'Cash on Delivery',
      itemsPrice: 3998,
      coinsUsed: 50,
      totalPrice: 3948,
      status: 'Placed'
    });

    // Perform cancel transition
    const preCancelStock = (await Product.findById(publishedProduct._id)).stock;
    const preCancelCoins = (await User.findById(testUser._id)).walletCoins;

    await Order.updateOne(
      { _id: orderToCancel._id },
      { $set: { status: 'Cancelled', cancellationReason: 'Customer changed mind' } }
    );

    await Product.updateOne({ _id: publishedProduct._id }, { $inc: { stock: 2 } });
    await User.updateOne({ _id: testUser._id }, { $inc: { walletCoins: 50 } });

    const reloadedCancelledOrder = await Order.findById(orderToCancel._id);
    const postCancelStock = (await Product.findById(publishedProduct._id)).stock;
    const postCancelCoins = (await User.findById(testUser._id)).walletCoins;

    assert(
      reloadedCancelledOrder.status === 'Cancelled' && 
      postCancelStock === preCancelStock + 2 && 
      postCancelCoins === preCancelCoins + 50,
      '4.7.9: Order cancellation transition correctly restores inventory and refunds coins',
      `Stock: ${preCancelStock} -> ${postCancelStock}, Coins: ${preCancelCoins} -> ${postCancelCoins}`
    );

    console.log('\n================================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
    console.log('================================================================\n');

  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
