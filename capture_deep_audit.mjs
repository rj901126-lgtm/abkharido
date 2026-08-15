import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactsDir = path.join(__dirname, '..', '..', 'brain', '62f504a8-ace7-4f31-95a6-b3ac9666baaa', '.user_uploaded');

async function deepCapture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('=== Step 1: Login with Test Account ===');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  
  // Fill phone number
  const phoneInput = page.locator('input[type="tel"], input[placeholder*="Mobile"], input[placeholder*="Phone"]').first();
  if (await phoneInput.count() > 0) {
    await phoneInput.fill('9172600587');
    const getOtpBtn = page.locator('button:has-text("Get OTP"), button:has-text("Continue")').first();
    await getOtpBtn.click();
    await page.waitForTimeout(2000);
    
    // Fill OTP digits
    const otpInputs = await page.$$('input[type="text"], input[type="tel"], input[inputmode="numeric"]');
    if (otpInputs.length >= 6) {
      for (let i = 0; i < 6; i++) {
        await otpInputs[i].fill(String(i + 1)); // 123456
      }
    } else {
      const singleOtp = page.locator('input[placeholder*="OTP"], input[maxLength="6"]').first();
      if (await singleOtp.count() > 0) {
        await singleOtp.fill('123456');
      }
    }
    const verifyBtn = page.locator('button:has-text("Verify"), button:has-text("Submit")').first();
    if (await verifyBtn.count() > 0) {
      await verifyBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // Capture Authenticated Profile
  await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactsDir, 'audit_profile_authenticated.png'), fullPage: true });
  console.log('✓ Saved audit_profile_authenticated.png');

  // Capture Authenticated Orders
  await page.goto('http://localhost:3000/orders', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactsDir, 'audit_orders_authenticated.png'), fullPage: true });
  console.log('✓ Saved audit_orders_authenticated.png');

  // Go to Admin and Unlock with PIN 2026
  console.log('=== Step 2: Unlock Admin Dashboard ===');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const pinInput = page.locator('input[type="password"]').first();
  if (await pinInput.count() > 0) {
    await pinInput.fill('2026');
    const unlockBtn = page.locator('button:has-text("UNLOCK INVENTORY CONTROL")').first();
    await unlockBtn.click();
    await page.waitForTimeout(2500);
  }

  // Capture Admin Main View
  await page.screenshot({ path: path.join(artifactsDir, 'audit_admin_main.png'), fullPage: true });
  console.log('✓ Saved audit_admin_main.png');

  // Switch to different tabs in Admin Dashboard
  const tabs = [
    { name: 'oms', label: 'Orders (OMS)' },
    { name: 'crm', label: 'CRM & Abandoned' },
    { name: 'finance', label: 'Finance & Payouts' },
    { name: 'coupons', label: 'Coupons' },
    { name: 'helpdesk', label: 'Helpdesk' },
    { name: 'staff', label: 'Staff Management' },
    { name: 'studio', label: 'Product Studio' },
    { name: 'promotions', label: 'Promotions' }
  ];

  for (const t of tabs) {
    try {
      const tabBtn = page.locator(`button:has-text("${t.label}"), div[role="button"]:has-text("${t.label}")`).first();
      if (await tabBtn.count() > 0) {
        await tabBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(artifactsDir, `audit_admin_${t.name}.png`), fullPage: false });
        console.log(`✓ Saved audit_admin_${t.name}.png`);
      }
    } catch (e) {
      console.warn(`Could not capture tab ${t.name}:`, e.message);
    }
  }

  await browser.close();
  console.log('Deep capture finished!');
}

deepCapture().catch(e => console.error(e));
