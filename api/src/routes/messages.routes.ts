import { Router } from 'express';
import { sendMessage, getMessageHistory } from '../controllers/messages.controller.js';

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

export default router;