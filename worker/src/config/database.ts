import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger.js';

const DATABASE_URL = process.env.DATABASE_URL || '';

if (!DATABASE_URL) {
  logger.error('DATABASE_URL is not set!');
  process.exit(1);
}

export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Worker не логирует SQL запросы
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  }
});

export const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Worker connected to database');
  } catch (error) {
    logger.error('❌ Worker database connection failed:', error);
    throw error;
  }
};