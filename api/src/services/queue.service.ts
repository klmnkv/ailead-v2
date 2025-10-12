// api/src/services/queue.service.ts
// Исправленная версия с правильным типом задачи

import Bull from 'bull';
import { logger } from '../utils/logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse Redis URL для Redis Cloud
const parseRedisUrl = (url: string) => {
  try {
    const redisURL = new URL(url);
    return {
      host: redisURL.hostname,
      port: parseInt(redisURL.port),
      password: redisURL.password || undefined,
      username: redisURL.username !== 'default' ? redisURL.username : undefined
    };
  } catch (error) {
    logger.error('Invalid REDIS_URL format:', error);
    throw error;
  }
};

const redisConfig = parseRedisUrl(redisUrl);

// Создаем очередь с тем же именем что и в worker
const messageQueue = new Bull('messages', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

class QueueService {
  /**
   * Добавить задачу на отправку сообщения
   * ВАЖНО: Используем тип 'send-message' как в worker!
   */
  async addMessageTask(data: any, options?: any) {
    try {
      logger.info('Adding message task to queue', {
        account_id: data.account_id,
        lead_id: data.lead_id,
        has_token: !!data.access_token
      });

      // ВАЖНО: Указываем тип задачи 'send-message'!
      const job = await messageQueue.add('send-message', data, {
        priority: options?.priority || 5,
        attempts: options?.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });

      logger.info(`✅ Job ${job.id} added to queue with type 'send-message'`);
      return job;
    } catch (error) {
      logger.error('Failed to add task to queue:', error);
      throw error;
    }
  }

  /**
   * Получить статус задачи
   */
  async getJobStatus(jobId: string) {
    try {
      const job = await messageQueue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = job.progress();

      return {
        id: job.id,
        status: state,
        progress,
        data: job.data,
        result: job.returnvalue,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn
      };
    } catch (error) {
      logger.error('Failed to get job status:', error);
      throw error;
    }
  }

  /**
   * Получить статистику очереди
   */
  async getQueueStats() {
    try {
      const [
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused
      ] = await Promise.all([
        messageQueue.getWaitingCount(),
        messageQueue.getActiveCount(),
        messageQueue.getCompletedCount(),
        messageQueue.getFailedCount(),
        messageQueue.getDelayedCount(),
        messageQueue.getPausedCount()
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused,
        total: waiting + active + completed + failed + delayed + paused
      };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * Очистить выполненные задачи
   */
  async cleanCompleted(grace = 3600000) {
    return messageQueue.clean(grace, 'completed');
  }

  /**
   * Очистить failed задачи
   */
  async cleanFailed(grace = 3600000) {
    return messageQueue.clean(grace, 'failed');
  }
}

export const queueService = new QueueService();
export { messageQueue };