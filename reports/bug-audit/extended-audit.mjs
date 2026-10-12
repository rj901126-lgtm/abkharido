import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const parser = require('next/dist/compiled/babel/bundle').parser();
const syntax = { checked: 0, failures: [] };
const origin = process.env.AUDIT_ORIGIN || 'http://localhost:3002';
async function walk(dir) {
  const files = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) files.push(...await walk(path.join(dir, e.name)));
    else if (/\.(jsx?|mjs|cjs)$/.test(e.name)) files.push(path.join(dir, e.name));
  }
  return files;
}
for (const file of [...await walk('src'), ...await walk('server'), ...await walk('api')]) {
  syntax.checked++;
  try { parser.parse(await fs.readFile(file, 'utf8'), { sourceType: 'unambiguous', plugins: ['jsx'] }); }
  catch (e) { syntax.failures.push({ file, error: e.message }); }
}
const routes = (await walk('src/app')).filter(f => /[\\/]page\.jsx$/.test(f)).map(f => '/' + path.relative('src/app', path.dirname(f)).split(path.sep).filter(Boolean).join('/')).filter(r => !r.includes('['));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
const additional = [];
const product = { id: 'audit-product', name: 'Audit Speaker', price: 379, stock: 20, inStock: true, status: 'published', category: 'electronics', image: '/logo.png' };
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(15000);
  let errors = [];
  page.on('pageerror', e => errors.push(e.message.split('\n')[0]));
  await page.route('**/api/products**', route => route.fulfill({ json: { products: [product] } }));
  for (const route of routes) {
    errors = [];
    try {
      const res = await fetch(`${origin}${route}`, { signal: AbortSignal.timeout(8000) });
      await res.text();
      results.push({ route, status: res.status, url: res.url, check: 'HTTP smoke test; browser interactions not covered' });
    } catch (e) { results.push({ route, error: e.message.split('\n')[0] }); }
    await fs.writeFile('reports/bug-audit/extended-results.json', JSON.stringify({ syntax, results, additional }, null, 2));
    if (results.length % 10 === 0) console.log(`Reviewed ${results.length}/${routes.length} page routes`);
  }
  const variants = await browser.newPage();
  variants.setDefaultTimeout(15000);
  await variants.addInitScript(p => localStorage.setItem('abkharido_cart', JSON.stringify([
    { product: { ...p, selectedColor: 'Red' }, quantity: 1 },
    { product: { ...p, selectedColor: 'Blue' }, quantity: 2 }
  ])), product);
  await variants.goto(`${origin}/cart`, { waitUntil: 'domcontentloaded' });
  await variants.locator('.cart-item-card').first().waitFor({ timeout: 15000 });
  const before = await variants.locator('.qty-input').evaluateAll(es => es.map(e => e.value));
  await variants.locator('.cart-item-card').first().locator('.qty-btn').last().click();
  const after = await variants.locator('.qty-input').evaluateAll(es => es.map(e => e.value));
  await variants.locator('.cart-item-card').first().getByRole('button', { name: /Remove/ }).click();
  additional.push({ issue: 'Cart variant isolation', before, afterIncreasingFirst: after, remainingAfterRemovingFirst: await variants.locator('.cart-item-card').count() });
  const receipt = await browser.newPage();
  await receipt.route('**/api/payments/cashfree/verify?**', route => route.fulfill({ json: { success: true, status: 'PAID', orderId: 'audit-paid-order' } }));
  await receipt.goto(`${origin}/checkout/return?order_id=audit-paid-order`, { waitUntil: 'domcontentloaded' });
  await receipt.getByRole('heading', { name: 'Order Placed Successfully!' }).waitFor({ timeout: 15000 });
  additional.push({ issue: 'Payment receipt contract', showsZeroAmount: (await receipt.locator('body').innerText()).includes('₹0') });
} finally { await browser.close(); }
await fs.writeFile('reports/bug-audit/extended-results.json', JSON.stringify({ syntax, results, additional }, null, 2));
console.log(JSON.stringify({ syntax, routesChecked: results.length, routeProblems: results.filter(r => r.error || r.status >= 400 || r.overflow || r.errors?.length), additional }, null, 2));
