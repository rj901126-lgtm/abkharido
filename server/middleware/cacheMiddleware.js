import redisClient from '../config/redis.js';

// In-memory cache fallback for ultra-fast local development without Redis
const memoryCache = new Map();

/**
 * Cache middleware for Express routes.
 * @param {number} duration - Time in seconds to cache the response
 */
export const cache = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      let cachedResponse = null;
      if (redisClient) {
        cachedResponse = await redisClient.get(key);
      } else {
        const memData = memoryCache.get(key);
        if (memData && memData.expires > Date.now()) {
          cachedResponse = memData.data;
        } else if (memData) {
          memoryCache.delete(key);
        }
      }

      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }
      
      const originalJson = res.json;
      res.json = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (redisClient) {
            redisClient.setex(key, duration, JSON.stringify(body))
              .catch(err => console.error('Redis Cache Error:', err));
          } else {
            memoryCache.set(key, { data: JSON.stringify(body), expires: Date.now() + duration * 1000 });
          }
        }
        originalJson.call(this, body);
      };

      next();
    } catch (err) {
      console.error('Cache Middleware Error:', err);
      next();
    }
  };
};

/**
 * Utility to clear specific cache keys (used after POST/PUT/DELETE operations)
 * @param {string} pattern - Redis key pattern to clear (e.g., 'cache:/api/products*')
 */
export const clearCache = async (pattern) => {
  try {
    if (redisClient) {
      // Non-blocking cursor-based scanning to prevent stalling the Redis event loop
      const stream = redisClient.scanStream({
        match: pattern,
        count: 100
      });
      stream.on('data', (resultKeys) => {
        if (resultKeys.length) {
          const pipeline = redisClient.pipeline();
          resultKeys.forEach((key) => pipeline.del(key));
          pipeline.exec().catch((err) => console.error('Redis pipeline del error:', err));
        }
      });
      stream.on('error', (err) => {
        console.error('Redis scanStream error:', err);
      });
    } else {
      // Basic pattern matching for in-memory clear
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
        }
      }
    }
  } catch (err) {
    console.error('Clear Cache Error:', err);
  }
};
