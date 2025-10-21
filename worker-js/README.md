# AI.LEAD Worker (Browser Automation)

Worker для автоматизации отправки сообщений в amoCRM через браузер с использованием Puppeteer.

## Требования

- Node.js 18+
- Redis (для очереди задач)
- Google Chrome (или Chromium)
- Windows/Linux/macOS

## Установка

### 1. Установка зависимостей

```bash
cd worker-js
npm install
```

### 2. Установка Chrome

#### Windows:

Скачайте и установите Google Chrome: https://www.google.com/chrome/

Chrome обычно устанавливается в:
- `C:\Program Files\Google\Chrome\Application\chrome.exe`
- `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`

#### Linux:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# CentOS/RHEL
sudo yum install -y google-chrome-stable
```

#### Альтернатива: Использовать Chromium от Puppeteer

Если Chrome не установлен, можно использовать встроенный Chromium:

```bash
npm install puppeteer
npx puppeteer browsers install chrome
```

### 3. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Chrome Configuration (только для Windows, если Chrome в нестандартном месте)
# CHROME_PATH=C:\Custom\Path\To\chrome.exe

# Browser Pool Settings
MAX_BROWSERS=3
PAGE_TIMEOUT=300000

# Logging
LOG_LEVEL=info
```

## Запуск

### Режим разработки (с автоперезагрузкой)

```bash
npm run dev
```

### Продакшн режим

```bash
npm start
```

## Решение проблем

### Ошибка: "Could not find Chrome"

**Проблема:** Puppeteer не может найти установленный Chrome.

**Решение 1:** Укажите путь к Chrome вручную

В файле `.env` добавьте:

```env
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

**Решение 2:** Установите Chromium через Puppeteer

```bash
npm install puppeteer
npx puppeteer browsers install chrome
```

**Решение 3 (Windows):** Проверьте путь к Chrome

Откройте PowerShell и выполните:

```powershell
Get-ChildItem "C:\Program Files\Google\Chrome\Application\" -Filter chrome.exe -Recurse
Get-ChildItem "C:\Program Files (x86)\Google\Chrome\Application\" -Filter chrome.exe -Recurse
```

### Ошибка: "ECONNREFUSED" при подключении к Redis

**Проблема:** Redis не запущен или недоступен.

**Решение:**

#### Windows:

1. Скачайте Redis для Windows: https://github.com/microsoftarchive/redis/releases
2. Запустите `redis-server.exe`

Или используйте Docker:

```bash
docker run -d -p 6379:6379 redis:alpine
```

#### Linux:

```bash
sudo systemctl start redis
```

### Ошибка: Browser crashes or timeouts

**Проблема:** Браузер падает или зависает.

**Решение:**

1. Уменьшите количество браузеров в `.env`:

```env
MAX_BROWSERS=1
```

2. Добавьте больше памяти для Node.js:

```bash
node --max-old-space-size=4096 index.mjs
```

3. Включите headless режим в `lib/browser.mjs`:

```javascript
headless: true  // вместо false
```

## Архитектура

```
worker-js/
├── index.mjs           # Точка входа, обработчик очереди
├── lib/
│   ├── browser.mjs     # Пул браузеров Puppeteer
│   ├── amocrm.mjs      # Клиент для работы с amoCRM
│   ├── queue.mjs       # Настройка очереди Bull
│   └── logger.mjs      # Логирование
├── logs/               # Логи и скриншоты ошибок
│   └── screenshots/
├── package.json
└── .env
```

## Как это работает

1. Worker подключается к Redis и начинает слушать очередь `messages`
2. Когда приходит новая задача, worker:
   - Берёт страницу из пула браузеров
   - Открывает лид в amoCRM
   - Отправляет сообщение/заметку/задачу
   - Возвращает страницу в пул
3. Пул браузеров переиспользует страницы для оптимизации
4. Неактивные страницы автоматически закрываются через 5 минут

## Мониторинг

Логи сохраняются в:
- Консоль (stdout)
- Скриншоты ошибок: `logs/screenshots/`

Для просмотра статуса очереди используйте Bull Board (в API):
```
http://localhost:4000/admin/queues
```

## Производительность

- Каждый браузер может обрабатывать множество страниц
- Страницы переиспользуются для одинаковых account_id:lead_id
- Рекомендуемые настройки:
  - **MAX_BROWSERS=3** для 1-50 задач/минуту
  - **MAX_BROWSERS=5** для 50-100 задач/минуту

## Troubleshooting

### Worker не обрабатывает задачи

1. Проверьте подключение к Redis:
```bash
redis-cli ping
# Должно вернуть: PONG
```

2. Проверьте очередь:
```bash
redis-cli
> LLEN bull:messages:wait
```

3. Проверьте логи worker на ошибки

### Медленная обработка

1. Увеличьте количество браузеров в `.env`
2. Используйте headless режим
3. Проверьте скорость интернета
4. Оптимизируйте селекторы в `lib/amocrm.mjs`

## Разработка

### Добавление новых функций

1. Отредактируйте `lib/amocrm.mjs` для новых действий
2. Обновите обработчик в `index.mjs`
3. Протестируйте с одним браузером (`MAX_BROWSERS=1`)

### Отладка

Для отладки включите headless: false и добавьте `slowMo`:

```javascript
const browser = await puppeteer.launch({
  headless: false,
  slowMo: 100  // Замедление на 100ms между действиями
});
```

## Лицензия

MIT
