import 'dotenv/config'; // ДОБАВЬТЕ ЭТУ СТРОКУ В НАЧАЛО
import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('🔍 REDIS_URL:', REDIS_URL); // DEBUG: проверим что читается

export const redisClient = createClient({
  url: REDIS_URL
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  logger.info('Redis connected');
});

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};