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
      logger.warn(`Rate limit exceeded for account ${account_id}`);
      throw new Error('Rate limit exceeded: max 30 messages per minute');
    }

    // Проверяем дубликаты (тот же лид в последние 5 секунд)
    const dedupeKey = `dedupe:${account_id}:${lead_id}`;
    const exists = await redisClient.get(dedupeKey);

    if (exists) {
      logger.warn(`Duplicate request for account ${account_id}, lead ${lead_id}`);
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
   * Получить задачу по ID
   */
  async getJob(jobId: string): Promise<Job<MessageTaskData> | null> {
    return await messageQueue.getJob(jobId);
  }

  /**
   * Получить позицию задачи в очереди
   */
  async getJobPosition(jobId: string): Promise<number> {
    const waitingJobs = await messageQueue.getWaiting();
    const index = waitingJobs.findIndex(job => job.id?.toString() === jobId);
    return index >= 0 ? index + 1 : 0;
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

    // Производительность за последние 100 задач
    const completedJobs = await messageQueue.getCompleted(0, 100);
    const failedJobs = await messageQueue.getFailed(0, 100);

    let avgTime = 0;
    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((sum, job) => {
        const time = job.finishedOn && job.processedOn
          ? job.finishedOn - job.processedOn
          : 0;
        return sum + time;
      }, 0);
      avgTime = Math.round(totalTime / completedJobs.length);
    }

    const totalProcessed = completedJobs.length + failedJobs.length;
    const successRate = totalProcessed > 0
      ? Math.round((completedJobs.length / totalProcessed) * 100)
      : 0;

    // Jobs per minute (последние 100 задач)
    let jobsPerMinute = 0;
    if (completedJobs.length > 1) {
      const newestJob = completedJobs[0];
      const oldestJob = completedJobs[completedJobs.length - 1];

      if (newestJob.finishedOn && oldestJob.finishedOn) {
        const timeRange = (newestJob.finishedOn - oldestJob.finishedOn) / 1000 / 60;
        jobsPerMinute = timeRange > 0 ? Math.round((completedJobs.length / timeRange) * 10) / 10 : 0;
      }
    }

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: await messageQueue.isPaused(),
      performance: {
        avg_processing_time: avgTime,
        jobs_per_minute: jobsPerMinute,
        success_rate: successRate
      }
    };
  }

  /**
   * Очистить завершенные задачи
   */
  async cleanCompleted(grace: number = 3600000): Promise<number> {
    const jobs = await messageQueue.clean(grace, 'completed');
    logger.info(`Cleaned ${jobs.length} completed jobs`);
    return jobs.length;
  }

  /**
   * Очистить упавшие задачи
   */
  async cleanFailed(grace: number = 86400000): Promise<number> {
    const jobs = await messageQueue.clean(grace, 'failed');
    logger.info(`Cleaned ${jobs.length} failed jobs`);
    return jobs.length;
  }
}

export const queueService = new QueueService();