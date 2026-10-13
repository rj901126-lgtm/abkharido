import { toPublicProductDTO } from '../lib/productValidator.js';
export const serializeJsonLd = value => JSON.stringify(value)
  .replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
// Reject alternate encodings before the browser can reinterpret the destination.
export function safeLocalRedirect(value, fallback = '/profile') {
  if (typeof value !== 'string' || !value || value.trim() !== value) return fallback;
  let decoded = value;
  for (let i = 0; i < 8; i++) {
    if (decoded.trim() !== decoded || /[\\\u0000-\u001f\u007f]/.test(decoded) || decoded.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(decoded)) return fallback;
    let next;
    try { next = decodeURIComponent(decoded); } catch { return fallback; }
    if (next === decoded) break;
    decoded = next;
    if (i === 7) return fallback;
  }
  if (decoded.trim() !== decoded || /[\\\u0000-\u001f\u007f]/.test(decoded) || decoded.startsWith('//')) return fallback;
  try {
    const url = new URL(value.startsWith('/') ? value : '/' + value, 'https://local.invalid');
    if (url.origin !== 'https://local.invalid') return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}
export function publicProductForPage(product) {
  const result = toPublicProductDTO(product);
  if (!result) return null;
  return JSON.parse(JSON.stringify({...result, reviews: (product.reviews || []).map(r => ({
    name: r.name, rating: r.rating, comment: r.comment, date: r.date, createdAt: r.createdAt,
    isVerifiedPurchase: r.isVerifiedPurchase === true,
    photos: Array.isArray(r.photos) ? r.photos.filter(p => typeof p === 'string' && /^(https?:\/\/|\/|data:image\/)/i.test(p)) : []
  }))}));
}
