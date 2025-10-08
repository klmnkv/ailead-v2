# AI.LEAD v2 - Упрощенная архитектура

Система чат-бота для amoCRM на базе JavaScript/Node.js стека.

## 🏗️ Архитектура

- **API Server** (Express + TypeScript) - REST API и WebSocket
- **Worker** (Puppeteer) - Обработка задач отправки сообщений  
- **Frontend** (React + Vite) - Admin dashboard
- **PostgreSQL** - Основная БД
- **Redis** - Очереди (Bull) и кеш

## 📋 Технологический стек

### Backend
- Node.js 18+
- TypeScript
- Express.js
- Socket.io (WebSocket)
- Bull (очереди задач)
- Sequelize (ORM)
- PostgreSQL 15
- Redis 7

### Worker
- Puppeteer
- Puppeteer Stealth Plugin

### Frontend (в разработке)
- React 18
- TypeScript
- Vite
- TanStack Query
- Tailwind CSS + shadcn/ui
- Recharts

## 🚀 Быстрый старт

### Предварительные требования
- Docker Desktop для Windows
- Node.js 18+
- Git

### Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/YOUR_USERNAME/ailead-v2.git
cd ailead-v2