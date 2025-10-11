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

const messageQueue = new Queue<MessageTaskData>('messages', REDIS_URL, {
  redis: {
    retryStrategy: (times) => {
      const delay = Math.min(times * 1000, 10000);
      logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3
  }
});

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
  logger.error('Queue error:', error.message);
});

async function start() {
  try {
    // 1. Подключаемся к БД
    logger.info('📦 Connecting to database...');
    await connectDatabase();
    logger.info('✅ Database connected');

    // 2. ✅ КРИТИЧНО: Инициализируем Browser Pool
    logger.info('🌐 Initializing browser pool...');
    await browserPool.initialize();
    logger.info('✅ Browser pool initialized');

    // 3. Создаем директорию для скриншотов
    const fs = await import('fs');
    if (!fs.existsSync('logs/screenshots')) {
      fs.mkdirSync('logs/screenshots', { recursive: true });
      logger.info('📁 Screenshots directory created');
    }

    // 4. Health check каждую минуту
    setInterval(async () => {
      try {
        const stats = await browserPool.getStats();
        logger.info('🔍 Browser Pool Health:', stats);

        if (stats.healthyBrowsers === 0) {
          logger.warn('⚠️  No healthy browsers, restarting pool...');
          await browserPool.restart();
        }
      } catch (error) {
        logger.error('Health check failed:', error);
      }
    }, 60000);

    logger.info('✅ Worker started and ready to process jobs');
    logger.info(`📊 Waiting for jobs in queue...`);

  } catch (error) {
    logger.error('💥 Failed to start worker:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    await messageQueue.pause();
    logger.info('Queue paused');

    const activeJobs = await messageQueue.getActive();
    if (activeJobs.length > 0) {
      logger.info(`Waiting for ${activeJobs.length} active jobs...`);
      await Promise.race([
        Promise.all(activeJobs.map(job => job.finished())),
        new Promise(resolve => setTimeout(resolve, 30000))
      ]);
    }

    await messageQueue.close();
    await browserPool.closeAll();

    logger.info('✅ Worker shut down successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

start();