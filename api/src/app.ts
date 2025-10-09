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
  contentSecurityPolicy: false // Отключаем для iframe
}));

app.use(cors({
  origin: [
    process.env.VITE_API_URL || 'http://localhost:3000',
    'https://*.amocrm.ru',
    'https://*.amocrm.com'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
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

// WebSocket setup
setupWebSocket(io);

// Делаем io доступным в req
app.set('io', io);

// Error handling
app.use(errorHandler);

export { app, httpServer, io };