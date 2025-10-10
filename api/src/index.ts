import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import messageRoutes from './routes/messages';
import queueRoutes from './routes/queue';
import statsRoutes from './routes/stats'; // 👈 НОВОЕ
import botRoutes from './routes/bot'; // 👈 НОВОЕ
import { sequelize } from './config/database';
import { setupQueues } from './queues/setup';
import logger from './utils/logger';

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/messages', messageRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/stats', statsRoutes); // 👈 НОВОЕ
app.use('/api/bot', botRoutes); // 👈 НОВОЕ

// WebSocket
const io = new SocketIOServer(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  logger.info('Client connected');
  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    await setupQueues(io);
    logger.info('Queues initialized');

    server.listen(PORT, () => {
      logger.info(`API Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();

export { io };