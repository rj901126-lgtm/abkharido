import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactsDir = path.join(__dirname, '..', '..', 'brain', '62f504a8-ace7-4f31-95a6-b3ac9666baaa', '.user_uploaded');

if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

async function capture() {
  console.log('Connecting to browser and starting visual audit capture...');
  const browser = await chromium.launch({ headless: true });
  
  // Viewports to test
  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile', width: 375, height: 812 }
  ];

  for (const vp of viewports) {
    console.log(`\n=== Capturing ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    // 1. Homepage
    try {
      console.log('Navigating to Homepage...');
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      const homeImg = path.join(artifactsDir, `audit_${vp.name}_home.png`);
      await page.screenshot({ path: homeImg, fullPage: false });
      console.log(`✓ Saved ${homeImg}`);
    } catch (e) {
      console.error('Homepage error:', e.message);
    }

    // 2. Categories
    try {
      console.log('Navigating to Categories...');
      await page.goto('http://localhost:3000/categories', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      const catImg = path.join(artifactsDir, `audit_${vp.name}_categories.png`);
      await page.screenshot({ path: catImg, fullPage: false });
      console.log(`✓ Saved ${catImg}`);
    } catch (e) {
      console.error('Categories error:', e.message);
    }

    // 3. Product Details
    try {
      console.log('Navigating to Product Details...');
      await page.goto('http://localhost:3000/product/p1', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      const prodImg = path.join(artifactsDir, `audit_${vp.name}_product.png`);
      await page.screenshot({ path: prodImg, fullPage: false });
      console.log(`✓ Saved ${prodImg}`);
    } catch (e) {
      console.error('Product error:', e.message);
    }

    // 4. Cart Page
    try {
      console.log('Navigating to Cart Page...');
      await page.goto('http://localhost:3000/cart', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      const cartImg = path.join(artifactsDir, `audit_${vp.name}_cart.png`);
      await page.screenshot({ path: cartImg, fullPage: false });
      console.log(`✓ Saved ${cartImg}`);
    } catch (e) {
      console.error('Cart error:', e.message);
    }

    // 5. Checkout Page
    try {
      console.log('Navigating to Checkout...');
      await page.goto('http://localhost:3000/checkout', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      const checkImg = path.join(artifactsDir, `audit_${vp.name}_checkout.png`);
      await page.screenshot({ path: checkImg, fullPage: false });
      console.log(`✓ Saved ${checkImg}`);
    } catch (e) {
      console.error('Checkout error:', e.message);
    }

    // 6. Orders Page
    try {
      console.log('Navigating to Orders...');
      await page.goto('http://localhost:3000/orders', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      const ordersImg = path.join(artifactsDir, `audit_${vp.name}_orders.png`);
      await page.screenshot({ path: ordersImg, fullPage: false });
      console.log(`✓ Saved ${ordersImg}`);
    } catch (e) {
      console.error('Orders error:', e.message);
    }

    // 7. Profile Page
    try {
      console.log('Navigating to Profile...');
      await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      const profImg = path.join(artifactsDir, `audit_${vp.name}_profile.png`);
      await page.screenshot({ path: profImg, fullPage: false });
      console.log(`✓ Saved ${profImg}`);
    } catch (e) {
      console.error('Profile error:', e.message);
    }

    // 8. Admin Page Unlock
    try {
      console.log('Navigating to Admin...');
      await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      const adminPinImg = path.join(artifactsDir, `audit_${vp.name}_admin_pin.png`);
      await page.screenshot({ path: adminPinImg, fullPage: false });
      console.log(`✓ Saved ${adminPinImg}`);

      // Try entering PIN 2026
      const pinInputs = await page.$$('input[type="password"], input[type="text"]');
      if (pinInputs.length >= 4) {
        await pinInputs[0].fill('2');
        await pinInputs[1].fill('0');
        await pinInputs[2].fill('2');
        await pinInputs[3].fill('6');
        await page.waitForTimeout(2000);
        const adminDashImg = path.join(artifactsDir, `audit_${vp.name}_admin_dashboard.png`);
        await page.screenshot({ path: adminDashImg, fullPage: false });
        console.log(`✓ Saved ${adminDashImg}`);
      }
    } catch (e) {
      console.error('Admin error:', e.message);
    }

    await context.close();
  }

  await browser.close();
  console.log('\nVisual Capture complete!');
}

capture().catch(err => {
  console.error('Capture script error:', err);
  process.exit(1);
});
