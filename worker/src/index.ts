import 'dotenv/config';
import Queue from 'bull';
import { logger } from './utils/logger.js';
import { MessageProcessor } from './services/MessageProcessor.js';
import { browserPool } from './services/BrowserPool.js';
import { connectDatabase } from './config/database.js';
import { MessageTaskData } from './services/MessageProcessor.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '3');

logger.info('🚀 Starting AI.LEAD Worker...');
logger.info(`Redis URL: ${REDIS_URL.replace(/:[^:@]+@/, ':****@')}`);
logger.info(`Concurrency: ${CONCURRENCY}`);

const messageQueue = new Queue<MessageTaskData>('messages', REDIS_URL);

const processor = new MessageProcessor();

messageQueue.process(CONCURRENCY, async (job) => {
  return await processor.process(job);
});

messageQueue.on('completed', (job, result) => {
  logger.info(`✅ Job ${job.id} completed`, result);
});

messageQueue.on('failed', (job, error) => {
  logger.error(`❌ Job ${job?.id} failed`, {
    error: error.message,
    attempts: job?.attemptsMade,
    maxAttempts: job?.opts.attempts
  });
});

messageQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

async function start() {
  try {
    await connectDatabase();

    const fs = await import('fs');
    if (!fs.existsSync('logs/screenshots')) {
      fs.mkdirSync('logs/screenshots', { recursive: true });
    }

    logger.info('✅ Worker started and ready to process jobs');
    logger.info(`📊 Waiting for jobs in queue...`);

  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  await messageQueue.close();
  await browserPool.closeAll();

  logger.info('Worker shut down');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');

  await messageQueue.close();
  await browserPool.closeAll();

  logger.info('Worker shut down');
  process.exit(0);
});

start();