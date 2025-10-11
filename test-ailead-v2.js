/**
 * Скрипт тестирования AI.LEAD v2 для Windows
 */

const axios = require('axios');
const readline = require('readline');

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

// Проверка API
async function checkApiHealth() {
  try {
    log('\n📡 Проверка API сервера...', 'cyan');
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });

    if (response.status === 200) {
      log('✅ API сервер работает', 'green');
      log(`   URL: ${API_URL}`, 'blue');
      log(`   Response: ${JSON.stringify(response.data)}`, 'blue');
      return true;
    }
  } catch (error) {
    log('❌ API сервер недоступен', 'red');
    if (error.code === 'ECONNREFUSED') {
      log('   Сервер не запущен. Запустите: cd api && npm run dev', 'yellow');
    } else {
      log(`   Ошибка: ${error.message}`, 'red');
    }
    return false;
  }
}

// Отправка тестового сообщения
async function sendTestMessage(accountId, leadId, message) {
  try {
    log('\n📨 Отправка тестового сообщения...', 'cyan');
    log(`   Account ID: ${accountId}`, 'blue');
    log(`   Lead ID: ${leadId}`, 'blue');
    log(`   Сообщение: "${message}"`, 'blue');

    // ИСПРАВЛЕННЫЙ запрос с правильными заголовками
    const response = await axios({
      method: 'POST',
      url: `${API_URL}/api/messages/send`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        account_id: parseInt(accountId),
        lead_id: parseInt(leadId),
        message_text: message,
        priority: 'high'
      },
      timeout: 10000
    });

    const result = response.data;

    log('\n✅ Сообщение добавлено в очередь!', 'green');
    log(`   Job ID: ${result.job_id}`, 'bright');
    log(`   Статус: ${result.status}`, 'green');
    log(`   Message ID: ${result.message_id}`, 'blue');

    // Мониторинг выполнения
    await monitorJob(result.job_id);

    return true;
  } catch (error) {
    log('\n❌ Ошибка при отправке', 'red');

    if (error.response) {
      log(`   Статус: ${error.response.status}`, 'red');
      log(`   Данные: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else if (error.request) {
      log(`   Нет ответа от сервера`, 'red');
      log(`   Проверьте что API запущен: cd api && npm run dev`, 'yellow');
    } else {
      log(`   Ошибка: ${error.message}`, 'red');
    }

    return false;
  }
}

// Мониторинг задачи
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
        }

        log('\n🎉 Сообщение доставлено в amoCRM!', 'bright');
        return true;
      }

      if (job.status === 'failed') {
        log('\n❌ Задача завершилась с ошибкой', 'red');

        if (job.failedReason) {
          log(`   Причина: ${job.failedReason}`, 'red');
        }

        log('\n💡 Рекомендации:', 'yellow');
        log('   1. Проверьте логи worker', 'yellow');
        log('   2. Проверьте токены доступа в БД', 'yellow');
        log('   3. Убедитесь что Lead ID существует', 'yellow');

        return false;
      }

      // Ждем 2 секунды
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Job еще не начал обрабатываться
        continue;
      }
      log(`\n⚠️  Ошибка при получении статуса: ${error.message}`, 'yellow');
      break;
    }
  }

  log('\n⏱️  Таймаут ожидания (60 секунд)', 'yellow');
  log('   Задача все еще может выполняться. Проверьте логи воркера.', 'yellow');
  return false;
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

// Главная функция
async function main() {
  log('╔══════════════════════════════════════════╗', 'bright');
  log('║   AI.LEAD v2 Testing Script             ║', 'bright');
  log('║   Windows PowerShell Edition             ║', 'bright');
  log('╚══════════════════════════════════════════╝', 'bright');

  // Проверка API
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('  ШАГ 1: ПРОВЕРКА API СЕРВЕРА', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  const apiOk = await checkApiHealth();
  if (!apiOk) {
    log('\n❌ API сервер не работает', 'red');
    log('💡 Запустите сервер:', 'yellow');
    log('   cd api', 'yellow');
    log('   npm run dev', 'yellow');
    process.exit(1);
  }

  // Получение данных для теста
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('  ШАГ 2: ВВОД ДАННЫХ', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  const accountId = await prompt('\n📝 Введите Account ID: ') || '32181490';
  const leadId = await prompt('📝 Введите Lead ID: ') || '31666305';
  const message = await prompt('📝 Введите текст сообщения (Enter для default): ') ||
                  'Привет! Это тестовое сообщение от AI.LEAD v2 🤖';

  // Отправка
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
  } else {
    log('\n⚠️  Тест завершился с ошибками', 'yellow');
  }

  log('');
}

// Запуск
main().catch(error => {
  log(`\n💥 Критическая ошибка: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});