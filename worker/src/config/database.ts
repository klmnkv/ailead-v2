import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  logger.error('DATABASE_URL is not set!');
  logger.error('Please check your .env file in worker directory');
  process.exit(1);
}

logger.info('Connecting to database...');

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development'
    ? (msg) => logger.debug('DB:', msg)
    : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test connection
sequelize.authenticate()
  .then(() => {
    logger.info('✅ Database connection established');
  })
  .catch((error) => {
    logger.error('❌ Unable to connect to database:', error);
  });