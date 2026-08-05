import app from './server/app.js';
import mongoose from 'mongoose';
import logger from './server/config/logger.js';
import redisClient from './server/config/redis.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`[AWS ECS] Enterprise Backend running on port ${PORT}`);
});

// Graceful Shutdown implementation
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed.');
    
    try {
      // Close MongoDB
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed.');
      }
      
      // Close Redis
      if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed.');
      }
      
      logger.info('Graceful shutdown complete. Exiting process.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
  
  // If connections aren't closed in 10s, force shutdown
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for kill signals from Docker / AWS ECS
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled promise rejections — prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION! Reason:', reason);
  // Log but do NOT exit — Docker/PM2 will restart if we crash, but
  // a logged warning is safer than an abrupt restart mid-request.
});

// Catch synchronous uncaught exceptions — these ARE fatal
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down gracefully...', err);
  shutdown('uncaughtException');
});
