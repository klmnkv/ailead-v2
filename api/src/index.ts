import dotenv from 'dotenv';
import { httpServer } from './app.js';
import { logger } from './utils/logger.js';
import { sequelize } from './config/database.js';
import { redisClient } from './config/redis.js';

// Загружаем .env из корня проекта
dotenv.config({ path: '../.env' });

// Выводим для диагностики (скрываем пароли)
console.log('🔧 Environment variables:');
console.log('REDIS_URL:', process.env.REDIS_URL?.replace(/:[^:@]+@/, ':***@') || 'NOT SET');
console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') || 'NOT SET');
console.log('API_PORT:', process.env.API_PORT || '4000');

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
    httpServer.listen(PORT, () => {
      logger.info(`🚀 API Server running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await sequelize.close();
      await redisClient.quit();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();