# AI.LEAD v2 - Быстрый старт

## Что нужно для запуска

1. Node.js 18+
2. Redis
3. PostgreSQL
4. Google Chrome

## Установка

### 1. Установите зависимости

```bash
# API
cd api
npm install

# Worker
cd ../worker-js
npm install
```

### 2. Настройте переменные окружения

#### API (.env)

```bash
cd api
cp .env.example .env
```

Отредактируйте `api/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ailead
REDIS_URL=redis://localhost:6379
PORT=4000
```

#### Worker (.env)

```bash
cd worker-js
cp .env.example .env
```

Отредактируйте `worker-js/.env`:
```env
REDIS_URL=redis://localhost:6379
```

### 3. Запустите сервисы

Откройте 3 терминала:

**Терминал 1 - API:**
```bash
cd api
npm run dev
```

**Терминал 2 - Worker:**
```bash
cd worker-js
npm run dev
```

**Терминал 3 - Тестирование:**
```bash
node test-ailead-v2.js
```

## Решение проблемы с Chrome

Если видите ошибку "Could not find Chrome", выполните одно из:

### Вариант 1: Укажите путь к Chrome

Добавьте в `worker-js/.env`:
```env
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

### Вариант 2: Установите Chromium через Puppeteer

```bash
cd worker-js
npm install puppeteer
npx puppeteer browsers install chrome
```

## Проверка работы

1. API должен быть доступен: http://localhost:4000/health
2. Worker должен показать: "Worker started successfully"
3. Тест должен отправить сообщение

## Что дальше?

- Настройте интеграцию с amoCRM
- Добавьте учетные данные в базу данных
- Настройте бота и сценарии

## Поддержка

Если что-то не работает, проверьте:
1. Запущен ли Redis: `redis-cli ping`
2. Запущена ли PostgreSQL
3. Установлен ли Chrome
4. Логи API и Worker на наличие ошибок
