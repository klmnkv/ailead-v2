// check-worker-files.js
// Запустите в папке worker для проверки всех файлов

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Проверка файлов Worker...\n');
console.log('📁 Текущая директория:', __dirname);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Список необходимых файлов
const requiredFiles = [
  // Основные файлы
  '.env',
  'src/index.ts',
  'src/index.js',

  // Конфигурация
  'src/config/database.ts',
  'src/config/database.js',
  'src/config/queue.ts',
  'src/config/queue.js',

  // Утилиты
  'src/utils/logger.ts',
  'src/utils/logger.js',

  // Модели
  'src/models/Message.ts',
  'src/models/Message.js',
  'src/models/Integration.ts',
  'src/models/Integration.js',

  // Сервисы
  'src/services/MessageProcessor.ts',
  'src/services/MessageProcessor.js',
  'src/services/BrowserPool.ts',
  'src/services/BrowserPool.js',
  'src/services/AmoCRMClient.ts',
  'src/services/AmoCRMClient.js',

  // AMO API (опционально)
  'src/services/AmoCRMApiProcessor.ts',
  'src/services/AmoCRMApiProcessor.js',
  'src/services/AmoApiService.ts',
  'src/services/AmoApiService.js'
];

// Проверяем каждый файл
const results = {
  found: [],
  missing: [],
  optional: []
};

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    const stats = fs.statSync(fullPath);
    const size = stats.size;

    if (file.includes('AMO') && file.includes('Api')) {
      results.optional.push(`✅ ${file} (${size} bytes)`);
    } else {
      results.found.push(`✅ ${file} (${size} bytes)`);
    }
  } else {
    if (file.includes('AMO') && file.includes('Api')) {
      results.optional.push(`⚠️ ${file} (опционально)`);
    } else if (!file.endsWith('.js') || !results.found.some(f => f.includes(file.replace('.js', '.ts')))) {
      results.missing.push(`❌ ${file}`);
    }
  }
});

// Выводим результаты
console.log('📁 НАЙДЕННЫЕ ФАЙЛЫ:');
results.found.forEach(f => console.log('  ' + f));

if (results.missing.length > 0) {
  console.log('\n❌ ОТСУТСТВУЮЩИЕ ФАЙЛЫ:');
  results.missing.forEach(f => console.log('  ' + f));
}

console.log('\n📦 AMO API ФАЙЛЫ (опциональные):');
results.optional.forEach(f => console.log('  ' + f));

// Проверяем package.json
console.log('\n📋 ЗАВИСИМОСТИ:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const deps = packageJson.dependencies;

  const requiredDeps = [
    'bull',
    'puppeteer',
    'puppeteer-extra',
    'sequelize',
    'pg',
    'redis',
    'winston',
    'dotenv',
    'axios'
  ];

  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`  ✅ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`  ❌ ${dep}: отсутствует`);
    }
  });
} catch (error) {
  console.log('  ❌ Не могу прочитать package.json');
}

// Итоговая проверка
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (results.missing.length === 0) {
  console.log('✅ Все основные файлы на месте!');
} else {
  console.log(`⚠️ Отсутствует ${results.missing.length} файлов`);
  console.log('   Это может быть причиной ошибок');
}