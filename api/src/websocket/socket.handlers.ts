import { Server, Socket } from 'socket.io';
import { queueService } from '../services/queue.service.js';
import { logger } from '../utils/logger.js';

export const setupWebSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    // Подписка на статистику очереди
    socket.on('subscribe:queue', async () => {
      const sendStats = async () => {
        try {
          const stats = await queueService.getStats();
          socket.emit('queue:stats', stats);
        } catch (error) {
          logger.error('Error sending queue stats:', error);
        }
      };

      // Первая отправка
      await sendStats();

      // Обновления каждые 2 секунды
      const interval = setInterval(sendStats, 2000);

      socket.on('disconnect', () => {
        clearInterval(interval);
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });

    // Подписка на конкретную задачу
    socket.on('subscribe:job', async (jobId: string) => {
      try {
        const job = await queueService.getJob(jobId);
        if (job) {
          const state = await job.getState();
          socket.emit('job:update', {
            id: job.id,
            state,
            progress: job.progress(),
            data: job.data
          });
        }
      } catch (error) {
        logger.error('Error subscribing to job:', error);
      }
    });
  });
};