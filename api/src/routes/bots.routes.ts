import express from 'express';
import { Bot } from '../models/Bot.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/bots - Получить всех ботов
router.get('/', async (req, res) => {
  try {
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({ error: 'account_id is required' });
    }

    const bots = await Bot.findAll({
      where: { account_id: Number(account_id) },
      order: [['created_at', 'DESC']],
    });

    // Скрываем API ключи в ответе
    const botsData = bots.map(bot => {
      const data = bot.toJSON();
      if (data.api_key) {
        data.api_key = '***hidden***';
      }
      return data;
    });

    logger.info(`Found ${bots.length} bots for account ${account_id}`);
    res.json(botsData);
  } catch (error: any) {
    logger.error('Error fetching bots:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch bots' });
  }
});

// POST /api/bots - Создать бота
router.post('/', async (req, res) => {
  try {
    const {
      account_id,
      name,
      description,
      prompt,
      ai_provider,
      api_key,
      model,
      temperature,
      max_tokens,
      pipeline_id,
      stage_id,
      deactivation_conditions,
      deactivation_message,
      is_active,
    } = req.body;

    if (!account_id || !name || !prompt) {
      return res.status(400).json({ error: 'account_id, name, and prompt are required' });
    }

    const bot = await Bot.create({
      account_id,
      name,
      description,
      prompt,
      ai_provider: ai_provider || 'openai',
      api_key,
      model: model || 'gpt-3.5-turbo',
      temperature: temperature !== undefined ? temperature : 0.7,
      max_tokens: max_tokens || 500,
      pipeline_id,
      stage_id,
      deactivation_conditions,
      deactivation_message,
      is_active: is_active !== undefined ? is_active : false,
    });

    logger.info(`Created bot ${bot.id} for account ${account_id}`);
    res.status(201).json(bot.toJSON());
  } catch (error: any) {
    logger.error('Error creating bot:', error);
    res.status(500).json({ error: error.message || 'Failed to create bot' });
  }
});

// PUT /api/bots/:id - Обновить бота
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const bot = await Bot.findByPk(id);

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    await bot.update(updateData);
    logger.info(`Updated bot ${id}`);
    res.json(bot.toJSON());
  } catch (error: any) {
    logger.error('Error updating bot:', error);
    res.status(500).json({ error: error.message || 'Failed to update bot' });
  }
});

// DELETE /api/bots/:id - Удалить бота
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await Bot.findByPk(id);

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    await bot.destroy();
    logger.info(`Deleted bot ${id}`);
    res.json({ success: true, message: 'Bot deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting bot:', error);
    res.status(500).json({ error: error.message || 'Failed to delete bot' });
  }
});

// PATCH /api/bots/:id/toggle - Переключить статус бота
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await Bot.findByPk(id);

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    await bot.update({ is_active: !bot.is_active });
    logger.info(`Toggled bot ${id} status to ${bot.is_active}`);
    res.json(bot.toJSON());
  } catch (error: any) {
    logger.error('Error toggling bot:', error);
    res.status(500).json({ error: error.message || 'Failed to toggle bot status' });
  }
});

// POST /api/bots/:id/duplicate - Дублировать бота
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;

    const originalBot = await Bot.findByPk(id);

    if (!originalBot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const botData = originalBot.toJSON();
    delete botData.id;
    delete botData.created_at;
    delete botData.updated_at;

    const duplicatedBot = await Bot.create({
      ...botData,
      name: `${botData.name} (копия)`,
      is_active: false, // Копия всегда неактивна
    });

    logger.info(`Duplicated bot ${id} to ${duplicatedBot.id}`);
    res.status(201).json(duplicatedBot.toJSON());
  } catch (error: any) {
    logger.error('Error duplicating bot:', error);
    res.status(500).json({ error: error.message || 'Failed to duplicate bot' });
  }
});

export default router;
