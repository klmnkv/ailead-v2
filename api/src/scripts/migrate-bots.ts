import 'dotenv/config';
import { sequelize } from '../config/database.js';
import { Bot } from '../models/Bot.js';
import { logger } from '../utils/logger.js';

async function migrate() {
  try {
    logger.info('🔄 Starting migration...');

    // Подключение к базе данных
    await sequelize.authenticate();
    logger.info('✅ Database connected');

    // Создание таблицы bots
    await Bot.sync({ alter: true });
    logger.info('✅ Table "bots" created/updated successfully');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
