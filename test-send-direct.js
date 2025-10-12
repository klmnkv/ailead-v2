// test-send-direct.js
// Прямой тест отправки сообщения (обходим проверку /api/integrations)

const axios = require('axios');
const readline = require('readline');

const API_URL = 'http://localhost:4000';

// Из ваших логов видно, что account_id = 32181490
const DEFAULT_ACCOUNT_ID = 32181490;

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

// Отправка сообщения
async function sendMessage(accountId, leadId, message) {
  try {
    log('\n📤 Отправка сообщения...', 'cyan');
    log(`   Account: ${accountId}`, 'blue');
    log(`   Lead ID: ${leadId}`, 'blue');
    log(`   Текст: "${message}"`, 'blue');

    const startTime = Date.now();

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
        },
        timeout: 10000
      }
    );

    const jobId = response.data.job_id;
    log(`\n✅ Задача создана: Job ID ${jobId}`, 'green');

    // Ожидание выполнения
    log('\n⏳ Ожидание выполнения...', 'yellow');

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 1000));
      process.stdout.write('.');

      try {
        const statusResponse = await axios.get(`${API_URL}/api/queue/job/${jobId}`);
        const job = statusResponse.data;

        if (job.status === 'completed') {
          const elapsed = Date.now() - startTime;

          log('\n\n✨ СООБЩЕНИЕ ОТПРАВЛЕНО УСПЕШНО!', 'green');
          log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
          log(`   Время: ${elapsed}ms`, 'cyan');
          log(`   Метод: ${job.result?.method || 'unknown'}`, 'cyan');

          if (job.result?.method === 'api') {
            log('   🚀 Использован AMO API', 'green');
          } else if (job.result?.method === 'puppeteer') {
            log('   🌐 Использован Puppeteer', 'yellow');
          }

          return true;
        } else if (job.status === 'failed') {
          log('\n\n❌ Ошибка отправки', 'red');
          log(`   ${job.failedReason || job.error || 'Unknown'}`, 'red');
          return false;
        }
      } catch (e) {
        // Продолжаем ждать
      }
    }

    log('\n\n⏱️ Таймаут', 'yellow');
    return false;

  } catch (error) {
    log(`\n❌ Ошибка: ${error.message}`, 'red');
    if (error.response?.data) {
      log(`   ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// Главная функция
async function main() {
  log('╔══════════════════════════════════════════╗', 'bright');
  log('║     Прямой тест отправки сообщения       ║', 'bright');
  log('╚══════════════════════════════════════════╝', 'bright');

  // Проверка API
  try {
    const response = await axios.get(`${API_URL}/health`);
    log('\n✅ API сервер работает', 'green');
  } catch (error) {
    log('\n❌ API сервер недоступен', 'red');
    log('   Запустите: cd api && npm run dev', 'yellow');
    process.exit(1);
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('  НАСТРОЙКА ТЕСТА', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  log(`\n📌 Используем Account ID: ${DEFAULT_ACCOUNT_ID}`, 'cyan');
  log('   (из вашей интеграции kirilltihiy.amocrm.ru)', 'blue');

  const leadId = await prompt('\n📝 Введите Lead ID из AmoCRM: ');

  if (!leadId) {
    log('❌ Lead ID обязателен', 'red');
    process.exit(1);
  }

  const message = await prompt('📝 Текст сообщения (Enter для тестового): ') ||
                  `Тест ${new Date().toLocaleString('ru-RU')} 🚀`;

  // Отправка
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('  ОТПРАВКА', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  const success = await sendMessage(DEFAULT_ACCOUNT_ID, leadId, message);

  if (success) {
    log('\n✅ ТЕСТ ПРОЙДЕН!', 'green');
    log('\n📌 Проверьте сообщение в AmoCRM:', 'cyan');
    log(`   https://kirilltihiy.amocrm.ru/leads/detail/${leadId}`, 'blue');
  } else {
    log('\n⚠️ Тест завершен с ошибками', 'yellow');
    log('\n🔍 Проверьте:', 'cyan');
    log('   1. Worker запущен?', 'blue');
    log('   2. Lead ID существует?', 'blue');
    log('   3. Логи worker для деталей', 'blue');
  }
}

// Запуск
main().catch(error => {
  log(`\n💥 Ошибка: ${error.message}`, 'red');
  process.exit(1);
});