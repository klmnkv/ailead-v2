import dotenv from 'dotenv';
import { app } from './app.js';
import { logger } from './utils/logger.js';
import { sequelize } from './config/database.js';
import { redisClient } from './config/redis.js';

dotenv.config({ path: '../.env' });

const PORT = process.env.API_PORT || 4000;

async function startServer() {
  try {
    // Подключение к PostgreSQL
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected');

    // Подключение к Redis
    await redisClient.connect();
    logger.info('✅ Redis connected');

    // Запуск HTTP сервера
    const server = app.listen(PORT, () => {
      logger.info(`🚀 API Server running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await sequelize.close();
        await redisClient.quit();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();