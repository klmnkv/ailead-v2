// test-env.js (ES6 версия для worker)
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env из текущей папки
dotenv.config({ path: resolve(__dirname, '.env') });

console.log('=====================================');
console.log('📁 Current directory:', __dirname);
console.log('=====================================');
console.log('DATABASE_URL:', process.env.DATABASE_URL || '❌ NOT FOUND');
console.log('REDIS_URL:', process.env.REDIS_URL || '❌ NOT FOUND');
console.log('=====================================');
console.log('All loaded env vars:');
Object.keys(process.env).forEach(key => {
  if (key.includes('DATABASE') || key.includes('REDIS') || key.includes('AMO')) {
    console.log(`  ${key}: ${process.env[key]?.substring(0, 30)}...`);
  }
});
console.log('=====================================');