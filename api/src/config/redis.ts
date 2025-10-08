import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Логируем подключение (скрываем пароль)
const maskedUrl = REDIS_URL.replace(/:[^:@]+@/, ':***@');
logger.info(`📡 Connecting to Redis: ${maskedUrl}`);

export const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('❌ Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      logger.warn(`⚠️ Redis retry ${retries}/10...`);
      return retries * 1000;
    }
  }
});

redisClient.on('error', (err) => {
  logger.error('❌ Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  logger.info('🔌 Redis Client Connecting...');
});

redisClient.on('ready', () => {
  logger.info('✅ Redis Client Ready');
});