// worker/src/index.ts
// ВАЖНО: Загрузка .env должна быть ПЕРВОЙ!

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Получаем путь к текущей директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env из папки worker
const envPath = resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Failed to load .env file:', result.error);
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');

// ТЕПЕРЬ импортируем остальные модули (после загрузки .env!)
const { messageQueue } = await import('./config/queue.js');
const { MessageProcessor } = await import('./services/MessageProcessor.js');
const { logger } = await import('./utils/logger.js');
const { sequelize } = await import('./config/database.js');
const { browserPool } = await import('./services/BrowserPool.js');

// Initialize processor
const processor = new MessageProcessor();

// Initialize database
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connected');
    await sequelize.sync();
    logger.info('✅ Database synchronized');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
}

// Start worker
async function startWorker() {
  logger.info('🚀 Worker starting...');
  logger.info('Environment: ' + (process.env.NODE_ENV || 'development'));

  // Initialize database
  const dbOk = await initializeDatabase();
  if (!dbOk) {
    logger.error('Failed to initialize database, exiting...');
    process.exit(1);
  }

  const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '3');

  logger.info('Worker configuration:', {
    concurrency,
    minBrowsers: process.env.MIN_BROWSERS || 1,
    maxBrowsers: process.env.MAX_BROWSERS || 2,
    maxPagesPerBrowser: process.env.MAX_PAGES_PER_BROWSER || 8,
    puppeteerHeadless: process.env.PUPPETEER_HEADLESS || 'false',
    chromePath: process.env.PUPPETEER_EXECUTABLE_PATH ? 'custom' : 'default',
    useApi: process.env.AMO_USE_API || 'false',
    sendMethod: process.env.AMO_SEND_METHOD || 'puppeteer'
  });

  // Process messages
  messageQueue.process('send-message', concurrency, async (job) => {
    try {
      logger.info(`📨 Processing job ${job.id}...`);
      const result = await processor.process(job);
      logger.info(`✅ Job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      logger.error(`❌ Job ${job.id} failed:`, error);
      throw error;
    }
  });

  // Queue event handlers
  messageQueue.on('completed', (job, result) => {
    logger.info(`✅ Job ${job.id} completed`, result);
  });

  messageQueue.on('failed', (job, err) => {
    logger.error(`❌ Job ${job.id} failed:`, err.message);
  });

  messageQueue.on('stalled', (job) => {
    logger.warn(`⚠️ Job ${job.id} stalled and will be retried`);
  });

  messageQueue.on('error', (error) => {
    logger.error('Queue error:', error);
  });

  logger.info('✅ Worker started successfully');
  logger.info(`📊 Processing up to ${concurrency} jobs concurrently`);
  logger.info('⏳ Waiting for jobs...');
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down worker gracefully...');
  
  try {
    await messageQueue.close();
    await browserPool.closeAll();
    await sequelize.close();
    logger.info('✅ Worker shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

// Start the worker
startWorker().catch(error => {
  logger.error('Failed to start worker:', error);
  process.exit(1);
});