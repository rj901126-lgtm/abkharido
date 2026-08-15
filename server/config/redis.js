import Redis from 'ioredis';

let redisClient = null;
let isConnected = false;

if (process.env.REDIS_URI) {
  try {
    redisClient = new Redis(process.env.REDIS_URI, {
      maxRetriesPerRequest: 1,
      connectTimeout: 4000,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Redis] Max reconnection attempts reached. Continuing with in-memory caching fallback.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 1000);
      }
    });

    redisClient.connect().catch((err) => {
      console.warn('[Redis Connection Notice]: Could not connect to Redis server (using memory fallback):', err.message);
    });

    redisClient.on('ready', () => {
      isConnected = true;
      console.log('Redis connected successfully for caching & distributed rate limiting');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      // Suppress unhandled crash from Redis auth errors
      if (err.message && err.message.includes('WRONGPASS')) {
        console.warn('[Redis Auth Warning] Invalid Redis credentials provided in REDIS_URI. Falling back to memory store.');
      } else {
        console.warn('[Redis Warning]:', err.message);
      }
    });

    redisClient.on('close', () => {
      isConnected = false;
    });
  } catch (initErr) {
    console.warn('[Redis Init Warning]:', initErr.message);
    redisClient = null;
    isConnected = false;
  }
} else {
  console.log('REDIS_URI not configured. Caching and rate limiting using resilient in-memory stores.');
}

export const isRedisReady = () => Boolean(redisClient && isConnected && redisClient.status === 'ready');

export default redisClient;
