import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import { generateSampleCsvTemplate, parseCsvProducts } from '../src/utils/excelParser.js';
import { getProductImportSummary, getSellerProductStock } from '../src/utils/sellerProducts.js';
import { validateProductData } from '../src/lib/productValidator.js';

test('the downloaded CSV template preserves all supplied stock and MRP values on import', () => {
  const result = parseCsvProducts(generateSampleCsvTemplate());
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.validProducts.map(product => product.countInStock), [120, 85, 60, 200, 95]);
  assert.deepEqual(result.validProducts.map(product => product.originalPrice), [3990, 4999, 1999, 1299, 2499]);
});

test('both template and existing CSV headers preserve zero stock while blank stock retains the default', () => {
  for (const [mrpHeader, stockHeader] of [['Original MRP (₹)', 'Stock Units'], ['MRP', 'Stock']]) {
    const result = parseCsvProducts(`Product Name,Selling Price (₹),${mrpHeader},${stockHeader}\nSold out headphones,999,1499,0\nAvailable headphones,999,1499,`);
    assert.deepEqual(result.errors, []);
    assert.equal(result.validProducts[0].originalPrice, 1499);
    assert.equal(result.validProducts[0].countInStock, 0);
    assert.equal(result.validProducts[0].inStock, false);
    assert.equal(result.validProducts[1].countInStock, 50);
  }
});

test('quick-edit stock keeps a paused or sold-out product at zero even with a stale legacy count', () => {
  assert.equal(getSellerProductStock({ stock: 0, countInStock: 50 }), 0);
  assert.equal(getSellerProductStock({ stock: 0, countInStock: 0 }), 0);
  assert.equal(getSellerProductStock({ stock: 7, countInStock: 50 }), 7);
  assert.equal(getSellerProductStock({ countInStock: 4 }), 4);
  assert.equal(getSellerProductStock({ countInStock: 0 }), 0);
  assert.equal(getSellerProductStock({}), 0);
});

const sampleProduct = (overrides = {}) => ({
  name: 'Merchant Headphones', price: 999, originalPrice: 1499,
  image: '/merchant-headphones.jpg', countInStock: 0, ...overrides
});

// Evaluate the real route with synthetic auth, database, and model dependencies.
// No database client or provider module is loaded by these tests.
async function importProducts({ products, isAdmin = false, partial = false }) {
  let saved = [];
  let databaseCalls = 0;
  const context = vm.createContext({ console: { error() {} } });
  const dependencies = {
    '../../../../lib/productValidator.js': { validateProductData },
    'next/server': { NextResponse: { json: (body, options = {}) => ({ status: options.status || 200, body }) } },
    '../../../../lib/connectDB.js': { default: async () => { databaseCalls++; } },
    '../../../../../server/models/Product.js': { default: {
      insertMany: async prepared => {
        saved = JSON.parse(JSON.stringify(prepared));
        if (partial) throw { insertedDocs: saved.slice(0, 1) };
        return saved;
      }
    } },
    '../../../../lib/serverAuth.js': { getAuthenticatedUser: async () => ({
      isAdmin, isSeller: true,
      user: { id: '507f1f77bcf86cd799439011', role: isAdmin ? 'admin' : 'seller', shopName: 'Merchant Store' }
    }) },
    '../../../../utils/sellerProducts.js': { getProductImportSummary }
  };
  const source = await readFile(new URL('../src/app/api/products/bulk-upload/route.js', import.meta.url), 'utf8');
  const route = new vm.SourceTextModule(source, { context });
  await route.link(specifier => {
    assert.ok(Object.hasOwn(dependencies, specifier), `Unexpected route dependency: ${specifier}`);
    const exports = dependencies[specifier];
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
  });
  await route.evaluate();
  const response = await route.namespace.POST({ json: async () => ({ products }) });
  assert.equal(databaseCalls, 1);
  return { response, saved };
}

test('seller bulk import retains draft moderation and reports the actual saved publication state', async () => {
  const { response, saved } = await importProducts({ products: [sampleProduct({ status: 'published' })] });
  assert.equal(response.status, 200);
  assert.equal(saved[0].status, 'draft');
  assert.equal(saved[0].stock, 0);
  assert.equal(saved[0].inStock, false);
  assert.equal(response.body.count, 1);
  assert.equal(response.body.publishedCount, 0);
  assert.equal(response.body.draftCount, 1);
  assert.match(response.body.message, /1 saved as drafts/);
  assert.match(response.body.message, /administrator must publish/);
});

test('admin imports distinguish explicitly published products from drafts', async () => {
  const { response } = await importProducts({ isAdmin: true, products: [sampleProduct({ status: 'published' }), sampleProduct()] });
  assert.equal(response.status, 200);
  assert.equal(response.body.count, 2);
  assert.equal(response.body.publishedCount, 1);
  assert.equal(response.body.draftCount, 1);
  assert.match(response.body.message, /1 live; 1 saved as drafts/);
});

test('partial bulk success reports only the records actually inserted', async () => {
  const { response } = await importProducts({ partial: true, products: [sampleProduct(), sampleProduct()] });
  assert.equal(response.status, 200);
  assert.equal(response.body.count, 1);
  assert.equal(response.body.products.length, 1);
  assert.equal(response.body.publishedCount, 0);
  assert.equal(response.body.draftCount, 1);
  assert.match(response.body.message, /Partially imported 1 products/);
});
