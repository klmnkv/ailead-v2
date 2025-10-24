# Инструкция по установке обновлений

## ✅ Что сделано

### Frontend (Next.js админка):
1. **7 вкладок навигации:**
   - Dashboard
   - Боты (с полными настройками ChatGPT)
   - Отправить
   - История
   - Аналитика
   - Сценарии
   - Настройки

2. **Страница управления ботами:**
   - Создание/редактирование/удаление ботов
   - Полная интеграция ChatGPT настроек (API ключ, модель, temperature, max tokens)
   - Привязка к воронкам и этапам amoCRM
   - Тестирование ботов

### Backend API:
1. **Модель Bot** с поддержкой всех полей
2. **CRUD API** для ботов (`/api/bots`)
3. **iframe редирект** на Next.js админку
4. **SQL миграция** для создания таблицы

## 🚀 Установка

### Шаг 1: Обновить код

```bash
cd C:\Users\pomka\PycharmProjects\ailead
git fetch origin
git checkout claude/chatgpt-integration-011CUQ1TMzpFqfixCrUvXGXV
git pull origin claude/chatgpt-integration-011CUQ1TMzpFqfixCrUvXGXV
```

### Шаг 2: Применить миграцию базы данных

Выполните SQL миграцию для создания таблицы `bots`:

```bash
# Вариант 1: Через psql
psql -h localhost -U ailead -d ailead -f api/migrations/create_bots_table.sql

# Вариант 2: Через GUI клиент (DBeaver, pgAdmin)
# Откройте файл api/migrations/create_bots_table.sql и выполните его
```

### Шаг 3: Установить зависимости (если нужно)

```bash
# Backend
cd api
npm install

# Frontend
cd ../admin
npm install
```

### Шаг 4: Запустить серверы

```bash
# Terminal 1: Backend API
cd api
npm run dev

# Terminal 2: Next.js Admin
cd admin
npm run dev
```

### Шаг 5: Проверить работу

1. Откройте `http://localhost:3000/bots?account_id=1`
2. Вы должны увидеть:
   - 7 вкладок в навигации
   - Страницу управления ботами
   - Кнопку "Создать нового бота"
3. Попробуйте создать тестового бота

## 🔧 Настройка amoCRM iframe

В настройках виджета amoCRM измените URL iframe на:
```
http://localhost:4000/iframe/panel/{account_id}
```

Или для продакшена:
```
https://voiceleadai.ru/iframe/panel/{account_id}
```

Iframe автоматически перенаправит на Next.js админку.

## 📝 Переменные окружения

### api/.env
```bash
DATABASE_URL=postgres://ailead:ailead_password@localhost:5432/ailead
PORT=4000
NEXT_ADMIN_URL=http://localhost:3000
```

### admin/.env.local (опционально)
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🐛 Решение проблем

### Проблема: "Table bots does not exist"
**Решение:** Выполните миграцию из Шага 2

### Проблема: "Cannot GET /api/bots"
**Решение:** Перезапустите API сервер (`npm run dev` в папке `api`)

### Проблема: Старая HTML админка открывается
**Решение:**
1. Проверьте, что API сервер перезапущен
2. Очистите кеш браузера
3. Проверьте URL iframe в настройках виджета

### Проблема: Ошибки TypeScript при сборке
**Решение:**
```bash
cd admin
rm -rf .next
npm run build
```

## 📊 Структура проекта

```
ailead-v2/
├── admin/                    # Next.js админка
│   ├── app/
│   │   ├── page.tsx         # Dashboard (редирект на /bots)
│   │   ├── bots/page.tsx    # Управление ботами с ChatGPT настройками
│   │   ├── analytics/
│   │   ├── scenarios/
│   │   └── settings/
│   ├── components/
│   │   └── layout/
│   │       └── Navigation.tsx # 7 вкладок
│   └── lib/
│       └── api-client.ts     # API методы для ботов
│
├── api/                      # Express.js backend
│   ├── src/
│   │   ├── models/
│   │   │   └── Bot.ts       # Модель Bot
│   │   ├── routes/
│   │   │   ├── bots.routes.ts    # CRUD для ботов
│   │   │   ├── bot.ts            # Legacy config API
│   │   │   └── iframe.routes.ts  # Редирект на Next.js
│   │   └── app.ts           # Главный файл с роутами
│   └── migrations/
│       └── create_bots_table.sql # SQL миграция
```

## ✅ Проверка работы

После установки проверьте:

1. ✅ API доступен: `http://localhost:4000/health`
2. ✅ Next.js работает: `http://localhost:3000`
3. ✅ Боты API: `http://localhost:4000/api/bots?account_id=1`
4. ✅ Навигация показывает 7 вкладок
5. ✅ Страница ботов загружается
6. ✅ Можно создать тестового бота

## 🎉 Готово!

Теперь у вас полностью работающая Next.js админка с интеграцией ChatGPT!
