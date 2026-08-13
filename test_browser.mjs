import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactsDir = path.join(__dirname, '..', 'brain', '62f504a8-ace7-4f31-95a6-b3ac9666baaa', '.user_uploaded');

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  try {
    // 1. Visit Home Page
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Take screenshot of home page
    const homeScreenshot = path.join(artifactsDir, `media_${Date.now()}_home.png`);
    await page.screenshot({ path: homeScreenshot, fullPage: true });
    console.log(`[Screenshot] Home page saved to ${homeScreenshot}`);

    // Click on a product card
    console.log('Clicking on a product...');
    await page.waitForSelector('.product-card', { timeout: 10000 });
    const productLinks = await page.$$('.product-card');
    if (productLinks.length > 0) {
      await productLinks[0].click();
      await page.waitForLoadState('networkidle');
    }

    // Screenshot product page
    const productScreenshot = path.join(artifactsDir, `media_${Date.now()}_product.png`);
    await page.screenshot({ path: productScreenshot, fullPage: true });
    console.log(`[Screenshot] Product page saved to ${productScreenshot}`);

    // Click Add to Cart
    console.log('Adding item to cart...');
    try {
      const addToCartBtn = page.locator('button:has-text("Add to Cart"), button.add-to-cart-btn').first();
      await addToCartBtn.click();
      await page.waitForTimeout(2000); // Wait for toast/state update
    } catch (e) {
      console.log('Could not find Add to Cart button', e.message);
    }

    // Go to Checkout
    console.log('Navigating to Checkout...');
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' });

    // Screenshot Checkout page
    const checkoutScreenshot = path.join(artifactsDir, `media_${Date.now()}_checkout.png`);
    await page.screenshot({ path: checkoutScreenshot, fullPage: true });
    console.log(`[Screenshot] Checkout page saved to ${checkoutScreenshot}`);

    console.log('Browser test completed successfully.');
  } catch (error) {
    console.error('Error during browser test:', error);
  } finally {
    await browser.close();
  }
}

run();
