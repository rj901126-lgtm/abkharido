import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../src/app/api/cart/sync/route.js', import.meta.url), 'utf8');
const line = (id, quantity = 1, options = {}) => ({ product: { id, name: id, price: 100, ...options }, quantity });

// Link every imported dependency to a synthetic module. No real auth, database,
// Next server, or provider modules are loaded or called by this test suite.
async function syncCart(existingCart, body) {
  const calls = { connect: 0, save: 0 };
  let persisted;
  const user = {
    cart: structuredClone(existingCart),
    async save() {
      calls.save++;
      persisted = JSON.parse(JSON.stringify(this.cart));
    }
  };
  const context = vm.createContext({ console: { error() {} } });
  const dependencies = {
    'next/server': { NextResponse: { json: value => JSON.parse(JSON.stringify(value)) } },
    '../../../../lib/connectDB.js': { default: async () => { calls.connect++; } },
    '../../../../../server/models/User.js': { default: {
      findById: async id => {
        assert.equal(id, 'buyer-a');
        assert.equal(calls.connect, 1);
        return user;
      }
    } },
    '../../../../lib/serverAuth.js': { getAuthenticatedUser: async () => ({ user: { id: 'buyer-a' } }) }
  };
  const route = new vm.SourceTextModule(source, { context });
  await route.link(specifier => {
    assert.ok(Object.hasOwn(dependencies, specifier), `Unexpected dependency: ${specifier}`);
    const exports = dependencies[specifier];
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
  });
  await route.evaluate();
  const response = await route.namespace.POST({ json: async () => structuredClone(body) });
  assert.equal(calls.connect, 1);
  assert.equal(calls.save, 1);
  assert.equal(response.success, true);
  assert.deepEqual(response.cart, persisted, 'Response must reflect the saved merged cart');
  assert.ok(user.cartUpdatedAt);
  return persisted;
}

test('guest merge preserves account item A and adds guest item B', async () => {
  const saved = await syncCart([line('A', 2)], { merge: true, cart: [line('B', 3)] });
  assert.deepEqual(saved, [line('A', 2), line('B', 3)]);
});

test('merging the same option keeps the maximum quantity without adding duplicates', async () => {
  const existing = line('phone', 2, { selectedColor: 'Blue', selectedVariant: '128 GB' });
  const guest = line('phone', 4, { selectedColor: ' blue ', selectedVariant: '128 gb' });
  const saved = await syncCart([existing], { merge: true, cart: [guest, { ...guest, quantity: 1 }] });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].quantity, 4);
  assert.deepEqual(saved[0].product, existing.product);
});

test('merge retains separate colors and variants of the same product', async () => {
  const blue64 = line('phone', 1, { selectedColor: 'Blue', selectedVariant: '64 GB' });
  const blue128 = line('phone', 2, { selectedColor: 'Blue', selectedVariant: '128 GB' });
  const black64 = line('phone', 3, { selectedColor: 'Black', selectedVariant: '64 GB' });
  assert.deepEqual(await syncCart([blue64], { merge: true, cart: [blue128, black64] }), [blue64, blue128, black64]);
});

test('an empty guest merge retains the account cart', async () => {
  assert.deepEqual(await syncCart([line('A', 2)], { merge: true, cart: [] }), [line('A', 2)]);
});

test('explicit clear empties the account cart even when merge and items are supplied', async () => {
  assert.deepEqual(await syncCart([line('A')], { action: 'clear', merge: true, cart: [line('B')] }), []);
});

test('normal full sync replaces the account cart and keeps maximum duplicate quantity', async () => {
  assert.deepEqual(await syncCart([line('A')], { cart: [line('B', 1), line('B', 3)] }), [line('B', 3)]);
  assert.deepEqual(await syncCart([line('A')], { merge: false, cart: [] }), []);
});
