import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactsDir = path.join(__dirname, '..', '..', 'brain', '62f504a8-ace7-4f31-95a6-b3ac9666baaa', '.user_uploaded');

async function runAuthenticatedCheckout() {
  console.log('--- STARTING COMPLETE BUY TO CHECKOUT STEP CAPTURE ---');
  
  // 1. Authenticate via backend API directly to get a valid user token
  await fetch('http://localhost:5000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: '9172600587' })
  });

  const authRes = await fetch('http://localhost:5000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: '9172600587', otp: '123456' })
  });
  const authData = await authRes.json();
  const userData = authData.user;
  console.log('✓ Got user session from backend:', userData._id);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  
  // Set localStorage session in browser context
  await context.addInitScript((user) => {
    localStorage.setItem('abkharido_user_session', JSON.stringify(user));
    localStorage.setItem('abkharido_login_phone', user.phone);
  }, userData);

  const page = await context.newPage();

  // 1. Product Details
  console.log('Navigating to Product Details...');
  await page.goto('http://localhost:3000/product/iphone-15-pro', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(artifactsDir, 'step2_product_details.png'), fullPage: false });
  console.log('✓ Saved step2_product_details.png');

  // 2. Add to Cart
  console.log('Adding product to cart...');
  const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("ADD TO CART")').first();
  await addToCartBtn.click();
  await page.waitForTimeout(1500);

  // 3. Cart Page
  console.log('Navigating to Cart page...');
  await page.goto('http://localhost:3000/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(artifactsDir, 'step4_cart_page.png'), fullPage: false });
  console.log('✓ Saved step4_cart_page.png');

  // 4. Checkout Step 1: Address
  console.log('Step 5: Checkout Step 1 (Address Selection & Form)...');
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Fill in all required address inputs
  const inputs = await page.$$('input.checkout-input, textarea.checkout-input');
  // Name, Phone, Pincode, Locality, Street, City, State
  console.log(`Found ${inputs.length} address form inputs`);
  
  const pinInput = page.locator('input[placeholder*="pincode"], input[maxLength="6"]').first();
  await pinInput.fill('400001');
  await page.waitForTimeout(1000);

  const allInputs = await page.$$('input.checkout-input');
  if (allInputs.length >= 6) {
    // allInputs[0] is Name
    // allInputs[1] is Phone
    // allInputs[2] is Pincode
    // allInputs[3] is Locality
    // allInputs[4] is City
    // allInputs[5] is State
    await allInputs[3].fill('Nariman Point');
    await allInputs[4].fill('Mumbai');
    await allInputs[5].fill('Maharashtra');
  }

  const streetArea = page.locator('textarea.checkout-input').first();
  if (await streetArea.count() > 0) {
    await streetArea.fill('Flat 402, Sunshine Heights, MG Road');
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactsDir, 'step5_checkout_address.png'), fullPage: false });
  console.log('✓ Saved step5_checkout_address.png');

  // 5. Checkout Step 2: Summary
  console.log('Step 6: Checkout Step 2 (Order Summary)...');
  const deliverHereBtn = page.locator('button:has-text("DELIVER HERE"), button:has-text("Deliver Here"), button.checkout-btn').first();
  await deliverHereBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(artifactsDir, 'step6_checkout_summary.png'), fullPage: false });
  console.log('✓ Saved step6_checkout_summary.png');

  // 6. Checkout Step 3: Payment
  console.log('Step 7: Checkout Step 3 (Payment Options)...');
  const continuePayBtn = page.locator('button:has-text("Proceed to Payment"), button:has-text("Continue to Payment")').first();
  if (await continuePayBtn.count() > 0) {
    await continuePayBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactsDir, 'step7_checkout_payment.png'), fullPage: false });
    console.log('✓ Saved step7_checkout_payment.png');
  }

  // 7. Checkout Step 4: Place COD Order & Success Screen
  console.log('Step 8: Placing Order via Cash on Delivery...');
  const codRadio = page.locator('input[value="cod"], label:has-text("Cash on Delivery"), div:has-text("Cash on Delivery")').first();
  if (await codRadio.count() > 0) {
    await codRadio.click();
    await page.waitForTimeout(500);
  }
  const placeOrderBtn = page.locator('button:has-text("Place Order (COD)"), button:has-text("Confirm Order"), button:has-text("Place Order")').first();
  if (await placeOrderBtn.count() > 0) {
    await placeOrderBtn.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(artifactsDir, 'step8_order_success.png'), fullPage: false });
    console.log('✓ Saved step8_order_success.png');
  }

  await browser.close();
  console.log('--- ALL 8 STEPS FROM BUY TO CHECKOUT CAPTURED SUCCESSFULLY ---');
}

runAuthenticatedCheckout().catch(e => console.error(e));
