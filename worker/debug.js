// worker/debug-all.js
// Worker который принимает оба типа задач

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import Bull from 'bull';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env
dotenv.config({ path: resolve(__dirname, '.env') });

console.log('🔍 Debug Worker для ВСЕХ типов задач\n');

// Подключаемся к очереди
const messageQueue = new Bull('messages', {
  redis: {
    host: 'redis-10061.c246.us-east-1-4.ec2.redns.redis-cloud.com',
    port: 10061,
    password: 'zcQInFWwyBQI86KCi0tov587e8uu7B2C'
  }
});

// Загружаем MessageProcessor
import('./src/services/MessageProcessor.js').then(module => {
  const MessageProcessor = module.MessageProcessor;
  const processor = new MessageProcessor();

  console.log('✅ MessageProcessor загружен\n');

  // Обрабатываем задачи БЕЗ типа (default)
  messageQueue.process(1, async (job) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📨 Обработка Job #${job.id} (тип: DEFAULT)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n📋 Данные задачи:');
    console.log('  account_id:', job.data.account_id);
    console.log('  lead_id:', job.data.lead_id);
    console.log('  message:', job.data.message_text?.substring(0, 50));

    try {
      const result = await processor.process(job);
      console.log('\n✅ Успешно обработано!');
      return result;
    } catch (error) {
      console.log('\n❌ Ошибка:', error.message);
      throw error;
    }
  });

  // Также обрабатываем задачи с типом 'send-message'
  messageQueue.process('send-message', 1, async (job) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📨 Обработка Job #${job.id} (тип: send-message)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n📋 Данные задачи:');
    console.log('  account_id:', job.data.account_id);
    console.log('  lead_id:', job.data.lead_id);
    console.log('  message:', job.data.message_text?.substring(0, 50));

    try {
      const result = await processor.process(job);
      console.log('\n✅ Успешно обработано!');
      return result;
    } catch (error) {
      console.log('\n❌ Ошибка:', error.message);
      throw error;
    }
  });

  console.log('✅ Worker запущен для ОБОИХ типов задач:');
  console.log('   - DEFAULT (без типа)');
  console.log('   - send-message');
  console.log('\n⏳ Ожидание задач...\n');

}).catch(error => {
  console.error('❌ Не могу загрузить MessageProcessor:', error);
});