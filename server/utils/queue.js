import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import redisClient from '../config/redis.js';
import Order from '../models/Order.js';

let orderQueue = null;

if (process.env.REDIS_URI && redisClient) {
  // BullMQ requires independent connections with maxRetriesPerRequest set to null
  const queueConnection = new Redis(process.env.REDIS_URI, { maxRetriesPerRequest: null });
  const workerConnection = new Redis(process.env.REDIS_URI, { maxRetriesPerRequest: null });

  // Initialize Queue
  orderQueue = new Queue('order-processing', { connection: queueConnection });

  // Initialize Worker for Background Processing
  const orderWorker = new Worker('order-processing', async job => {
    console.log('[Background Job] Processing order:', job.data.orderId);
    
    // Simulate heavy background processing (e.g., generating PDF invoice, sending emails to warehouse)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update order status after background processing is complete
    await Order.findByIdAndUpdate(job.data.orderId, { 
      'paymentInfo.status': 'Processed via Background Worker' 
    });
    
    console.log('[Background Job] Order processed successfully:', job.data.orderId);
  }, { connection: workerConnection });

  orderWorker.on('completed', job => {
    console.log('[BullMQ] Job completed!', job.id);
  });

  orderWorker.on('failed', (job, err) => {
    console.error('[BullMQ] Job failed!', job.id, err.message);
  });
}

export const addOrderToQueue = async (orderId) => {
  if (orderQueue) {
    await orderQueue.add('processOrder', { orderId });
    console.log('[BullMQ] Added order to background queue:', orderId);
  } else {
    console.log('Redis is disabled. Bypassing background queue.');
  }
};
