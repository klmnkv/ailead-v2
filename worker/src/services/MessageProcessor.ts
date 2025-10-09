import { Job } from 'bull';
import { browserPool } from './BrowserPool.js';
import { AmoCRMClient } from './AmoCRMClient.js';
import { logger } from '../utils/logger.js';
import { Message } from '../models/Message.js';

export interface MessageTaskData {
  account_id: number;
  lead_id: number;
  base_url: string;
  access_token: string;
  refresh_token: string;
  message_text: string;
  note_text?: string;
  task_text?: string;
  expiry: number;
}

export class MessageProcessor {
  async process(job: Job<MessageTaskData>): Promise<any> {
    const startTime = Date.now();
    const { account_id, lead_id, base_url, message_text, note_text, task_text } = job.data;

    logger.info(`Processing job ${job.id}`, { account_id, lead_id });

    try {
      await job.progress(10);

      const page = await browserPool.getPage(account_id, lead_id);
      await job.progress(20);

      const client = new AmoCRMClient(page, base_url, job.data.access_token);

      await client.openLead(lead_id);
      await job.progress(40);

      if (message_text) {
        await client.sendChatMessage(message_text);
        await job.progress(60);
      }

      if (note_text) {
        await client.addNote(note_text);
        await job.progress(75);
      }

      if (task_text) {
        await client.createTask(task_text);
        await job.progress(90);
      }

      const processingTime = Date.now() - startTime;

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

      let screenshotUrl = null;
      try {
        const page = await browserPool.getPage(account_id, lead_id);
        const client = new AmoCRMClient(page, base_url, job.data.access_token);
        screenshotUrl = await client.takeScreenshot(
          `error_${account_id}_${lead_id}_${Date.now()}.png`
        );
      } catch (screenshotError) {
        logger.error('Failed to take screenshot:', screenshotError);
      }

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