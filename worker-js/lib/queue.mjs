import Bull from 'bull';
import { logger } from './logger.mjs';

export function createQueue() {
  // Используем REDIS_URL из .env (проще и надежнее)
  const REDIS_URL = process.env.REDIS_URL;

  if (!REDIS_URL) {
    throw new Error('REDIS_URL not set in environment');
  }

  // ✅ ВАЖНО: имя очереди должно совпадать с API - 'messages'
  const queue = new Bull('messages', REDIS_URL, {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: false
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2
    }
  });

  queue.on('error', (error) => {
    logger.error('Queue error:', error);
  });

  queue.on('waiting', (jobId) => {
    logger.info(`Job ${jobId} is waiting`);
  });

  queue.on('active', (job) => {
    logger.info(`Processing job ${job.id}`, {
      account_id: job.data.account_id,
      lead_id: job.data.lead_id
    });
  });

  queue.on('completed', (job, result) => {
    logger.info(`✅ Job ${job.id} completed`, result);
  });

  queue.on('failed', (job, error) => {
    logger.error(`❌ Job ${job.id} failed`, {
      error: error.message,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts
    });
  });

  logger.info('Queue initialized: messages');
  logger.info(`Redis: ${REDIS_URL.replace(/:[^:@]+@/, ':****@')}`);

  return queue;
}