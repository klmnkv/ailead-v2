import { Job } from 'bull';
import { browserPool } from './BrowserPool.js';
import { AmoCRMClient } from './AmoCRMClient.js';
import { logger } from '../utils/logger.js';
import { Message } from '../models/Message.js';

// Упрощенный интерфейс - только email/password
export interface MessageTaskData {
  account_id: number;
  lead_id: number;
  base_url: string;
  email: string;
  password: string;
  message_text: string;
  note_text?: string;
  task_text?: string;
}

export class MessageProcessor {
  async process(job: Job<MessageTaskData>): Promise<any> {
    const startTime = Date.now();
    const { account_id, lead_id, base_url, message_text, note_text, task_text } = job.data;

    logger.info(`Processing job ${job.id}`, { account_id, lead_id });

    try {
      await job.progress(10);

      // Получаем страницу из пула
      const page = await browserPool.getPage(account_id, lead_id);
      await job.progress(20);

      // Создаем клиент с упрощенными credentials
      const client = new AmoCRMClient(page, base_url, {
        base_url,
        email: job.data.email,
        password: job.data.password
      });

      // Открываем лид (внутри будет проверка авторизации)
      await client.openLead(lead_id);
      await job.progress(40);

      // Отправляем сообщение
      if (message_text) {
        await client.sendChatMessage(message_text);
        await job.progress(60);
      }

      // Добавляем примечание
      if (note_text) {
        await client.addNote(note_text);
        await job.progress(75);
      }

      // Создаем задачу
      if (task_text) {
        await client.createTask(task_text);
        await job.progress(90);
      }

      const processingTime = Date.now() - startTime;

      // Обновляем статус в БД
      await Message.update(
        {
          status: 'sent',
          sent_at: new Date(),
          processing_time: processingTime
        },
        {
          where: { job_id: job.id?.toString() }
        }
      );

      await job.progress(100);

      logger.info(`Job ${job.id} completed`, {
        account_id,
        lead_id,
        processing_time: processingTime
      });

      return {
        success: true,
        account_id,
        lead_id,
        processing_time: processingTime
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      logger.error(`Job ${job.id} failed`, {
        account_id,
        lead_id,
        error: error.message,
        stack: error.stack
      });

      // Делаем скриншот ошибки
      let screenshotUrl = null;
      try {
        const page = await browserPool.getPage(account_id, lead_id);
        const client = new AmoCRMClient(page, base_url, {
          base_url,
          email: job.data.email,
          password: job.data.password
        });
        screenshotUrl = await client.takeScreenshot(
          `error_${account_id}_${lead_id}_${Date.now()}.png`
        );
      } catch (screenshotError) {
        logger.error('Failed to take screenshot:', screenshotError);
      }

      // Обновляем статус в БД
      await Message.update(
        {
          status: 'failed',
          error_message: error.message,
          screenshot_url: screenshotUrl,
          processing_time: processingTime
        },
        {
          where: { job_id: job.id?.toString() }
        }
      );

      throw error;
    }
  }
}