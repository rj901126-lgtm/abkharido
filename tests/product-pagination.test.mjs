import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fetchAllProducts } from '../src/utils/fetchProducts.js';

test('catalog collects every result with supported page sizes and preserves filters and order', async () => {
  const all = Array.from({ length: 117 }, (_, id) => ({ id: String(id) }));
  const calls = [];
  const controller = new AbortController();
  const result = await fetchAllProducts({ search: 'speaker', category: 'electronics', seller: 'my shop' }, {
    signal: controller.signal,
    fetchImpl: async (url, options) => {
      const query = new URL(url, 'http://test').searchParams;
      calls.push(Number(query.get('page')));
      assert.equal(query.get('limit'), '50');
      assert.equal(query.get('search'), 'speaker');
      assert.equal(query.get('seller'), 'my shop');
      assert.equal(query.get('category'), 'electronics');
      assert.equal(options.signal, controller.signal);
      const start = (Number(query.get('page')) - 1) * 50;
      return { ok: true, json: async () => ({ products: all.slice(start, start + 50), total: all.length, totalPages: 3 }) };
    }
  });
  assert.deepEqual(calls, [1, 2, 3]);
  assert.deepEqual(result, all);
});

test('empty and legacy array responses do not request nonexistent pages', async () => {
  for (const data of [[], { products: [], total: 0, totalPages: 0 }, [{ id: 'legacy' }]]) {
    let count = 0;
    const result = await fetchAllProducts({}, { fetchImpl: async () => { count++; return { ok: true, json: async () => data }; } });
    assert.deepEqual(result, Array.isArray(data) ? data : []);
    assert.equal(count, 1);
  }
});

test('later-page errors and aborts reject instead of silently returning a truncated catalog', async () => {
  let count = 0;
  await assert.rejects(fetchAllProducts({}, { fetchImpl: async () => ++count === 1
    ? { ok: true, json: async () => ({ products: [{ id: 'first' }], totalPages: 2 }) }
    : { ok: false, status: 503 } }), /503/);
  await assert.rejects(fetchAllProducts({}, { fetchImpl: async () => { throw new Error('aborted'); } }), /aborted/);
});

for (const databaseFails of [false, true]) {
  test(`native fallback pagination returns different pages when database ${databaseFails ? 'fails' : 'is empty'}`, async () => {
    const items = Array.from({ length: 73 }, (_, id) => ({ id: `item-${id}`, status: 'published' }));
    const context = vm.createContext({
      URL, URLSearchParams, AbortController,
      process: { env: {} },
      fetch: async () => { throw new Error('Mock backend unavailable'); },
      setTimeout: () => 0, clearTimeout() {}, console: { warn() {}, error() {} }
    });
    const dependencies = {
      'next/server': { NextResponse: { json: body => ({ body }) } },
      '../../../lib/connectDB.js': { default: async () => { if (databaseFails) throw new Error('Mock database unavailable'); } },
      '../../../../server/models/Product.js': { default: {
        countDocuments: async () => 0,
        find: () => ({ lean: () => ({ skip: () => ({ limit: async () => [] }) }) })
      } },
      '../../../db/mockData.js': { PRODUCTS: items },
      '../../../lib/serverAuth.js': { getAuthenticatedUser: async () => null },
      '../../../lib/productValidator.js': { toPublicProductDTO: item => item, validateProductData: () => ({ isValid: true }) }
    };
    const route = new vm.SourceTextModule(await readFile(new URL('../src/app/api/products/route.js', import.meta.url), 'utf8'), { context });
    await route.link(specifier => {
      assert.ok(Object.hasOwn(dependencies, specifier));
      const values = dependencies[specifier];
      return new vm.SyntheticModule(Object.keys(values), function () {
        for (const [name, value] of Object.entries(values)) this.setExport(name, value);
      }, { context });
    });
    await route.evaluate();
    const first = await route.namespace.GET({ url: 'http://test/api/products?limit=50&page=1' });
    const second = await route.namespace.GET({ url: 'http://test/api/products?limit=50&page=2' });
    assert.equal(first.body.products.length, 50);
    assert.equal(second.body.products.length, 23);
    assert.equal(second.body.products[0].id, 'item-50');
    assert.equal(second.body.totalPages, 2);
  });
}
