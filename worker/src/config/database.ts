import 'dotenv/config';
import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger.js';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://ailead:ailead_password@localhost:5432/ailead';

export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Отключаем логи SQL в worker
  pool: {
    max: 5,
    min: 1,
    acquire: 30000,
    idle: 10000
  }
});

export const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Worker: PostgreSQL connected');
  } catch (error) {
    logger.error('Worker: Failed to connect to PostgreSQL', error);
    throw error;
  }
};