import 'dotenv/config'; // ДОБАВЬТЕ ЭТУ СТРОКУ В НАЧАЛО
import Queue from 'bull';
import { logger } from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('🔍 REDIS_URL:', REDIS_URL); // DEBUG: проверим что читается

export const messageQueue = new Queue('messages', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 500
  }
});

messageQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

messageQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed`, { result });
});

messageQueue.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed`, { error: err.message });
});

logger.info('Message queue initialized');