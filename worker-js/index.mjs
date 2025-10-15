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

  logger.info(`Processing job ${job.id}`, { account_id, lead_id });

  let page;
  try {
    await job.progress(10);

    page = await browserPool.getPage(account_id, lead_id);
    await job.progress(20);

    const client = new AmoCRMClient(page, {
      base_url,
      email,
      password,
      access_token,
      refresh_token,
      expiry
    });

    // ✅ Открываем лид (внутри автоматически проверится авторизация)
    await client.openLead(lead_id);
    await job.progress(50);

    // Отправляем сообщение
    if (message_text) {
      await client.sendChatMessage(message_text);
      await job.progress(70);
    }

    // Добавляем примечание (если есть)
    if (note_text) {
      await client.addNote(note_text);
      await job.progress(85);
    }

    // Создаем задачу (если есть)
    if (task_text) {
      await client.createTask(task_text);
      await job.progress(95);
    }

    await job.progress(100);

    const processingTime = Date.now() - startTime;
    logger.info(`Job ${job.id} completed in ${processingTime}ms`);

    return {
      success: true,
      processing_time: processingTime,
      account_id,
      lead_id
    };

  } catch (error) {
    logger.error(`Job ${job.id} failed:`, error);
    throw error;
  } finally {
    // Не закрываем страницу - переиспользуем
    // Она закроется при cleanup или слишком долгом простое
  }
});

// Запуск
async function start() {
  try {
    logger.info('Starting worker...');

    // Создаем директорию для логов
    const fs = await import('fs');
    if (!fs.existsSync('logs/screenshots')) {
      fs.mkdirSync('logs/screenshots', { recursive: true });
    }

    await browserPool.initialize();

    logger.info('Worker started successfully');
    logger.info('Waiting for jobs...');
  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await queue.close();
  await browserPool.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await queue.close();
  await browserPool.cleanup();
  process.exit(0);
});

start();