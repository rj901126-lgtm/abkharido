import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

async function sellerOrders(order) {
  const context = vm.createContext({ console: { error() {} } });
  const dependencies = {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ status: options.status || 200, body }) } },
    '../../../../lib/serverAuth.js': { getAuthenticatedUser: async () => ({ isAuthenticated: true, isSeller: true, user: { id: 'merchant-a' } }) },
    '../../../../lib/connectDB.js': { default: async () => {} },
    '../../../../../server/models/Order.js': { default: { find: () => ({ sort: () => ({ limit: async () => [order] }) }) } },
    '../../../../../server/models/User.js': { default: { findById: async () => ({ toObject: () => ({ shopName: 'Merchant A', sellerType: 'non_gst' }) }) } },
    '../../../../../server/models/Settlement.js': { default: {} }
  };
  const module = new vm.SourceTextModule(await readFile(new URL('../src/app/api/seller/orders/route.js', import.meta.url), 'utf8'), { context });
  await module.link(specifier => {
    assert.ok(Object.hasOwn(dependencies, specifier));
    const values = dependencies[specifier];
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return module.namespace.GET({});
}

test('seller invoice data retains marketplace identity for the seller-owned items', async () => {
  const result = await sellerOrders({
    _id: 'order-a', status: 'Placed', paymentMethod: 'Cash on Delivery',
    orderItems: [
      { name: 'Phone', vendorId: 'merchant-a', sellerShopName: 'Original Merchant A', fulfillmentChannel: '3P', price: 500, qty: 1 },
      { name: 'Cable', vendorId: 'merchant-b', price: 100, qty: 1 }
    ]
  });
  assert.equal(result.status, 200);
  const items = result.body.orders[0].orderItems;
  assert.equal(items.length, 1);
  assert.equal(items[0].vendorId, 'merchant-a');
  assert.equal(items[0].sellerShopName, 'Original Merchant A');
  assert.equal(items[0].fulfillmentChannel, '3P');
});

test('legacy order-level seller identity is retained and explicit direct fulfillment is preserved', async () => {
  const result = await sellerOrders({
    _id: 'legacy-order', vendorId: 'merchant-a', status: 'Placed',
    orderItems: [{ name: 'Phone', fulfillmentChannel: '1P', price: 500, qty: 1 }]
  });
  const item = result.body.orders[0].orderItems[0];
  assert.equal(item.vendorId, 'merchant-a');
  assert.equal(item.sellerShopName, 'Merchant A');
  assert.equal(item.fulfillmentChannel, '1P');
});
