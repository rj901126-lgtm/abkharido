import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

// Execute the page's resolver with inert dependencies: importing the Next page
// itself would also load its JSX, client tree, and real database connector.
const pageSource = await readFile(new URL('../src/app/product/[id]/page.jsx', import.meta.url), 'utf8');
const resolverSource = pageSource.match(/^async function getProduct\(id\) \{[\s\S]*?^\}/m)?.[0];
assert.ok(resolverSource, 'The product page must expose its product resolver');

function createResolver({ databaseProduct = null, localProducts = [], connectionFails = false } = {}) {
  const calls = { connect: 0, queries: [] };
  const mongoose = { connection: { readyState: 0 } };
  const getProduct = vm.runInNewContext(`${resolverSource}\ngetProduct`, {
    mongoose,
    async connectDB() {
      calls.connect += 1;
      await Promise.resolve();
      if (connectionFails) throw new Error('Mock connection unavailable');
      mongoose.connection.readyState = 1;
    },
    Product: {
      findOne(query) {
        assert.equal(mongoose.connection.readyState, 1, 'Await the connection before querying');
        calls.queries.push(query);
        return { lean: async () => databaseProduct };
      },
    },
    PRODUCTS: localProducts,
    publicProductForPage: product => ({ ...product, projected: true }),
  });
  return { getProduct, calls };
}

test('a cold worker loads a published product that only exists in the database', async () => {
  const databaseProduct = { id: 'database-only-product', name: 'Live item', status: 'published' };
  const { getProduct, calls } = createResolver({ databaseProduct });

  assert.deepEqual(await getProduct('database-only-product'), { ...databaseProduct, projected: true });
  assert.equal(calls.connect, 1);
  assert.equal(calls.queries.length, 1);
  assert.equal(calls.queries[0].$or[0].id, 'database-only-product');
});

test('a missing product stays absent so the page can return notFound', async () => {
  const { getProduct, calls } = createResolver();
  assert.equal(await getProduct('missing-product'), null);
  assert.equal(calls.queries.length, 1);
});

test('the existing local catalog fallback remains available after a database miss', async () => {
  const localProduct = { id: 'signature-wireless-earphone', name: 'Local item', status: 'published' };
  const { getProduct, calls } = createResolver({ localProducts: [localProduct] });
  assert.deepEqual(await getProduct('sigboom-21'), { ...localProduct, projected: true });
  assert.equal(calls.queries[0].$or[0].id, 'signature-wireless-earphone');
});

test('connection failure preserves the local fallback without issuing a query', async () => {
  const localProduct = { id: 'local-product', status: 'published' };
  const { getProduct, calls } = createResolver({ localProducts: [localProduct], connectionFails: true });
  assert.deepEqual(await getProduct('local-product'), { ...localProduct, projected: true });
  assert.equal(calls.queries.length, 0);
  assert.equal(await getProduct('missing-product'), null);
});

test('nonpublic database records do not fall through to a local product with the same id', async () => {
  for (const status of ['archived', 'draft', 'review']) {
    const { getProduct } = createResolver({
      databaseProduct: { id: 'hidden-product', status },
      localProducts: [{ id: 'hidden-product', status: 'published' }],
    });
    assert.equal(await getProduct('hidden-product'), null);
  }
});
