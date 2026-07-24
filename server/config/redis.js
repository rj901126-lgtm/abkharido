import Redis from 'ioredis';

let redisClient = null;

if (process.env.REDIS_URI) {
  redisClient = new Redis(process.env.REDIS_URI, {
    maxRetriesPerRequest: 3,
    showFriendlyErrorStack: process.env.NODE_ENV === 'development',
    enableOfflineQueue: false, // Prevent hanging if Redis is down
    commandTimeout: 2000,      // Fail fast after 2 seconds
    connectTimeout: 5000,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redisClient.on('connect', () => {
    console.log('Redis connected successfully for caching & rate limiting');
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });
} else {
  console.log('REDIS_URI not found. Caching and distributed rate limiting will be disabled (fallback to memory).');
}

export default redisClient;
