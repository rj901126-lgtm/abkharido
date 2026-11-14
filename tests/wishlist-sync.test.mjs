import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import { createSyncQueue } from '../src/utils/syncQueue.js';

async function loadModule(file, dependencies) {
  const context = vm.createContext({ console: { error() {} } });
  const module = new vm.SourceTextModule(await readFile(new URL(`../${file}`, import.meta.url), 'utf8'), { context });
  await module.link(specifier => {
    assert.ok(Object.hasOwn(dependencies, specifier), `Unexpected dependency: ${specifier}`);
    const values = dependencies[specifier];
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [name, value] of Object.entries(values)) this.setExport(name, value);
    }, { context });
  });
  await module.evaluate();
  return module.namespace;
}

const plain = value => JSON.parse(JSON.stringify(value));
const catalog = [
  { id: 'phone', _id: '507f1f77bcf86cd799439011' },
  { id: 'cable', _id: '507f1f77bcf86cd799439012' }
];

async function fixture(initial = []) {
  const users = new Map([['buyer-a', { wishlist: structuredClone(initial) }], ['buyer-b', { wishlist: [] }]]);
  let failWrite = false;
  const User = {
    findById: id => ({ select: () => ({ lean: async () => structuredClone(users.get(id) || null) }) }),
    updateOne: async ({ _id }, update) => {
      if (failWrite) throw new Error('Mock database unavailable');
      const user = users.get(_id);
      if (!user) return { matchedCount: 0 };
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      if (update.$set) user.wishlist = plain(update.$set.wishlist);
      if (update.$addToSet) {
        const value = update.$addToSet.wishlist;
        for (const item of value.$each || [value]) {
          if (!user.wishlist.some(existing => same(existing, item))) user.wishlist.push(item);
        }
      }
      if (update.$pull) user.wishlist = user.wishlist.filter(item => !update.$pull.wishlist.$in.some(existing => same(existing, item)));
      return { matchedCount: 1 };
    }
  };
  const store = await loadModule('server/utils/wishlistStore.js', {
    '../models/User.js': { default: User },
    '../models/Product.js': { default: { find: () => ({ select: () => ({ lean: async () => catalog }) }) } }
  });
  const dependencies = {
    'next/server': { NextResponse: { json: (body, { status = 200 } = {}) => ({ body: plain(body), status }) } },
    '../../../../lib/connectDB.js': { default: async () => {} },
    '../../../../lib/serverAuth.js': { getAuthenticatedUser: async req => req.userId ? { user: { id: req.userId } } : null },
    '../../../../../server/utils/wishlistStore.js': { syncWishlist: store.syncWishlist }
  };
  const post = await loadModule('src/app/api/wishlist/sync/route.js', dependencies);
  const get = await loadModule('src/app/api/wishlist/route.js', {
    'next/server': dependencies['next/server'],
    '../../../lib/connectDB.js': dependencies['../../../../lib/connectDB.js'],
    '../../../lib/serverAuth.js': dependencies['../../../../lib/serverAuth.js'],
    '../../../../server/utils/wishlistStore.js': { readWishlist: store.readWishlist }
  });
  return {
    users,
    save: (body, userId = 'buyer-a') => post.POST({ userId, json: async () => body }),
    read: (userId = 'buyer-a') => get.GET({ userId }),
    failWrites: () => { failWrite = true; }
  };
}

test('wishlist toggle persists across reload and an alternate product identifier removes the same item', async () => {
  const app = await fixture();
  assert.deepEqual(await app.save({ action: 'toggle', productId: 'phone' }), { status: 200, body: { success: true, wishlist: ['phone'] } });
  assert.deepEqual((await app.read()).body, ['phone']);
  await app.save({ action: 'toggle', productId: catalog[0]._id });
  assert.deepEqual((await app.read()).body, []);
});

test('two rapid heart clicks are saved in order and leave the product unsaved', async () => {
  const app = await fixture();
  const enqueue = createSyncQueue();
  await Promise.all([
    enqueue('wishlist', () => app.save({ action: 'toggle', productId: 'phone' })),
    enqueue('wishlist', () => app.save({ action: 'toggle', productId: 'phone' }))
  ]);
  assert.deepEqual((await app.read()).body, []);
  const source = await readFile(new URL('../src/context/AppContext.jsx', import.meta.url), 'utf8');
  assert.match(source, /return syncQueue\.current\(endpoint, async \(\) =>/);
});

test('a rejected sync does not block later actions or other lists', async () => {
  const enqueue = createSyncQueue();
  const calls = [];
  const failed = enqueue('wishlist', async () => { calls.push('failed'); throw new Error('offline'); });
  const next = enqueue('wishlist', async () => { calls.push('next'); });
  await assert.rejects(failed, /offline/);
  await next;
  assert.deepEqual(calls, ['failed', 'next']);
  let release;
  const first = enqueue('cart', () => new Promise(resolve => { release = resolve; }));
  await enqueue('wishlist', async () => { calls.push('independent'); });
  assert.equal(calls.at(-1), 'independent');
  release();
  await first;
});

test('guest merge retains account favorites and deduplicates slug and object-id aliases', async () => {
  const app = await fixture([catalog[0]._id]);
  const response = await app.save({ wishlist: ['phone', 'cable', 'cable'], merge: true });
  assert.deepEqual(response.body.wishlist, ['phone', 'cable']);
  assert.deepEqual((await app.read()).body, ['phone', 'cable']);
  assert.deepEqual((await app.read('buyer-b')).body, []);
  await app.save({ wishlist: [], merge: true });
  assert.deepEqual((await app.read()).body, ['phone', 'cable']);
});

test('explicit replacement and clear remain supported', async () => {
  const app = await fixture(['phone']);
  await app.save({ wishlist: ['cable', 'cable'] });
  assert.deepEqual((await app.read()).body, ['cable']);
  await app.save({ action: 'clear' });
  assert.deepEqual((await app.read()).body, []);
});

test('failed database writes return an error and keep existing data', async () => {
  const app = await fixture(['phone']);
  app.failWrites();
  const response = await app.save({ action: 'toggle', productId: 'cable' });
  assert.equal(response.status, 500);
  assert.equal(response.body.success, undefined);
  assert.deepEqual((await app.read()).body, ['phone']);
});

test('missing sessions, missing accounts and malformed actions never report a successful save', async () => {
  const app = await fixture();
  assert.equal((await app.save({ wishlist: ['phone'] }, null)).status, 401);
  assert.equal((await app.read(null)).status, 401);
  assert.equal((await app.save({ wishlist: [] }, 'missing-buyer')).status, 404);
  for (const body of [null, {}, { action: 'invalid' }, { action: 'toggle', productId: {} }]) {
    assert.equal((await app.save(body)).status, 400);
  }
});

test('guest wishlist is removed locally only after a confirmed successful merge', async () => {
  const context = await readFile(new URL('../src/context/AppContext.jsx', import.meta.url), 'utf8');
  const merge = context.slice(context.indexOf("const mergeResponse = await fetch(`/api/wishlist/sync`"), context.indexOf("const res = await fetch(`/api/wishlist`"));
  assert.match(merge, /if \(!mergeResponse\.ok\) throw/);
  assert.match(merge, /if \(!merged\.success\) throw/);
  assert.ok(merge.indexOf("localStorage.removeItem('abkharido_wishlist')") > merge.indexOf('if (!merged.success)'));
});
