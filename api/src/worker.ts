import { Job } from 'bull';
import axios from 'axios';
import { messageQueue } from './config/queue.js';
import { logger } from './utils/logger.js';
import { Message } from './models/Message.js';
import { Integration } from './models/Integration.js';
import { sequelize } from './config/database.js';

interface MessageTaskData {
  account_id: number;
  lead_id: number;
  base_url: string;
  access_token: string;
  refresh_token: string;
  message_text: string;
  note_text?: string;
  task_text?: string;
  expiry: number;
  email?: string;
  password?: string;
}

interface AmoCRMTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Обновление токена через OAuth 2.0 refresh token flow
 */
async function refreshAccessToken(
  baseUrl: string,
  refreshToken: string,
  email?: string,
  password?: string
): Promise<AmoCRMTokenResponse> {
  try {
    logger.info('🔄 Refreshing access token...');

    const response = await axios.post(
      `${baseUrl}/oauth2/access_token`,
      {
        client_id: process.env.AMOCRM_CLIENT_ID,
        client_secret: process.env.AMOCRM_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        redirect_uri: process.env.AMOCRM_REDIRECT_URI
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    logger.info('✅ Token refreshed successfully');
    return response.data;
  } catch (error: any) {
    logger.error('❌ Failed to refresh token:', error.response?.data || error.message);
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

/**
 * Отправка сообщения в amoCRM через API
 */
async function sendMessageToAmoCRM(
  baseUrl: string,
  accessToken: string,
  leadId: number,
  messageText: string
): Promise<any> {
  try {
    logger.info(`📤 Sending message to lead ${leadId}...`);

    const response = await axios.post(
      `${baseUrl}/api/v4/leads/${leadId}/notes`,
      {
        note_type: 'common',
        params: {
          text: messageText
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(`✅ Message sent successfully to lead ${leadId}`, {
      note_id: response.data?.id
    });

    return response.data;
  } catch (error: any) {
    logger.error(`❌ Failed to send message to lead ${leadId}:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

/**
 * Добавление заметки в сделку (если note_text указан)
 */
async function addNoteToLead(
  baseUrl: string,
  accessToken: string,
  leadId: number,
  noteText: string
): Promise<void> {
  try {
    logger.info(`📝 Adding note to lead ${leadId}...`);

    await axios.post(
      `${baseUrl}/api/v4/leads/${leadId}/notes`,
      {
        note_type: 'common',
        params: {
          text: noteText
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(`✅ Note added to lead ${leadId}`);
  } catch (error: any) {
    logger.error(`❌ Failed to add note to lead ${leadId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Создание задачи в amoCRM (если task_text указан)
 */
async function createTaskForLead(
  baseUrl: string,
  accessToken: string,
  leadId: number,
  taskText: string
): Promise<void> {
  try {
    logger.info(`📋 Creating task for lead ${leadId}...`);

    const completeTill = Math.floor(Date.now() / 1000) + 86400; // +24 часа

    await axios.post(
      `${baseUrl}/api/v4/tasks`,
      {
        entity_id: leadId,
        entity_type: 'leads',
        text: taskText,
        complete_till: completeTill,
        task_type_id: 1 // Тип задачи: Звонок
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(`✅ Task created for lead ${leadId}`);
  } catch (error: any) {
    logger.error(`❌ Failed to create task for lead ${leadId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Основной обработчик задач
 */
async function processMessage(job: Job<MessageTaskData>): Promise<any> {
  const startTime = Date.now();
  const { account_id, lead_id, message_text, note_text, task_text } = job.data;
  let { base_url, access_token, refresh_token, expiry, email, password } = job.data;

  logger.info(`🔄 Processing job ${job.id}`, {
    account_id,
    lead_id,
    attempt: job.attemptsMade + 1
  });

  try {
    // Проверяем, не истек ли токен (с запасом 5 минут)
    const now = Math.floor(Date.now() / 1000);
    const tokenExpiresIn = expiry - now;

    if (tokenExpiresIn < 300) {
      logger.info('🔄 Token is about to expire, refreshing...');

      const tokenData = await refreshAccessToken(base_url, refresh_token, email, password);

      access_token = tokenData.access_token;
      refresh_token = tokenData.refresh_token;
      expiry = Math.floor(Date.now() / 1000) + tokenData.expires_in;

      // Обновляем токены в БД
      await Integration.update(
        {
          access_token,
          refresh_token,
          token_expiry: expiry
        },
        {
          where: { amocrm_account_id: account_id }
        }
      );

      logger.info('✅ Tokens updated in database');
    }

    // Отправляем основное сообщение
    const result = await sendMessageToAmoCRM(base_url, access_token, lead_id, message_text);

    // Добавляем заметку, если указана
    if (note_text) {
      await addNoteToLead(base_url, access_token, lead_id, note_text);
    }

    // Создаем задачу, если указана
    if (task_text) {
      await createTaskForLead(base_url, access_token, lead_id, task_text);
    }

    // Обновляем статус сообщения в БД
    await Message.update(
      {
        status: 'sent',
        sent_at: new Date()
      },
      {
        where: { job_id: job.id?.toString() }
      }
    );

    const processingTime = Date.now() - startTime;

    logger.info(`✅ Job ${job.id} completed successfully`, {
      account_id,
      lead_id,
      processing_time: processingTime
    });

    return {
      success: true,
      lead_id,
      note_id: result?.id,
      processing_time: processingTime
    };

  } catch (error: any) {
    logger.error(`❌ Job ${job.id} failed`, {
      account_id,
      lead_id,
      attempt: job.attemptsMade + 1,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Обновляем статус сообщения в БД
    await Message.update(
      {
        status: 'failed',
        error_message: error.message
      },
      {
        where: { job_id: job.id?.toString() }
      }
    );

    // Если это 401 (Unauthorized), пробуем обновить токен
    if (error.response?.status === 401) {
      logger.info('🔄 Got 401, attempting token refresh...');

      try {
        const tokenData = await refreshAccessToken(base_url, refresh_token, email, password);

        await Integration.update(
          {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expiry: Math.floor(Date.now() / 1000) + tokenData.expires_in
          },
          {
            where: { amocrm_account_id: account_id }
          }
        );

        logger.info('✅ Token refreshed after 401, job will be retried');
      } catch (refreshError: any) {
        logger.error('❌ Failed to refresh token after 401:', refreshError.message);
      }
    }

    throw error;
  }
}

/**
 * Инициализация worker
 */
async function startWorker() {
  try {
    // Подключаемся к БД
    await sequelize.authenticate();
    logger.info('✅ Database connected');

    // Настраиваем обработчик очереди
    messageQueue.process(async (job: Job<MessageTaskData>) => {
      return await processMessage(job);
    });

    logger.info('🚀 Worker started and listening for jobs...');
    logger.info(`   Queue: messages`);
    logger.info(`   Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);

    // Обработка событий
    messageQueue.on('completed', (job, result) => {
      logger.info(`✅ Job ${job.id} completed`, result);
    });

    messageQueue.on('failed', (job, error) => {
      logger.error(`❌ Job ${job?.id} failed:`, {
        error: error.message,
        attempts: job?.attemptsMade
      });
    });

    messageQueue.on('error', (error) => {
      logger.error('❌ Queue error:', error);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('📴 SIGTERM received, shutting down gracefully...');
      await messageQueue.close();
      await sequelize.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('📴 SIGINT received, shutting down gracefully...');
      await messageQueue.close();
      await sequelize.close();
      process.exit(0);
    });

  } catch (error: any) {
    logger.error('💥 Failed to start worker:', error);
    process.exit(1);
  }
}

// Запуск worker
startWorker();
