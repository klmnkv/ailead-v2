import { Request, Response, NextFunction } from 'express';
import { queueService } from '../services/queue.service.js';
import { Integration } from '../models/Integration.js';
import { Message } from '../models/Message.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { account_id, lead_id, message_text, note_text, task_text, priority } = req.body;

    // Валидация
    if (!account_id || !lead_id || !message_text) {
      throw new AppError(400, 'Missing required fields: account_id, lead_id, message_text');
    }

    // Получаем интеграцию из БД
    const integration = await Integration.findOne({
      where: { account_id, status: 'active' }
    });

    if (!integration) {
      throw new AppError(404, `No active integration found for account ${account_id}`);
    }

    // Создаем запись в messages
    const messageRecord = await Message.create({
      account_id,
      integration_id: integration.id,
      lead_id,
      message_text,
      message_type: 'chat',
      direction: 'outgoing',
      status: 'pending'
    });

    // Добавляем в очередь
    const job = await queueService.addMessageTask(
      {
        account_id,
        lead_id,
        base_url: integration.base_url,
        access_token: integration.access_token,
        refresh_token: integration.refresh_token,
        message_text,
        note_text,
        task_text,
        expiry: integration.token_expiry
      },
      {
        priority: priority === 'high' ? 1 : priority === 'low' ? 10 : 5
      }
    );

    // Обновляем job_id в БД
    await messageRecord.update({ job_id: job.id?.toString() });

    // Отправляем событие в WebSocket
    const io = req.app.get('io');
    io.emit('task:created', {
      job_id: job.id,
      account_id,
      lead_id,
      status: 'queued'
    });

    logger.info(`Message queued: ${job.id}`, { account_id, lead_id });

    res.status(200).json({
      job_id: job.id,
      status: 'queued',
      message_id: messageRecord.id,
      position_in_queue: await job.getState() === 'waiting'
        ? await queueService.getJobPosition(job.id!.toString())
        : 0
    });

  } catch (error) {
    next(error);
  }
};

export const getMessageHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { account_id, lead_id } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;

    if (!account_id || !lead_id) {
      throw new AppError(400, 'Missing required query parameters: account_id, lead_id');
    }

    const offset = (page - 1) * limit;

    const { rows: messages, count: total } = await Message.findAndCountAll({
      where: {
        account_id: parseInt(account_id as string),
        lead_id: parseInt(lead_id as string)
      },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      messages,
      total,
      page,
      per_page: limit,
      total_pages: Math.ceil(total / limit)
    });

  } catch (error) {
    next(error);
  }
};