import 'dotenv/config';
import { app, httpServer } from './app.js';
import { sequelize } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Подключаемся к PostgreSQL
    await sequelize.authenticate();
    logger.info('PostgreSQL connected');

    // Синхронизируем модели (в production использовать миграции!)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized');
    }

    // Подключаемся к Redis
    await connectRedis();

    // Запускаем сервер
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    sequelize.close();
    process.exit(0);
  });
});

startServer();