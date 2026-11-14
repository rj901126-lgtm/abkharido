import User from '../models/User.js';
import Product from '../models/Product.js';

function itemId(item) {
  if (typeof item === 'string') return item.trim();
  if (typeof item?.toHexString === 'function') return item.toHexString();
  if (typeof item?.id === 'string') return item.id.trim();
  if (typeof item?.slug === 'string') return item.slug.trim();
  return item?._id ? String(item._id) : '';
}

function uniqueIds(items) {
  return [...new Set((Array.isArray(items) ? items : []).map(itemId).filter(Boolean))];
}

async function productAliases(items) {
  const ids = uniqueIds(items);
  if (!ids.length) return new Map();
  const objectIds = ids.filter(id => /^[a-f\d]{24}$/i.test(id));
  const products = await Product.find({ $or: [
    { id: { $in: ids } }, { slug: { $in: ids } },
    ...(objectIds.length ? [{ _id: { $in: objectIds } }] : [])
  ] }).select('id slug _id').lean();
  const aliases = new Map();
  for (const product of products) {
    const canonical = product.id || product.slug || String(product._id);
    for (const alias of [product.id, product.slug, String(product._id)]) {
      if (alias) aliases.set(alias, canonical);
    }
  }
  return aliases;
}

function canonicalIds(items, aliases) {
  return [...new Set(uniqueIds(items).map(id => aliases.get(id) || id))];
}

async function findUser(userId) {
  const user = await User.findById(userId).select('wishlist').lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
}

export async function readWishlist(userId) {
  const user = await findUser(userId);
  return canonicalIds(user.wishlist, await productAliases(user.wishlist));
}

export async function syncWishlist(userId, body) {
  const user = await findUser(userId);
  let update;
  if (body?.action === 'clear') {
    update = { $set: { wishlist: [] } };
  } else if (body?.action === 'toggle' && itemId(body.productId)) {
    const aliases = await productAliases([...(user.wishlist || []), body.productId]);
    const target = aliases.get(itemId(body.productId)) || itemId(body.productId);
    const existing = (user.wishlist || []).filter(item => (aliases.get(itemId(item)) || itemId(item)) === target);
    update = existing.length
      ? { $pull: { wishlist: { $in: existing } } }
      : { $addToSet: { wishlist: target } };
  } else if (!body?.action && Array.isArray(body?.wishlist)) {
    const aliases = await productAliases([...(user.wishlist || []), ...body.wishlist]);
    const incoming = canonicalIds(body.wishlist, aliases);
    if (body.merge) {
      const existing = new Set(canonicalIds(user.wishlist, aliases));
      update = { $addToSet: { wishlist: { $each: incoming.filter(id => !existing.has(id)) } } };
    } else {
      update = { $set: { wishlist: incoming } };
    }
  } else {
    throw Object.assign(new Error('Invalid wishlist data or action'), { status: 400 });
  }
  const result = await User.updateOne({ _id: userId }, update);
  if (result.matchedCount !== 1) throw Object.assign(new Error('User not found'), { status: 404 });
  return readWishlist(userId);
}
