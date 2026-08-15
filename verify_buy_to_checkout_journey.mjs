import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactsDir = path.join(__dirname, '..', '..', 'brain', '62f504a8-ace7-4f31-95a6-b3ac9666baaa', '.user_uploaded');

async function testFullBuyToCheckoutJourney() {
  console.log('--- STARTING BUY TO CHECKOUT STEP-BY-STEP UI AUDIT ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 0. Login
    console.log('Logging in with test account 9172600587...');
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
      } else {
        const singleOtp = page.locator('input[placeholder*="OTP"]').first();
        if (await singleOtp.count() > 0) await singleOtp.fill('123456');
      }
      const verifyBtn = page.locator('button:has-text("Verify"), button:has-text("Submit")').first();
      if (await verifyBtn.count() > 0) {
        await verifyBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // Step 1: Homepage
    console.log('Step 1: Capturing Homepage...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactsDir, 'step1_homepage.png'), fullPage: false });
    console.log('✓ Saved step1_homepage.png');

    // Step 2: Product Details Page
    console.log('Step 2: Navigating to Product Details Page...');
    // Click first product card or direct navigate
    const productCard = page.locator('.product-card, div[style*="cursor: pointer"]').first();
    if (await productCard.count() > 0) {
      await productCard.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto('http://localhost:3000/product/p1', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: path.join(artifactsDir, 'step2_product_details.png'), fullPage: false });
    console.log('✓ Saved step2_product_details.png');

    // Step 3: Add to Cart & Cart Drawer
    console.log('Step 3: Clicking Add to Cart...');
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("ADD TO CART")').first();
    if (await addToCartBtn.count() > 0) {
      await addToCartBtn.click();
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: path.join(artifactsDir, 'step3_cart_drawer.png'), fullPage: false });
    console.log('✓ Saved step3_cart_drawer.png');

    // Step 4: Full Cart Page
    console.log('Step 4: Navigating to Full Cart Page...');
    await page.goto('http://localhost:3000/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactsDir, 'step4_cart_page.png'), fullPage: false });
    console.log('✓ Saved step4_cart_page.png');

    // Step 5: Checkout Step 1 (Address Entry & Selection)
    console.log('Step 5: Navigating to Checkout Step 1 (Address)...');
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Fill in pincode and street address if empty
    const pincodeInput = page.locator('input[placeholder*="Pincode"], input[name="pincode"]').first();
    if (await pincodeInput.count() > 0) {
      await pincodeInput.fill('400001');
      await page.waitForTimeout(1000);
    }
    const addressInput = page.locator('input[placeholder*="Flat"], input[placeholder*="Address"], textarea').first();
    if (await addressInput.count() > 0) {
      await addressInput.fill('Flat 402, Sunshine Heights, MG Road');
    }

    await page.screenshot({ path: path.join(artifactsDir, 'step5_checkout_address.png'), fullPage: false });
    console.log('✓ Saved step5_checkout_address.png');

    // Step 6: Proceed to Step 2 (Order Summary)
    console.log('Step 6: Proceeding to Checkout Step 2 (Summary)...');
    const continueToSummaryBtn = page.locator('button:has-text("Deliver Here"), button:has-text("Proceed to Order Summary"), button:has-text("Continue to Summary")').first();
    if (await continueToSummaryBtn.count() > 0) {
      await continueToSummaryBtn.click();
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: path.join(artifactsDir, 'step6_checkout_summary.png'), fullPage: false });
    console.log('✓ Saved step6_checkout_summary.png');

    // Step 7: Proceed to Step 3 (Payment Method)
    console.log('Step 7: Proceeding to Checkout Step 3 (Payment Options)...');
    const continueToPaymentBtn = page.locator('button:has-text("Proceed to Payment"), button:has-text("Continue to Payment")').first();
    if (await continueToPaymentBtn.count() > 0) {
      await continueToPaymentBtn.click();
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: path.join(artifactsDir, 'step7_checkout_payment.png'), fullPage: false });
    console.log('✓ Saved step7_checkout_payment.png');

    // Step 8: Place Order (Cash on Delivery) & Capture Success Screen
    console.log('Step 8: Placing Order via Cash on Delivery...');
    const codOption = page.locator('input[value="cod"], label:has-text("Cash on Delivery"), div:has-text("Cash on Delivery")').first();
    if (await codOption.count() > 0) {
      await codOption.click();
      await page.waitForTimeout(500);
    }

    const placeOrderBtn = page.locator('button:has-text("Place Order (COD)"), button:has-text("Confirm Order"), button:has-text("Place Order")').first();
    if (await placeOrderBtn.count() > 0) {
      await placeOrderBtn.click();
      await page.waitForTimeout(3500); // Wait for order placement & confetti
    }
    await page.screenshot({ path: path.join(artifactsDir, 'step8_order_success.png'), fullPage: false });
    console.log('✓ Saved step8_order_success.png');

    console.log('--- BUY TO CHECKOUT STEP AUDIT COMPLETE ---');
  } catch (err) {
    console.error('Error during step audit:', err);
  } finally {
    await browser.close();
  }
}

testFullBuyToCheckoutJourney().catch(e => console.error(e));
