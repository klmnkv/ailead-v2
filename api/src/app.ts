import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { logger } from './utils/logger.js';
import { setupWebSocket } from './websocket/socket.handlers.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import messagesRouter from './routes/messages.routes.js';
import queueRouter from './routes/queue.routes.js';
import scenariosRouter from './routes/scenarios.routes.js';
import analyticsRouter from './routes/analytics.routes.js';
import integrationsRouter from './routes/integrations.routes.js';
import webhookRouter from './routes/webhook.routes.js';
import iframeRouter from './routes/iframe.routes.js';
import botRouter from './routes/bot.js';
import botsRouter from './routes/bots.routes.js';
import knowledgeBaseRouter from './routes/knowledge-base.routes.js';

const app = express();
const httpServer = createServer(app);

// WebSocket
const io = new Server(httpServer, {
  cors: {
    origin: process.env.VITE_API_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,  // ← Должно быть false
  frameguard: false  // ← ДОБАВЬТЕ эту строку
}));
// ✅ ИСПРАВЛЕННЫЙ CORS
app.use(cors({
  origin: function(origin, callback) {
    // Логируем все запросы для отладки
    logger.info('CORS check', { origin });

    // Разрешённые origins
    const allowedOrigins = [
      process.env.VITE_API_URL || 'http://localhost:3000',
      'http://localhost:4000',
      'https://voiceleadai.ru',
      /^https:\/\/.*\.amocrm\.ru$/,   // ← Регулярное выражение для *.amocrm.ru
      /^https:\/\/.*\.amocrm\.com$/   // ← Регулярное выражение для *.amocrm.com
    ];

    // Если origin не указан (например, Postman, curl) - разрешаем
    if (!origin) {
      callback(null, true);
      return;
    }

    // Проверяем, разрешён ли origin
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      logger.info('CORS allowed', { origin });
      callback(null, true);
    } else {
      logger.warn('CORS blocked', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    origin: req.get('origin')
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/messages', messagesRouter);
app.use('/api/queue', queueRouter);
app.use('/api/scenarios', scenariosRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/bot', botRouter);  // ← Bot config API (legacy)
app.use('/api/bots', botsRouter);  // ← Bots CRUD API
app.use('/api/knowledge-bases', knowledgeBaseRouter);  // ← Knowledge Base API
app.use('/api/knowledge-base-items', knowledgeBaseRouter);  // ← Knowledge Base Items API
app.use('/iframe', iframeRouter);

// WebSocket setup
setupWebSocket(io);

// Делаем io доступным в req
app.set('io', io);

// Error handling
app.use(errorHandler);

export { app, httpServer, io };