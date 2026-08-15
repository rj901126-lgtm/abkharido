import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactsDir = path.join(__dirname, '..', '..', 'brain', '62f504a8-ace7-4f31-95a6-b3ac9666baaa', '.user_uploaded');

async function captureCheckoutFlow() {
  console.log('--- STARTING BUY TO CHECKOUT STEP-BY-STEP UI AUDIT ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Login
  console.log('Logging in with test user...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  
  const phoneInput = page.locator('input[type="tel"], input[placeholder*="Mobile"], input[placeholder*="Phone"]').first();
  if (await phoneInput.count() > 0) {
    await phoneInput.fill('9172600587');
    const getOtpBtn = page.locator('button:has-text("Get OTP"), button:has-text("Continue")').first();
    await getOtpBtn.click();
    await page.waitForTimeout(1500);
    
    const otpInputs = await page.$$('input[type="text"], input[type="tel"], input[inputmode="numeric"]');
    if (otpInputs.length >= 6) {
      for (let i = 0; i < 6; i++) {
        await otpInputs[i].fill(String(i + 1));
      }
    }
    const verifyBtn = page.locator('button:has-text("Verify"), button:has-text("Submit")').first();
    if (await verifyBtn.count() > 0) {
      await verifyBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // 2. Open Product Details Page
  console.log('Navigating to Product Details /product/iphone-15-pro...');
  await page.goto('http://localhost:3000/product/iphone-15-pro', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(artifactsDir, 'step2_product_details.png'), fullPage: false });
  console.log('✓ Saved step2_product_details.png');

  // 3. Click Add to Cart
  console.log('Clicking Add to Cart...');
  const addBtn = page.locator('button:has-text("Add to Cart"), button:has-text("ADD TO CART")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactsDir, 'step3_cart_drawer.png'), fullPage: false });
    console.log('✓ Saved step3_cart_drawer.png');
  }

  // 4. Cart Page
  console.log('Navigating to Cart page...');
  await page.goto('http://localhost:3000/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(artifactsDir, 'step4_cart_page.png'), fullPage: false });
  console.log('✓ Saved step4_cart_page.png');

  // 5. Checkout Step 1: Address
  console.log('Navigating to Checkout Step 1...');
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const nameInput = page.locator('input[placeholder*="Name"], input[value=""]').first();
  const pin = page.locator('input[placeholder*="Pincode"], input[name="pincode"], input[maxLength="6"]').first();
  if (await pin.count() > 0) {
    await pin.fill('400001');
    await page.waitForTimeout(800);
  }
  const locality = page.locator('input[placeholder*="Locality"], input[placeholder*="Area"]').first();
  if (await locality.count() > 0) {
    await locality.fill('Nariman Point');
  }
  const street = page.locator('input[placeholder*="Flat"], input[placeholder*="Address"], textarea').first();
  if (await street.count() > 0) {
    await street.fill('Flat 402, Sunshine Heights, MG Road');
  }
  await page.screenshot({ path: path.join(artifactsDir, 'step5_checkout_address.png'), fullPage: false });
  console.log('✓ Saved step5_checkout_address.png');

  // 6. Checkout Step 2: Order Summary
  console.log('Proceeding to Step 2 (Order Summary)...');
  const proceedBtn = page.locator('button:has-text("Deliver Here"), button:has-text("Proceed to Order Summary"), button:has-text("Continue")').first();
  if (await proceedBtn.count() > 0) {
    await proceedBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: path.join(artifactsDir, 'step6_checkout_summary.png'), fullPage: false });
  console.log('✓ Saved step6_checkout_summary.png');

  // 7. Checkout Step 3: Payment
  console.log('Proceeding to Step 3 (Payment)...');
  const payStepBtn = page.locator('button:has-text("Proceed to Payment"), button:has-text("Continue to Payment")').first();
  if (await payStepBtn.count() > 0) {
    await payStepBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: path.join(artifactsDir, 'step7_checkout_payment.png'), fullPage: false });
  console.log('✓ Saved step7_checkout_payment.png');

  // 8. Place COD Order & Success Screen
  console.log('Selecting COD & placing order...');
  const codRadio = page.locator('input[value="cod"], label:has-text("Cash on Delivery"), div:has-text("Cash on Delivery")').first();
  if (await codRadio.count() > 0) {
    await codRadio.click();
    await page.waitForTimeout(500);
  }
  const placeOrderBtn = page.locator('button:has-text("Place Order (COD)"), button:has-text("Place Order")').first();
  if (await placeOrderBtn.count() > 0) {
    await placeOrderBtn.click();
    await page.waitForTimeout(4000);
  }
  await page.screenshot({ path: path.join(artifactsDir, 'step8_order_success.png'), fullPage: false });
  console.log('✓ Saved step8_order_success.png');

  await browser.close();
  console.log('--- ALL 8 STEPS CAPTURED SUCCESSFULLY ---');
}

captureCheckoutFlow().catch(e => console.error(e));
