import Bull from 'bull';
import { logger } from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Логируем подключение Bull Queue
const maskedUrl = REDIS_URL.replace(/:[^:@]+@/, ':***@');
logger.info(`📋 Bull Queue connecting to: ${maskedUrl}`);

// Очередь для отправки сообщений
export const messageQueue = new Bull('messages', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 500
  },
  settings: {
    maxStalledCount: 2,
    stalledInterval: 30000,
    lockDuration: 120000
  }
});

// Events
messageQueue.on('error', (error) => {
  logger.error('❌ Queue error:', error.message);
});

messageQueue.on('waiting', (jobId) => {
  logger.debug(`⏳ Job ${jobId} is waiting`);
});

messageQueue.on('active', (job) => {
  logger.info(`🔄 Job ${job.id} started processing`);
});

messageQueue.on('completed', (job, result) => {
  logger.info(`✅ Job ${job.id} completed`);
});

messageQueue.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed:`, err.message);
});

logger.info('✅ Bull Queue initialized');