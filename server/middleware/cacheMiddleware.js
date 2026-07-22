import redisClient from '../config/redis.js';

/**
 * Cache middleware for Express routes.
 * @param {number} duration - Time in seconds to cache the response
 */
export const cache = (duration = 300) => {
  return async (req, res, next) => {
    // If Redis is not configured or request is not GET, skip caching
    if (!redisClient || req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        console.log(`[Cache Hit] ${key}`);
        return res.json(JSON.parse(cachedResponse));
      }

      console.log(`[Cache Miss] ${key}`);
      
      // Override res.json to intercept the response before sending it
      const originalJson = res.json;
      res.json = function (body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setex(key, duration, JSON.stringify(body))
            .catch(err => console.error('Redis Cache Error:', err));
        }
        originalJson.call(this, body);
      };

      next();
    } catch (err) {
      console.error('Cache Middleware Error:', err);
      next(); // Fail silently and proceed to database if Redis fails
    }
  };
};

/**
 * Utility to clear specific cache keys (used after POST/PUT/DELETE operations)
 * @param {string} pattern - Redis key pattern to clear (e.g., 'cache:/api/products*')
 */
export const clearCache = async (pattern) => {
  if (!redisClient) return;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`[Cache Cleared] ${keys.length} keys matching ${pattern}`);
    }
  } catch (err) {
    console.error('Clear Cache Error:', err);
  }
};
