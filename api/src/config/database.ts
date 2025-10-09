import 'dotenv/config'; // ДОБАВЬТЕ ЭТУ СТРОКУ В НАЧАЛО
import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger.js';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://ailead:ailead_password@localhost:5432/ailead';

console.log('🔍 DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // DEBUG без пароля

export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});