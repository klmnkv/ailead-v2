// worker-js/index.mjs
import dotenv from 'dotenv';
import { browserPool } from './lib/browser.mjs';
import { AmoCRMClient } from './lib/amocrm.mjs';
import { createQueue } from './lib/queue.mjs';
import { logger } from './lib/logger.mjs';

dotenv.config();

const queue = createQueue();

// Обработчик задач
queue.process(async (job) => {
  const startTime = Date.now();
  const {
    account_id,
    lead_id,
    base_url,
    email,
    password,
    access_token,
    refresh_token,
    expiry,
    message_text,
    note_text,
    task_text
  } = job.data;

  logger.info(`Processing job ${job.id}`, { account_id, lead_id, base_url });

  if (!base_url.startsWith('http://') && !base_url.startsWith('https://')) {
    const error = new Error(`Invalid base_url format: ${base_url}. Must include protocol (https://)`);
    logger.error(error.message);
    throw error;
  }

  if (!email || !password) {
    const error = new Error('Email and password are required for authentication');
    logger.error(error.message);
    throw error;
  }

  let page;
  try {
    await job.progress(10);

    // Получаем страницу из пула
    page = await browserPool.getPage(account_id, lead_id);
    await job.progress(20);

    const client = new AmoCRMClient(page, {
      base_url: base_url,
      email: email,
      password: password
    });

    // Открываем лид
    await client.openLead(lead_id);
    await job.progress(40);

    // Отправляем сообщение (если есть)
    if (message_text) {
      logger.info('Sending message...');
      await client.sendChatMessage(message_text);
      await job.progress(60);
    }

    // Добавляем примечание (если есть)
    if (note_text) {
      logger.info('Adding note...');
      await client.addNote(note_text);
      await job.progress(80);
    }

    // Создаем задачу (если есть)
    if (task_text) {
      logger.info('Creating task...');
      await client.createTask(task_text);
      await job.progress(90);
    }

    await job.progress(100);

    const processingTime = Date.now() - startTime;
    logger.info(`✅ Job ${job.id} completed in ${processingTime}ms`);

    // ✅ ДОБАВЛЕНО: Освобождаем страницу после успешного выполнения
    browserPool.releasePage(account_id, lead_id);

    return {
      success: true,
      processing_time: processingTime,
      account_id,
      lead_id
    };

  } catch (error) {
    logger.error(`❌ Job ${job.id} failed:`, error);

    // ✅ ДОБАВЛЕНО: Освобождаем страницу даже при ошибке
    if (page) {
      browserPool.releasePage(account_id, lead_id);
    }

    // Пытаемся сделать скриншот для отладки
    if (page && !page.isClosed()) {
      try {
        await page.screenshot({
          path: `logs/screenshots/error-job-${job.id}-${Date.now()}.png`,
          fullPage: false
        });
        logger.info(`Screenshot saved for failed job ${job.id}`);
      } catch (screenshotError) {
        logger.error('Failed to take error screenshot:', screenshotError);
      }
    }

    throw error;
  }
  // Не закрываем страницу - она переиспользуется из пула
});

// Запуск
async function start() {
  try {
    logger.info('🚀 Starting worker...');

    const fs = await import('fs');
    const paths = ['logs', 'logs/screenshots'];

    for (const path of paths) {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
        logger.info(`Created directory: ${path}`);
      }
    }

    await browserPool.initialize();

    logger.info('✅ Worker started successfully');
    logger.info('⏳ Waiting for jobs...');

    // ✅ ИСПРАВЛЕНО: Увеличиваем интервал cleanup до 10 минут
    setInterval(async () => {
      try {
        await browserPool.cleanup();
      } catch (error) {
        logger.error('Cleanup error:', error);
      }
    }, 600000); // 10 минут

  } catch (error) {
    logger.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('🛑 Shutting down gracefully...');

  try {
    await queue.close();
    logger.info('Queue closed');

    await browserPool.closeAll(); // ✅ ИСПРАВЛЕНО: используем closeAll вместо cleanup
    logger.info('Browser pool cleaned up');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown();
});

start();