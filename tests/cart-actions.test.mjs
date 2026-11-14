import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import { selectCartProduct } from '../src/utils/cartSelection.js';

const source = await readFile(new URL('../src/context/AppContext.jsx', import.meta.url), 'utf8');
const helpers = source.slice(source.indexOf('export const isSameProduct'), source.indexOf('export const useApp')).replaceAll('export const ', 'const ');
const actions = source.slice(source.indexOf('  const addToCart ='), source.indexOf('  // --- Logout Action ---'));
const product = (color, variant, overrides = {}) => ({ id: 'phone', name: 'Phone', selectedColor: color, selectedVariant: variant, stock: 8, ...overrides });

function createCart(items = []) {
  let cart = structuredClone(items);
  const calls = [], toasts = [];
  const methods = vm.runInNewContext(`${helpers}\n${actions}\n({ addToCart, updateCartQty, removeFromCart });`, {
    setCart: update => { cart = typeof update === 'function' ? update(cart) : update; },
    currentUser: null, localStorage: { setItem() {}, removeItem() {} },
    dispatchDeltaSync: (...args) => calls.push(args),
    showToast: (...args) => toasts.push(args),
    lastAddToCartTimestamp: { current: {} }
  });
  return { ...methods, cart: () => JSON.parse(JSON.stringify(cart)), calls, toasts };
}

test('quantity changes and removals affect only the selected color and variant', () => {
  const black = product('Black', '128 GB'), blue = product('Blue', '128 GB'), large = product('Black', '256 GB');
  const state = createCart([black, blue, large].map(product => ({ product, quantity: 1 })));
  state.updateCartQty(blue, 3);
  assert.deepEqual(state.cart().map(item => item.quantity), [1, 3, 1]);
  state.removeFromCart(black);
  assert.deepEqual(state.cart().map(item => item.product.selectedColor), ['Blue', 'Black']);
  assert.equal(state.cart()[1].product.selectedVariant, '256 GB');
  state.updateCartQty(large, 0);
  assert.equal(state.cart().length, 1);
  assert.equal(state.cart()[0].product.selectedColor, 'Blue');
});

test('legacy scalar removal still removes every option of a deleted product', () => {
  const state = createCart([
    { product: product('Black', '128 GB'), quantity: 1 },
    { product: product('Blue', '128 GB'), quantity: 2 },
    { product: { id: 'cable', stock: 5 }, quantity: 1 }
  ]);
  state.removeFromCart('phone');
  assert.deepEqual(state.cart().map(item => item.product.id), ['cable']);
});

test('zero stock and excessive initial quantities cannot be added or reported as success', () => {
  for (const [stock, qty] of [[0, 1], [2, 3], [2, 1.5]]) {
    const state = createCart();
    state.addToCart(product('Blue', '128 GB', { stock }), qty);
    assert.equal(state.cart().length, 0);
    assert.equal(state.calls.length, 0);
    assert.equal(state.toasts.some(([, type]) => type === 'success'), false);
  }
});

test('successful adds preserve option data in the synchronized cart', () => {
  const state = createCart();
  const selected = product('Blue', '256 GB', { price: 1500 });
  state.addToCart(selected, 2);
  assert.deepEqual(state.cart(), [{ product: selected, quantity: 2 }]);
  assert.equal(state.calls[0][1].cart[0].product.selectedVariant, '256 GB');
  assert.equal(state.toasts[0][1], 'success');
});

test('quick add selects an available variant with its actual price, stock, MRP and image', () => {
  const item = { id: 'phone', price: 100, stock: 99, colorModels: [{ name: 'Blue', primaryImage: '/blue.jpg', variants: [
    { name: '64 GB', stock: 0, price: 500, originalPrice: 600 },
    { name: '128 GB', stock: 2, price: 800, originalPrice: 950 }
  ] }] };
  const selected = selectCartProduct(item, 'Blue');
  assert.equal(selected.selectedVariant, '128 GB');
  assert.equal(selected.price, 800);
  assert.equal(selected.originalPrice, 950);
  assert.equal(selected.stock, 2);
  assert.equal(selected.image, '/blue.jpg');
});

test('quick add applies only active flash-sale prices and retains sold-out stock', () => {
  const now = Date.parse('2026-11-09T00:00:00Z');
  const item = { id: 'cable', price: 500, stock: 0, flashSale: { isActive: true, price: 299, endTime: '2026-11-10T00:00:00Z' } };
  assert.equal(selectCartProduct(item, undefined, now).price, 299);
  assert.equal(selectCartProduct(item, undefined, now).stock, 0);
  assert.equal(selectCartProduct(item, undefined, now + 2 * 86400000).price, 500);
});

test('cart UI callers pass the selected product instead of a product-wide id', async () => {
  for (const file of ['src/views/CartPage.jsx', 'src/components/CartDrawer.jsx', 'src/views/ProductDetails.jsx', 'src/components/ProductCard.jsx']) {
    const content = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(content, /updateCartQty\((?:prodId|targetId|cartItem\.product\.id)/, file);
    assert.doesNotMatch(content, /removeFromCart\(prodId\)/, file);
  }
});
