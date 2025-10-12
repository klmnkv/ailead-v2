#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

// Конфигурация
const API_URL = process.env.API_URL || 'http://localhost:4000';

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
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

// Проверка здоровья API
async function checkApiHealth() {
  try {
    log('\n📡 Проверка API сервера...', 'cyan');
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });

    if (response.status === 200) {
      log('✅ API сервер работает', 'green');
      return true;
    }
  } catch (error) {
    log('❌ API сервер недоступен', 'red');
    log(`   Запустите: cd api && npm run dev`, 'yellow');
    return false;
  }
}

// Получение интеграций
async function getIntegrations() {
  try {
    const response = await axios.get(`${API_URL}/api/integrations`);
    return response.data || [];
  } catch (error) {
    return [];
  }
}

// Тест отправки через API
async function testApiSend(accountId, leadId, message) {
  try {
    log('\n📨 Отправка через AMO API...', 'cyan');

    const response = await axios.post(
      `${API_URL}/api/messages/send`,
      {
        account_id: parseInt(accountId),
        lead_id: parseInt(leadId),
        message_text: message,
        priority: 'high'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const jobId = response.data.job_id;
    log(`✅ Задача создана: Job ID ${jobId}`, 'green');

    // Ждем выполнения
    log('\n⏳ Ожидание выполнения...', 'yellow');

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));

      try {
        const status = await axios.get(`${API_URL}/api/queue/job/${jobId}`);
        const job = status.data;

        if (job.status === 'completed') {
          log('\n✅ Сообщение отправлено успешно!', 'green');
          log(`   Метод: ${job.result?.method || 'unknown'}`, 'blue');
          log(`   Время: ${job.result?.processing_time || 'N/A'}ms`, 'blue');
          return true;
        } else if (job.status === 'failed') {
          log('\n❌ Ошибка отправки', 'red');
          log(`   ${job.error || 'Unknown error'}`, 'red');
          return false;
        }
      } catch (e) {
        // Job еще не начался
        continue;
      }
    }

    log('\n⏱️ Таймаут ожидания', 'yellow');
    return false;
  } catch (error) {
    log(`\n❌ Ошибка: ${error.message}`, 'red');
    if (error.response) {
      log(`   Детали: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// Проверка конфигурации
function checkConfig() {
  log('\n🔧 Проверка конфигурации...', 'cyan');

  const required = [
    'AMO_CLIENT_ID',
    'AMO_CLIENT_SECRET',
    'AMO_USE_API'
  ];

  const missing = [];
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    log('⚠️  Отсутствуют переменные окружения:', 'yellow');
    missing.forEach(key => log(`   - ${key}`, 'yellow'));
    log('\n   Добавьте их в файл .env', 'blue');
    return false;
  }

  log('✅ Конфигурация в порядке', 'green');
  return true;
}

// Главная функция
async function main() {
  log('╔══════════════════════════════════════════╗', 'bright');
  log('║      AMO API Test Script                ║', 'bright');
  log('║      Тестирование новой интеграции       ║', 'bright');
  log('╚══════════════════════════════════════════╝', 'bright');

  // 1. Проверка конфигурации
  if (!checkConfig()) {
    log('\n💡 Совет: Скопируйте .env.example в .env и заполните данные', 'cyan');
    return;
  }

  // 2. Проверка API
  const apiOk = await checkApiHealth();
  if (!apiOk) {
    process.exit(1);
  }

  // 3. Проверка интеграций
  log('\n🔗 Проверка интеграций...', 'cyan');
  const integrations = await getIntegrations();

  if (integrations.length > 0) {
    log(`✅ Найдено интеграций: ${integrations.length}`, 'green');
    integrations.forEach((int, i) => {
      log(`   ${i + 1}. Account ${int.amocrm_account_id} - ${int.status}`, 'blue');
    });
  } else {
    log('⚠️  Интеграции не найдены', 'yellow');
    log('   Создайте интеграцию через API', 'yellow');
  }

  // 4. Ввод данных для теста
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('  ТЕСТ ОТПРАВКИ', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  let accountId, leadId, message;

  if (integrations.length > 0) {
    const useFirst = await prompt(`\nИспользовать Account ${integrations[0].amocrm_account_id}? (y/n): `);
    if (useFirst.toLowerCase() === 'y') {
      accountId = integrations[0].amocrm_account_id;
    }
  }

  if (!accountId) {
    accountId = await prompt('📝 Введите Account ID: ');
  }

  leadId = await prompt('📝 Введите Lead ID: ');
  message = await prompt('📝 Введите сообщение (Enter для тестового): ') ||
            `Тест AMO API интеграции ${new Date().toLocaleTimeString()} 🚀`;

  // 5. Выбор метода
  const method = await prompt('\n📌 Выберите метод (api/puppeteer/auto) [auto]: ') || 'auto';

  if (method !== 'auto') {
    process.env.AMO_SEND_METHOD = method;
  }

  // 6. Запуск теста
  const success = await testApiSend(accountId, leadId, message);

  // 7. Результаты
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('  РЕЗУЛЬТАТЫ', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  if (success) {
    log('\n✨ Тест прошел успешно!', 'green');
    log('   AMO API интеграция работает корректно', 'green');
    log('\n📝 Следующие шаги:', 'cyan');
    log('   1. Проверьте сообщение в AmoCRM', 'blue');
    log('   2. Мониторьте логи: tail -f worker/logs/app.log', 'blue');
    log('   3. Настройте AMO_SEND_METHOD=api в .env', 'blue');
  } else {
    log('\n⚠️ Тест завершился с ошибками', 'yellow');
    log('\n🔍 Проверьте:', 'cyan');
    log('   1. Токены в базе данных актуальны', 'blue');
    log('   2. Lead ID существует в AmoCRM', 'blue');
    log('   3. Worker запущен: cd worker && npm run dev', 'blue');
    log('   4. Логи worker для деталей ошибки', 'blue');
  }
}

// Запуск
main().catch(error => {
  log(`\n💥 Критическая ошибка: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});