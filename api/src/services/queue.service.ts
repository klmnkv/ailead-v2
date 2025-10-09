import { Job } from 'bull';
import { messageQueue } from '../config/queue.js';
import { logger } from '../utils/logger.js';

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

interface AddTaskOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
}

class QueueService {
  /**
   * Добавляет задачу отправки сообщения в очередь
   */
  async addMessageTask(
    data: MessageTaskData,
    options: AddTaskOptions = {}
  ): Promise<Job<MessageTaskData>> {
    const { priority = 5, delay = 0, attempts = 3 } = options;

    const job = await messageQueue.add(data, {
      priority,
      delay,
      attempts,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    logger.info(`Job created: ${job.id}`, {
      account_id: data.account_id,
      lead_id: data.lead_id,
      priority
    });

    return job;
  }

  /**
   * Получает задачу по ID
   */
  async getJob(jobId: string): Promise<Job<MessageTaskData> | null> {
    return await messageQueue.getJob(jobId);
  }

  /**
   * Получает статистику очередей
   */
  async getStats() {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      messageQueue.getWaitingCount(),
      messageQueue.getActiveCount(),
      messageQueue.getCompletedCount(),
      messageQueue.getFailedCount(),
      messageQueue.getDelayedCount(),
      messageQueue.isPaused()
    ]);

    // Получаем последние 100 завершённых задач для расчёта метрик
    const completedJobs = await messageQueue.getCompleted(0, 100);

    let avgTime = 0;
    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((sum, job) => {
        if (job.finishedOn && job.processedOn) {
          return sum + (job.finishedOn - job.processedOn);
        }
        return sum;
      }, 0);
      avgTime = totalTime / completedJobs.length;
    }

    const successRate = (completed + failed) > 0
      ? (completed / (completed + failed)) * 100
      : 0;

    // Считаем jobs per minute на основе последних завершённых задач
    let jobsPerMinute = 0;
    if (completedJobs.length > 1) {
      const firstJob = completedJobs[completedJobs.length - 1];
      const lastJob = completedJobs[0];
      if (firstJob.finishedOn && lastJob.finishedOn) {
        const timeSpanMinutes = (lastJob.finishedOn - firstJob.finishedOn) / 60000;
        jobsPerMinute = timeSpanMinutes > 0 ? completedJobs.length / timeSpanMinutes : 0;
      }
    }

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      performance: {
        avg_processing_time: Math.round(avgTime),
        jobs_per_minute: Math.round(jobsPerMinute * 10) / 10,
        success_rate: Math.round(successRate * 10) / 10
      }
    };
  }

  /**
   * Получает позицию задачи в очереди
   */
  async getJobPosition(jobId: string): Promise<number> {
    const waitingJobs = await messageQueue.getWaiting();
    const position = waitingJobs.findIndex(job => job.id?.toString() === jobId);
    return position >= 0 ? position + 1 : 0;
  }

  /**
   * Проверяет rate limit для аккаунта (простая реализация)
   * TODO: Улучшить с использованием Redis для точного rate limiting
   */
  async checkRateLimit(accountId: number): Promise<boolean> {
    const activeJobs = await messageQueue.getActive();
    const accountActiveJobs = activeJobs.filter(
      job => job.data.account_id === accountId
    );

    // Лимит: максимум 10 активных задач на аккаунт
    const MAX_CONCURRENT_PER_ACCOUNT = 10;
    return accountActiveJobs.length < MAX_CONCURRENT_PER_ACCOUNT;
  }

  /**
   * Очищает старые задачи
   */
  async cleanup() {
    logger.info('Running queue cleanup...');

    // Удаляем completed задачи старше 24 часов
    const completedCleaned = await messageQueue.clean(24 * 60 * 60 * 1000, 'completed');
    logger.info(`Cleaned ${completedCleaned.length} completed jobs`);

    // Удаляем failed задачи старше 7 дней
    const failedCleaned = await messageQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
    logger.info(`Cleaned ${failedCleaned.length} failed jobs`);
  }

  /**
   * Получает список failed задач для отладки
   */
  async getFailedJobs(limit: number = 50) {
    return await messageQueue.getFailed(0, limit);
  }

  /**
   * Повторяет неудавшуюся задачу
   */
  async retryFailedJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.retry();
      logger.info(`Job ${jobId} queued for retry`);
    }
  }

  /**
   * Приостанавливает очередь
   */
  async pauseQueue(): Promise<void> {
    await messageQueue.pause();
    logger.warn('Message queue paused');
  }

  /**
   * Возобновляет очередь
   */
  async resumeQueue(): Promise<void> {
    await messageQueue.resume();
    logger.info('Message queue resumed');
  }
}

export const queueService = new QueueService();