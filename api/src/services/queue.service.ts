    import { messageQueue } from '../config/queue.js';
import { redisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { Job } from 'bull';

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

class QueueService {
  /**
   * Добавить задачу в очередь с учетом rate limiting
   */
  async addMessageTask(
    data: MessageTaskData,
    options?: {
      priority?: number;
      delay?: number;
    }
  ): Promise<Job<MessageTaskData>> {
    const { account_id, lead_id } = data;

    // Rate limiting: max 30 сообщений в минуту на аккаунт
    const rateLimitKey = `rate:${account_id}:${Math.floor(Date.now() / 60000)}`;
    const count = await redisClient.incr(rateLimitKey);
    await redisClient.expire(rateLimitKey, 60);

    if (count > 30) {
      throw new Error('Rate limit exceeded: max 30 messages per minute');
    }

    // Проверяем дубликаты (тот же лид в последние 5 секунд)
    const dedupeKey = `dedupe:${account_id}:${lead_id}`;
    const exists = await redisClient.get(dedupeKey);

    if (exists) {
      throw new Error('Duplicate request: message to this lead was sent recently');
    }

    await redisClient.setEx(dedupeKey, 5, '1');

    // Добавляем в очередь
    const job = await messageQueue.add(data, {
      jobId: `msg_${account_id}_${lead_id}_${Date.now()}`,
      priority: options?.priority || 5,
      delay: options?.delay || 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    logger.info(`Job ${job.id} added to queue`, { account_id, lead_id });

    return job;
  }

  /**
   * Получить статистику очередей
   */
  async getStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      messageQueue.getWaitingCount(),
      messageQueue.getActiveCount(),
      messageQueue.getCompletedCount(),
      messageQueue.getFailedCount(),
      messageQueue.getDelayedCount()
    ]);

    // Производительность за последние 1000 задач
    const completedJobs = await messageQueue.getCompleted(0, 1000);

    let avgTime = 0;
    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((sum, job) => {
        const time = job.finishedOn && job.processedOn
          ? job.finishedOn - job.processedOn
          : 0;
        return sum + time;
      }, 0);
      avgTime = totalTime / completedJobs.length;
    }

    const successRate = completed > 0
      ? (completed / (completed + failed)) * 100
      : 100;

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      performance: {
        avg_processing_time: Math.round(avgTime),
        jobs_per_minute: completedJobs.length / 60,
        success_rate: Math.round(successRate * 10) / 10
      }
    };
  }

  /**
   * Получить позицию задачи в очереди
   */
  async getJobPosition(jobId: string): Promise<number> {
    const waitingJobs = await messageQueue.getWaiting();
    return waitingJobs.findIndex(job => job.id === jobId) + 1;
  }

  /**
   * Получить задачу по ID
   */
  async getJob(jobId: string): Promise<Job<MessageTaskData> | null> {
    return await messageQueue.getJob(jobId);
  }

  /**
   * Очистить старые задачи
   */
  async cleanup() {
    const oneDayAgo = 24 * 60 * 60 * 1000;
    const oneWeekAgo = 7 * 24 * 60 * 60 * 1000;

    await messageQueue.clean(oneDayAgo, 'completed');
    await messageQueue.clean(oneWeekAgo, 'failed');

    logger.info('Queue cleanup completed');
  }
}

export const queueService = new QueueService();