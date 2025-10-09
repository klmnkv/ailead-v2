import Queue from 'bull';
import { logger } from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Основная очередь для сообщений
export const messageQueue = new Queue('messages', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100, // Хранить только 100 последних успешных
    removeOnFail: false // Не удаляем failed для анализа
  },
  settings: {
    stalledInterval: 30000, // Проверка зависших задач каждые 30 сек
    maxStalledCount: 2 // Максимум 2 попытки для зависших
  }
});

// События очереди
messageQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

messageQueue.on('waiting', (jobId) => {
  logger.debug(`Job ${jobId} is waiting`);
});

messageQueue.on('active', (job) => {
  logger.info(`Job ${job.id} started processing`, {
    account_id: job.data.account_id,
    lead_id: job.data.lead_id
  });
});

messageQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed`, {
    account_id: job.data.account_id,
    lead_id: job.data.lead_id,
    processing_time: result.processing_time
  });
});

messageQueue.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed`, {
    account_id: job?.data.account_id,
    lead_id: job?.data.lead_id,
    error: err.message,
    attempts: job?.attemptsMade
  });
});

messageQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`, {
    account_id: job.data.account_id,
    lead_id: job.data.lead_id
  });
});

// Функция для создания дополнительных очередей при необходимости
export const createQueue = (name: string, options?: any) => {
  return new Queue(name, REDIS_URL, {
    ...options,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: false,
      ...options?.defaultJobOptions
    }
  });
};

// Graceful shutdown
export const closeQueues = async () => {
  await messageQueue.close();
  logger.info('Message queue closed');
};