import { Server, Socket } from 'socket.io';
import { queueService } from '../services/queue.service.js';
import { messageQueue } from '../config/queue.js';
import { logger } from '../utils/logger.js';

export const setupWebSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    // Подписка на обновления очереди
    socket.on('subscribe:queue', async () => {
      logger.debug(`Client ${socket.id} subscribed to queue updates`);

      const sendStats = async () => {
        const stats = await queueService.getStats();
        socket.emit('queue:stats', stats);
      };

      // Отправляем сразу
      await sendStats();

      // И каждые 2 секунды
      const interval = setInterval(sendStats, 2000);

      socket.on('disconnect', () => {
        clearInterval(interval);
      });
    });

    // Подписка на конкретную задачу
    socket.on('subscribe:job', async (jobId: string) => {
      logger.debug(`Client ${socket.id} subscribed to job ${jobId}`);

      const job = await queueService.getJob(jobId);
      if (job) {
        socket.emit('job:update', {
          id: job.id,
          state: await job.getState(),
          progress: job.progress(),
          data: job.data
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });

  // События от очереди
  messageQueue.on('completed', (job, result) => {
    io.emit('task:completed', {
      job_id: job.id,
      result,
      processing_time: job.finishedOn && job.processedOn
        ? job.finishedOn - job.processedOn
        : 0
    });
  });

  messageQueue.on('failed', (job, err) => {
    io.emit('task:failed', {
      job_id: job?.id,
      error: err.message,
      attempt: job?.attemptsMade,
      max_attempts: job?.opts.attempts
    });
  });

  logger.info('✅ WebSocket handlers setup complete');
};