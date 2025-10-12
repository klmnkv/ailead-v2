import { Job } from 'bull';
import { logger } from '../utils/logger.js';
import { Message } from '../models/Message.js';
import { AmoApiService } from './AmoApiService.js';
import { browserPool } from './BrowserPool.js';
import { AmoCRMClient } from './AmoCRMClient.js';

export interface MessageTaskData {
  account_id: number;
  lead_id: number;
  base_url: string;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: number;
  email?: string;
  password?: string;
  message_text?: string;
  note_text?: string;
  task_text?: string;
  use_api?: boolean;
}

export class AmoCRMApiProcessor {
  async process(job: Job<MessageTaskData>): Promise<any> {
    const startTime = Date.now();
    const {
      account_id,
      lead_id,
      base_url,
      access_token,
      refresh_token,
      token_expiry,
      email,
      password,
      message_text,
      note_text,
      task_text,
      use_api = true
    } = job.data;

    logger.info(`Processing job ${job.id}`, {
      account_id,
      lead_id,
      method: use_api && access_token ? 'API' : 'Puppeteer'
    });

    // Decide which method to use
    const shouldUseApi = use_api && access_token && refresh_token;

    if (!shouldUseApi) {
      // Use Puppeteer method
      return this.processWithPuppeteer(job);
    }

    try {
      // Use API method
      await job.progress(10);

      const apiService = new AmoApiService({
        accountId: account_id,
        baseUrl: base_url,
        accessToken: access_token!,
        refreshToken: refresh_token!,
        tokenExpiry: token_expiry || Math.floor(Date.now() / 1000) + 3600
      });

      await job.progress(30);

      const results = {
        message: null as any,
        note: null as any,
        task: null as any
      };

      // Send message
      if (message_text) {
        logger.info('Sending message via API...');
        results.message = await apiService.sendMessage(lead_id, message_text);
        await job.progress(50);
      }

      // Add note
      if (note_text) {
        logger.info('Adding note via API...');
        results.note = await apiService.addNote(lead_id, note_text);
        await job.progress(70);
      }

      // Create task
      if (task_text) {
        logger.info('Creating task via API...');
        const lead = await apiService.getLead(lead_id);
        results.task = await apiService.createTask(
          lead_id,
          task_text,
          lead.responsible_user_id
        );
        await job.progress(90);
      }

      const processingTime = Date.now() - startTime;

      // Update database
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

      logger.info(`Job ${job.id} completed via API in ${processingTime}ms`);

      return {
        success: true,
        method: 'api',
        account_id,
        lead_id,
        processing_time: processingTime,
        results
      };

    } catch (error: any) {
      logger.error(`API method failed: ${error.message}`);

      // Try fallback to Puppeteer if configured
      if (process.env.AMO_FALLBACK_TO_PUPPETEER !== 'false' && (email || password)) {
        logger.info('Attempting Puppeteer fallback...');
        return this.processWithPuppeteer(job);
      }

      // Mark as failed
      const processingTime = Date.now() - startTime;
      await Message.update(
        {
          status: 'failed',
          error_message: error.message,
          processing_time: processingTime
        },
        {
          where: { job_id: job.id?.toString() }
        }
      );

      throw error;
    }
  }

  private async processWithPuppeteer(job: Job<MessageTaskData>): Promise<any> {
    const startTime = Date.now();
    const {
      account_id,
      lead_id,
      base_url,
      email,
      password,
      message_text,
      note_text,
      task_text
    } = job.data;

    if (!email || !password) {
      throw new Error('Email and password required for Puppeteer method');
    }

    try {
      await job.progress(10);

      // Get page from pool
      const page = await browserPool.getPage(account_id, lead_id);
      await job.progress(20);

      // Create client
      const client = new AmoCRMClient(page, base_url, {
        base_url,
        email,
        password
      });

      // Open lead
      await client.openLead(lead_id);
      await job.progress(40);

      // Send message
      if (message_text) {
        await client.sendChatMessage(message_text);
        await job.progress(60);
      }

      // Add note
      if (note_text) {
        await client.addNote(note_text);
        await job.progress(75);
      }

      // Create task
      if (task_text) {
        await client.createTask(task_text);
        await job.progress(90);
      }

      const processingTime = Date.now() - startTime;

      // Update database
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

      logger.info(`Job ${job.id} completed via Puppeteer in ${processingTime}ms`);

      return {
        success: true,
        method: 'puppeteer',
        account_id,
        lead_id,
        processing_time: processingTime
      };

    } catch (error: any) {
      logger.error(`Puppeteer method failed: ${error.message}`);

      const processingTime = Date.now() - startTime;
      await Message.update(
        {
          status: 'failed',
          error_message: error.message,
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