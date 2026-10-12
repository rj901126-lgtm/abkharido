import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out = 'reports/bug-audit';
const origin = process.env.AUDIT_ORIGIN || 'http://localhost:3002';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const findings = [];
const sample = { id: 'audit-test-product', name: 'Audit test speaker', price: 379, originalPrice: 758, image: '/logo.png', category: 'electronics', stock: 5, inStock: true, status: 'published', rating: 4.5, reviewsCount: 2 };
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/products**', route => route.fulfill({ json: { products: [sample] } }));
  for (const route of ['/', '/catalog', '/product/signature-wireless-earphone']) {
    errors = [];
    const res = await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (route === '/' || route === '/catalog') {
      await page.locator('.product-card').first().waitFor({ timeout: 15000 });
    } else { await page.waitForTimeout(1000); }
    const state = await page.evaluate(() => ({ cards: document.querySelectorAll('.product-card').length, overflow: document.documentElement.scrollWidth > innerWidth, purchaseBars: [...document.querySelectorAll('.vip-fixed-bottom-purchase-bar, .mobile-sticky-cart-bar')].map(el => ({ class: el.className, visible: getComputedStyle(el).display !== 'none', bottom: Math.round(el.getBoundingClientRect().bottom), z: getComputedStyle(el).zIndex })) }));
    const status = res?.status() ?? (await fetch(`${origin}${route}`)).status;
    findings.push({ route, status, ...state, errors: [...errors] });
    await page.screenshot({ path: `${out}/${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}.png`, fullPage: true });
  }
  const saved = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const cartErrors = [];
  saved.on('pageerror', e => cartErrors.push(e.message));
  await saved.addInitScript(p => localStorage.setItem('abkharido_cart', JSON.stringify([{ ...p, product: p, quantity: 1 }])), sample);
  await saved.goto(`${origin}/cart`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await saved.locator('.cart-item-card').first().waitFor({ timeout: 15000 });
  findings.push({ route: '/cart with persisted items', errors: cartErrors, items: await saved.locator('.cart-item-card').count() });
  const session = await fetch(`${origin}/api/auth/session`, { signal: AbortSignal.timeout(15000) });
  findings.push({ route: '/api/auth/session', status: session.status, body: (await session.text()).slice(0, 160) });
} finally { await browser.close(); }
await fs.writeFile(`${out}/results.json`, JSON.stringify(findings, null, 2));
console.log(JSON.stringify(findings.map(f => ({ ...f, errors: f.errors?.map(e => e.split('\n')[0]) })), null, 2));
assert.ok(findings.find(f => f.route === '/').cards > 0, 'Homepage must render client-loaded products');
assert.ok(findings.find(f => f.route === '/catalog').cards > 0, 'Catalog must render client-loaded products');
assert.equal(findings.find(f => f.route.includes('/product/')).purchaseBars.filter(b => b.visible).length, 1, 'Mobile product must have one purchase bar');
assert.equal(findings.find(f => f.route.includes('persisted')).errors.length, 0, 'Saved cart must hydrate without page errors');
assert.equal(findings.find(f => f.route === '/api/auth/session').status, 200, 'Authentication session route must succeed');
console.log('Five regression assertions passed.');
