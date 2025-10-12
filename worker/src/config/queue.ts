import Bull from 'bull';
import { logger } from '../utils/logger.js';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  logger.error('REDIS_URL is not set!');
  logger.error('Please check your .env file');
  process.exit(1);
}

logger.info('Connecting to Redis...');

// Parse Redis URL
const parseRedisUrl = (url: string) => {
  try {
    const redisURL = new URL(url);
    return {
      host: redisURL.hostname,
      port: parseInt(redisURL.port),
      password: redisURL.password || undefined,
      username: redisURL.username !== 'default' ? redisURL.username : undefined
    };
  } catch (error) {
    logger.error('Invalid REDIS_URL format:', error);
    throw error;
  }
};

const redisConfig = parseRedisUrl(redisUrl);

export const messageQueue = new Bull('messages', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

messageQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

messageQueue.on('ready', () => {
  logger.info('✅ Queue connected to Redis');
});

export default messageQueue;