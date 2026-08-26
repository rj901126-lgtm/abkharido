import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactsDir = path.join(__dirname, '..', '..', 'brain', '62f504a8-ace7-4f31-95a6-b3ac9666baaa');

async function runProductionScan() {
  console.log('==================================================');
  console.log('🚀 STARTING FULL APP PRODUCTION AUDIT & LIVE SCAN');
  console.log('==================================================');

  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const warnings = [];

  // 1. MOBILE VIEWPORT AUDIT (390 x 844)
  console.log('\n--- 📱 AUDITING MOBILE VIEWPORT (390 x 844) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
  });

  const mobilePage = await mobileContext.newPage();
  
  mobilePage.on('pageerror', err => {
    errors.push(`[Mobile PageError]: ${err.message}`);
    console.error(`❌ [Mobile PageError]:`, err.message);
  });
  mobilePage.on('console', msg => {
    if (msg.type() === 'error') {
      warnings.push(`[Mobile Console Error]: ${msg.text()}`);
    }
  });

  const mobileRoutes = [
    { path: '/', name: 'Home' },
    { path: '/categories', name: 'Categories' },
    { path: '/cart', name: 'Cart' },
    { path: '/checkout', name: 'Checkout' },
    { path: '/login', name: 'Login' },
    { path: '/profile', name: 'Profile' },
    { path: '/rewards', name: 'Rewards / Coins' },
    { path: '/support', name: 'Support' }
  ];

  for (const r of mobileRoutes) {
    console.log(`Checking Mobile: ${r.name} (${r.path})...`);
    try {
      const response = await mobilePage.goto(`http://localhost:3000${r.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response ? response.status() : 'unknown';
      console.log(`  -> Status: ${status}`);

      // Check for horizontal overflow (broken layout on mobile)
      const hasHorizontalOverflow = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      if (hasHorizontalOverflow) {
        console.warn(`  ⚠️ Layout Warning: ${r.name} has horizontal scroll overflow on mobile.`);
        warnings.push(`Horizontal overflow detected on ${r.name} (${r.path}) on mobile screen`);
      } else {
        console.log(`  ✓ Mobile Layout Width Aligned (No overflow).`);
      }

      await mobilePage.waitForTimeout(1000);
      const imgPath = path.join(artifactsDir, `mobile_${r.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`);
      await mobilePage.screenshot({ path: imgPath, fullPage: false });
      console.log(`  📸 Screenshot saved: ${path.basename(imgPath)}`);
    } catch (err) {
      console.error(`  ❌ Error loading ${r.name}:`, err.message);
      errors.push(`Failed to load mobile route ${r.path}: ${err.message}`);
    }
  }

  await mobileContext.close();

  // 2. DESKTOP & ADMIN AUDIT (1440 x 900)
  console.log('\n--- 💻 AUDITING DESKTOP & ADMIN DASHBOARD (1440 x 900) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  await desktopContext.addInitScript(() => {
    sessionStorage.setItem('abkharido_admin_token', 'admin_jwt_enterprise_mock_2026');
    sessionStorage.setItem('adminToken', 'admin_jwt_enterprise_mock_2026');
    localStorage.setItem('adminToken', 'admin_jwt_enterprise_mock_2026');
    localStorage.setItem('abkharido_user_session', JSON.stringify({
      _id: 'admin_64b7f8902',
      id: 'admin_64b7f8902',
      fullName: 'Chief Operations Officer',
      role: 'super_admin',
      isAdmin: true,
      email: 'admin@abkharido.com'
    }));
  });

  const desktopPage = await desktopContext.newPage();
  desktopPage.on('pageerror', err => {
    errors.push(`[Desktop PageError]: ${err.message}`);
    console.error(`❌ [Desktop PageError]:`, err.message);
  });

  console.log('Checking Desktop Admin Dashboard (/admin)...');
  try {
    await desktopPage.goto('http://localhost:3000/admin', { waitUntil: 'networkidle', timeout: 15000 });
    await desktopPage.waitForTimeout(2000);

    const adminTabs = [
      { tab: 'orders', name: 'Orders' },
      { tab: 'inventory', name: 'Products_Inventory' },
      { tab: 'users', name: 'Users_Sellers' },
      { tab: 'finance', name: 'Finance' },
      { tab: 'coupons', name: 'Coupons' },
      { tab: 'cms', name: 'CMS_Homepage' }
    ];

    for (const t of adminTabs) {
      console.log(`Checking Admin Tab: ${t.name}...`);
      const navItem = desktopPage.locator(`.admin-nav-item:has-text("${t.name.split('_')[0]}"), div:has-text("${t.name.split('_')[0]}")`).first();
      if (await navItem.count() > 0) {
        await navItem.click().catch(() => {});
        await desktopPage.waitForTimeout(1500);
      }
      const adminImgPath = path.join(artifactsDir, `admin_tab_${t.name.toLowerCase()}.png`);
      await desktopPage.screenshot({ path: adminImgPath, fullPage: false });
      console.log(`  📸 Screenshot saved: ${path.basename(adminImgPath)}`);
    }
  } catch (err) {
    console.error(`  ❌ Error loading Admin:`, err.message);
    errors.push(`Admin Dashboard Error: ${err.message}`);
  }

  await desktopContext.close();
  await browser.close();

  console.log('\n==================================================');
  console.log('📊 AUDIT SUMMARY:');
  console.log(`Total Errors: ${errors.length}`);
  console.log(`Total Warnings: ${warnings.length}`);
  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(e => console.log('  -', e));
  }
  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.slice(0, 10).forEach(w => console.log('  -', w));
  }
  console.log('==================================================');
}

runProductionScan().catch(err => {
  console.error('Fatal scan error:', err);
  process.exit(1);
});
