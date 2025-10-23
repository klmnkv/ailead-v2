import { Router } from 'express';
import { sendMessage, getMessageHistory, processIncomingMessage } from '../controllers/messages.controller.js';

const router = Router();

/**
 * POST /api/messages/send
 * Отправка сообщения в очередь
 */
router.post('/send', sendMessage);

/**
 * GET /api/messages/history
 * Получение истории сообщений для лида
 */
router.get('/history', getMessageHistory);

/**
 * POST /api/messages/incoming
 * Обработка входящего сообщения с генерацией AI ответа
 */
router.post('/incoming', processIncomingMessage);

export default router;