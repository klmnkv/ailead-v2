import 'dotenv/config';
// ОБЯЗАТЕЛЬНО В САМОМ НАЧАЛЕ!
import dotenv from 'dotenv';
dotenv.config();

// Отладка - временно добавьте
console.log('🔍 Environment variables check:');
console.log('  AMOCRM_CLIENT_ID:', process.env.AMOCRM_CLIENT_ID || '❌ NOT SET');
console.log('  AMOCRM_CLIENT_SECRET:', process.env.AMOCRM_CLIENT_SECRET ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('  API_DOMAIN:', process.env.API_DOMAIN || '❌ NOT SET');
console.log('  DATABASE_URL:', process.env.DATABASE_URL?.split('@')[1] || '❌ NOT SET');
import { httpServer } from './app.js';
import { sequelize } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    logger.info('🚀 Starting AI.LEAD API Server...');

    // Подключение к базе данных
    await sequelize.authenticate();
    logger.info('✅ Database connected');

    // Загружаем модели
    logger.info('📦 Loading models...');

    // Синхронизация моделей (только для dev)
    if (process.env.NODE_ENV === 'development') {
      logger.info('🔄 Syncing database models...');
      await sequelize.sync({ alter: true });
      logger.info('✅ Database models synced');
    }

    // Подключение к Redis
    await connectRedis();
    logger.info('✅ Redis connected');

    // Запуск HTTP сервера
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📡 WebSocket ready on ws://localhost:${PORT}`);
      logger.info(`🔗 API endpoints: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

start();