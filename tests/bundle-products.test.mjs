import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bundleCartProduct, buildAvailableBundle, bundleFitsInCart } from '../src/utils/bundleProducts.js';

const simple = (id, overrides = {}) => ({ id, name: id, category: 'electronics', status: 'published', price: 499, stock: 3, inStock: true, ...overrides });
const main = simple('real-phone', {
  _id: '507f1f77bcf86cd799439011',
  colorModels: [
    { name: 'Black', variants: [{ name: '64 GB', price: 1200, stock: 0 }] },
    { name: 'Blue', primaryImage: '/blue.png', variants: [
      { name: '64 GB', price: 1300, originalPrice: 1500, stock: 3 },
      { name: '128 GB', price: 1700, originalPrice: 2000, stock: 1 }
    ] }
  ]
});

test('bundle keeps the selected main option and catalogue prices without an extra discount', () => {
  const bundle = buildAvailableBundle(main, [simple('cable')], { selectedColor: 'Blue', selectedVariant: '128 GB' });
  assert.equal(bundle.length, 2);
  assert.deepEqual(bundle.map(item => item.price), [1700, 499]);
  assert.equal(bundle.reduce((total, item) => total + item.price, 0), 2199);
  assert.equal(bundle[0].selectedColor, 'Blue');
  assert.equal(bundle[0].selectedVariant, '128 GB');
  assert.equal(bundle[0].stock, 1);
  assert.equal(bundle[0].image, '/blue.png');
});

test('accessories come only from available published catalogue records, with no mock fallback', () => {
  const candidates = [main, simple('draft', { status: 'draft' }), simple('no-status', { status: undefined }),
    simple('archived', { isArchived: true }), simple('sold', { stock: 0 }), simple('missing-stock', { stock: undefined }),
    simple('unavailable', { inStock: false }), simple('invalid-price', { price: NaN }), simple('real-cable')];
  const bundle = buildAvailableBundle(main, candidates);
  assert.deepEqual(bundle.map(item => item.id), ['real-phone', 'real-cable']);
  assert.deepEqual(buildAvailableBundle(main, [main]), []);
  assert.deepEqual(buildAvailableBundle(main, []), []);
  assert.deepEqual(buildAvailableBundle(main, undefined), []);
});

test('accessories select an in-stock option and reject unavailable or mismatched main options', () => {
  const bundle = buildAvailableBundle(simple('charger'), [main]);
  assert.equal(bundle[1].selectedColor, 'Blue');
  assert.equal(bundle[1].selectedVariant, '64 GB');
  assert.equal(bundle[1].price, 1300);
  assert.equal(bundle[1].stock, 3);
  assert.deepEqual(buildAvailableBundle(main, [simple('cable')], { selectedColor: 'Black', selectedVariant: '64 GB' }), []);
  assert.deepEqual(buildAvailableBundle(main, [simple('cable')], { selectedColor: 'Blue', selectedVariant: 'Missing' }), []);
  assert.equal(bundleCartProduct(simple('bad-options', { colorModels: [{ name: 'Black', variants: [] }] })), null);
});

test('simple products omit synthetic options and do not invent an original price', () => {
  const result = bundleCartProduct(simple('cable'), { selectedColor: 'Default', selectedVariant: 'Default' });
  assert.equal(result.selectedColor, '');
  assert.equal(result.selectedVariant, '');
  assert.equal(result.originalPrice, result.price);
});

test('flash sale price applies only until its actual end time', () => {
  const product = simple('cable', { flashSale: { isActive: true, price: 399, endTime: '2026-10-16T00:00:00Z' } });
  assert.equal(bundleCartProduct(product, {}, Date.parse('2026-10-15T00:00:00Z')).price, 399);
  assert.equal(bundleCartProduct(product, {}, Date.parse('2026-10-17T00:00:00Z')).price, 499);
});

test('deduplicates catalogue entries and accounts for the exact option already in cart', () => {
  const bundle = buildAvailableBundle(main, [simple('cable'), simple('cable')], { selectedColor: 'Blue', selectedVariant: '128 GB' });
  assert.equal(bundle.length, 2);
  assert.equal(bundleFitsInCart(bundle, []), true);
  assert.equal(bundleFitsInCart(bundle, [{ product: bundle[0], quantity: 1 }]), false);
  assert.equal(bundleFitsInCart(bundle, [{ product: { ...bundle[0], selectedVariant: '64 GB' }, quantity: 1 }]), true);
  assert.equal(bundleFitsInCart(bundle, [{ product: bundle[1], quantity: 3 }]), false);
});
