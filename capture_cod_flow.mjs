import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactsDir = path.join(__dirname, '..', '..', 'brain', '62f504a8-ace7-4f31-95a6-b3ac9666baaa', '.user_uploaded');

async function testCODSuccess() {
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

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  
  await context.addInitScript((user) => {
    localStorage.setItem('abkharido_user_session', JSON.stringify(user));
    localStorage.setItem('abkharido_login_phone', user.phone);
  }, userData);

  const page = await context.newPage();

  // 1. Add item
  await page.goto('http://localhost:3000/product/iphone-15-pro', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("ADD TO CART")').first();
  await addToCartBtn.click();
  await page.waitForTimeout(1500);

  // 2. Checkout
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // If form is visible, fill it
  const pinInput = page.locator('input[placeholder*="pincode"], input[maxLength="6"]').first();
  if (await pinInput.count() > 0 && await pinInput.isVisible()) {
    await pinInput.fill('400001');
    await page.waitForTimeout(600);
    const allInputs = await page.$$('input.checkout-input');
    if (allInputs.length >= 6) {
      await allInputs[3].fill('Nariman Point');
      await allInputs[4].fill('Mumbai');
      await allInputs[5].fill('Maharashtra');
    }
    const streetArea = page.locator('textarea.checkout-input').first();
    if (await streetArea.count() > 0) {
      await streetArea.fill('Flat 402, Sunshine Heights, MG Road');
    }
  }

  // 3. Deliver Here -> Summary
  const deliverHereBtn = page.locator('button:has-text("DELIVER HERE"), button:has-text("Deliver Here"), button.checkout-btn').first();
  await deliverHereBtn.click();
  await page.waitForTimeout(1500);

  // 4. Summary -> Payment (Click Proceed to Payment)
  const proceedToPay = page.locator('button:has-text("PROCEED TO PAYMENT")').first();
  await proceedToPay.click();
  await page.waitForTimeout(1500);

  // 5. Select COD radio explicitly
  const codRadio = page.locator('input[value="cod"]').first();
  await codRadio.check();
  await page.waitForTimeout(500);

  // 6. Click Place Order
  const placeOrderBtn = page.locator('button:has-text("PLACE ORDER")').first();
  await placeOrderBtn.click();
  await page.waitForTimeout(3500);

  // 7. Capture Success Screen
  await page.screenshot({ path: path.join(artifactsDir, 'step8_order_success_cod.png'), fullPage: true });
  console.log('✓ Saved step8_order_success_cod.png');

  await browser.close();
}

testCODSuccess().catch(e => console.error(e));
