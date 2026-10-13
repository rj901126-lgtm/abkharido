import redisClient, { isRedisReady } from '../config/redis.js';
const memoryCache = new Map();
const MAX_ENTRIES = 256;
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ENTRY_BYTES = 512 * 1024;
let memoryBytes = 0;
function remove(key) {
  const entry = memoryCache.get(key);
  if (entry) { memoryBytes -= entry.bytes; memoryCache.delete(key); }
}
function expire() {
  const now = Date.now();
  for (const [key, entry] of memoryCache) if (entry.expires <= now) remove(key);
}
const expiryTimer = setInterval(expire, 30000);
expiryTimer.unref?.();
function store(key, data, duration) {
  expire();
  const bytes = Buffer.byteLength(key) + Buffer.byteLength(data);
  remove(key);
  if (bytes > MAX_ENTRY_BYTES) return;
  while (memoryCache.size >= MAX_ENTRIES || memoryBytes + bytes > MAX_BYTES) remove(memoryCache.keys().next().value);
  memoryCache.set(key, {data, bytes, expires: Date.now() + duration * 1000});
  memoryBytes += bytes;
}
export const cache = (duration = 300) => {
  const ttl = Math.max(1, Math.min(3600, Number(duration) || 300));
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = `cache:${req.originalUrl || req.url}`;
    try {
      expire();
      const cached = isRedisReady() ? await redisClient.get(key).catch(() => null) : memoryCache.get(key)?.data;
      if (cached) return res.json(JSON.parse(cached));
      const originalJson = res.json;
      res.json = function(body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = JSON.stringify(body);
          if (isRedisReady()) redisClient.setex(key, ttl, data).catch(() => {});
          else store(key, data, ttl);
        }
        return originalJson.call(this, body);
      };
      return next();
    } catch { return next(); }
  };
};
export const clearCache = async pattern => {
  // Invalidate fallback entries even if Redis has since reconnected.
  const regex = new RegExp('^' + String(pattern).split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
  for (const key of memoryCache.keys()) if (regex.test(key)) remove(key);
  if (!isRedisReady()) return;
  try {
    const stream = redisClient.scanStream({match: pattern, count: 100});
    stream.on('data', keys => {
      if (!keys.length) return;
      const pipeline = redisClient.pipeline();
      keys.forEach(key => pipeline.del(key));
      pipeline.exec().catch(() => {});
    });
    stream.on('error', () => {});
  } catch {}
};
