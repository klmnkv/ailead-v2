#!/usr/bin/env node

/**
 * Скрипт тестирования AI.LEAD v2 (TypeScript версия)
 * 
 * Использование:
 * node test-ailead-v2.js
 * 
 * Или с параметрами:
 * node test-ailead-v2.js --account=12345 --lead=67890
 */

import axios from 'axios';
import readline from 'readline';

// Конфигурация
const API_URL = process.env.API_URL || 'http://localhost:4000';

// Цвета для консоли
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${c[color]}${msg}${c.reset}`);
}

// Парсинг аргументов
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    args[key] = value;
  });
  return args;
}

// Интерактивный ввод
async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// ============================================
// ПРОВЕРКА СИСТЕМЫ
// ============================================

async function checkApiHealth() {
  try {
    log('\n📡 Проверка API сервера...', 'cyan');
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    
    if (response.status === 200) {
      log('✅ API сервер работает', 'green');
      log(`   URL: ${API_URL}`, 'blue');
      return true;
    }
  } catch (error) {
    log('❌ API сервер недоступен', 'red');
    log(`   Ошибка: ${error.message}`, 'red');
    log(`   Проверьте: cd api && npm run dev`, 'yellow');
    return false;
  }
}

async function checkQueue() {
  try {
    log('\n📊 Проверка очереди (Bull + Redis)...', 'cyan');
    const response = await axios.get(`${API_URL}/api/queue/stats`);
    
    const stats = response.data;
    log('✅ Очередь работает', 'green');
    log(`   Ожидают: ${stats.waiting}`, 'blue');
    log(`   В обработке: ${stats.active}`, 'blue');
    log(`   Завершено: ${stats.completed}`, 'blue');
    log(`   Ошибок: ${stats.failed}`, 'blue');
    
    if (stats.performance) {
      log(`   Среднее время: ${stats.performance.avg_processing_time}ms`, 'blue');
      log(`   Success rate: ${stats.performance.success_rate}%`, 'blue');
    }
    
    return true;
  } catch (error) {
    log('❌ Очередь недоступна', 'red');
    log(`   Проверьте Redis: redis-cli ping`, 'yellow');
    return false;
  }
}

async function checkWorker() {
  try {
    log('\n👷 Проверка Worker (Puppeteer)...', 'cyan');
    
    // Проверим через очередь - если есть active или completed, значит воркер работал
    const response = await axios.get(`${API_URL}/api/queue/stats`);
    const stats = response.data;
    
    if (stats.active > 0) {
      log('✅ Worker активен (есть задачи в обработке)', 'green');
      return true;
    } else if (stats.completed > 0) {
      log('✅ Worker работает (есть завершенные задачи)', 'green');
      return true;
    } else {
      log('⚠️  Worker запущен, но задач еще не было', 'yellow');
      log('   Проверьте: cd worker && npm run dev', 'yellow');
      return true;
    }
  } catch (error) {
    log('⚠️  Не удалось проверить Worker', 'yellow');
    return false;
  }
}

async function checkIntegrations() {
  try {
    log('\n🔗 Проверка интеграций с amoCRM...', 'cyan');
    const response = await axios.get(`${API_URL}/api/integrations`);
    
    if (response.data && response.data.length > 0) {
      log(`✅ Найдено ${response.data.length} интеграций`, 'green');
      
      response.data.forEach((integration, idx) => {
        log(`   ${idx + 1}. Account ${integration.account_id} - ${integration.status}`, 'blue');
      });
      
      return response.data;
    } else {
      log('⚠️  Интеграции не найдены', 'yellow');
      log('   Настройте интеграцию: http://localhost:4000/api/integrations/amocrm/auth', 'yellow');
      return [];
    }
  } catch (error) {
    log('⚠️  Не удалось проверить интеграции', 'yellow');
    return [];
  }
}

// ============================================
// ОТПРАВКА ТЕСТОВОГО СООБЩЕНИЯ
// ============================================

async function sendTestMessage(accountId, leadId, message) {
  try {
    log('\n📨 Отправка тестового сообщения...', 'cyan');
    log(`   Account ID: ${accountId}`, 'blue');
    log(`   Lead ID: ${leadId}`, 'blue');
    log(`   Сообщение: "${message}"`, 'blue');
    
    const response = await axios.post(`${API_URL}/api/messages/send`, {
      account_id: parseInt(accountId),
      lead_id: parseInt(leadId),
      message_text: message,
      priority: 'high'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = response.data;
    
    log('\n✅ Сообщение добавлено в очередь!', 'green');
    log(`   Job ID: ${result.job_id}`, 'bright');
    log(`   Статус: ${result.status}`, 'green');
    
    if (result.position_in_queue) {
      log(`   Позиция в очереди: ${result.position_in_queue}`, 'blue');
    }
    
    if (result.estimated_time) {
      log(`   Примерное время: ${result.estimated_time}с`, 'blue');
    }
    
    // Мониторинг выполнения
    await monitorJob(result.job_id);
    
    return true;
  } catch (error) {
    log('\n❌ Ошибка при отправке', 'red');
    
    if (error.response) {
      log(`   Статус: ${error.response.status}`, 'red');
      log(`   Данные: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else {
      log(`   Ошибка: ${error.message}`, 'red');
    }
    
    return false;
  }
}

async function monitorJob(jobId, maxAttempts = 30) {
  log('\n⏳ Отслеживание выполнения задачи...', 'cyan');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(`${API_URL}/api/queue/job/${jobId}`);
      const job = response.data;
      
      process.stdout.write(`\r   Статус: ${job.status.padEnd(15)} | Попытка ${i + 1}/${maxAttempts}   `);
      
      if (job.status === 'completed') {
        log('\n✅ Задача выполнена успешно!', 'green');
        
        if (job.result) {
          log(`   Время обработки: ${job.result.processing_time}ms`, 'blue');
          log(`   Account: ${job.result.account_id}, Lead: ${job.result.lead_id}`, 'blue');
        }
        
        log('\n🎉 Сообщение доставлено в amoCRM!', 'bright');
        return true;
      }
      
      if (job.status === 'failed') {
        log('\n❌ Задача завершилась с ошибкой', 'red');
        
        if (job.failedReason) {
          log(`   Причина: ${job.failedReason}`, 'red');
        }
        
        if (job.stacktrace) {
          log(`   Stacktrace:\n${job.stacktrace.slice(0, 500)}`, 'red');
        }
        
        log('\n💡 Рекомендации:', 'yellow');
        log('   1. Проверьте логи worker: cd worker && npm run dev', 'yellow');
        log('   2. Проверьте токены доступа в базе данных', 'yellow');
        log('   3. Убедитесь что Lead ID существует в amoCRM', 'yellow');
        
        return false;
      }
      
      // Ждем 2 секунды
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      log(`\n⚠️  Ошибка при получении статуса: ${error.message}`, 'yellow');
      break;
    }
  }
  
  log('\n⏱️  Таймаут ожидания', 'yellow');
  log('   Задача все еще может выполняться. Проверьте логи воркера.', 'yellow');
  return false;
}

// ============================================
// ГЛАВНАЯ ФУНКЦИЯ
// ============================================

async function main() {
  log('╔══════════════════════════════════════════╗', 'bright');
  log('║   AI.LEAD v2 Testing Script             ║', 'bright');
  log('║   TypeScript + Puppeteer + Bull          ║', 'bright');
  log('╚══════════════════════════════════════════╝', 'bright');
  
  // Шаг 1: Проверка системы
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('  ШАГ 1: ПРОВЕРКА СИСТЕМЫ', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  
  const apiOk = await checkApiHealth();
  if (!apiOk) {
    log('\n❌ API сервер не работает. Запустите:', 'red');
    log('   cd api && npm run dev', 'yellow');
    process.exit(1);
  }
  
  const queueOk = await checkQueue();
  if (!queueOk) {
    log('\n❌ Очередь не работает. Проверьте Redis:', 'red');
    log('   redis-cli ping', 'yellow');
    process.exit(1);
  }
  
  await checkWorker();
  
  const integrations = await checkIntegrations();
  
  // Шаг 2: Получение данных для теста
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('  ШАГ 2: ПОДГОТОВКА ТЕСТА', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  
  const args = parseArgs();
  let accountId = args.account;
  let leadId = args.lead;
  let message = args.message;
  
  // Автоподстановка из интеграций
  if (!accountId && integrations.length > 0) {
    log(`\n💡 Найдена интеграция с Account ID: ${integrations[0].account_id}`, 'cyan');
    const useIt = await prompt('Использовать её? (y/n): ');
    if (useIt.toLowerCase() === 'y') {
      accountId = integrations[0].account_id;
    }
  }
  
  // Интерактивный ввод
  if (!accountId) {
    accountId = await prompt('\n📝 Введите Account ID (из amoCRM): ');
  }
  
  if (!leadId) {
    leadId = await prompt('📝 Введите Lead ID (ID сделки в amoCRM): ');
  }
  
  if (!message) {
    message = await prompt('📝 Введите текст сообщения (Enter для тестового): ') || 
              'Привет! Это тестовое сообщение от AI.LEAD v2 бота 🤖';
  }
  
  // Валидация
  if (!accountId || !leadId) {
    log('\n❌ Account ID и Lead ID обязательны!', 'red');
    process.exit(1);
  }
  
  // Шаг 3: Отправка сообщения
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('  ШАГ 3: ОТПРАВКА СООБЩЕНИЯ', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  
  const success = await sendTestMessage(accountId, leadId, message);
  
  // Итоги
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('  РЕЗУЛЬТАТ', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  
  if (success) {
    log('\n✨ Тест пройден успешно!', 'green');
    log('   Бот работает корректно.', 'green');
    log('\n📝 Что делать дальше:', 'cyan');
    log('   1. Проверьте сообщение в amoCRM', 'blue');
    log('   2. Настройте сценарии бота', 'blue');
    log('   3. Подключите webhook от amoCRM', 'blue');
  } else {
    log('\n⚠️  Тест завершился с ошибками', 'yellow');
    log('   Проверьте логи для деталей.', 'yellow');
  }
  
  log('');
}

// Запуск
main().catch(error => {
  log(`\n💥 Критическая ошибка: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
