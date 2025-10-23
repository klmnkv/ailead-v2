import { Router } from 'express';
import { Bot } from '../models/index.js';

const router = Router();

// GET /api/bots?account_id=123 - Получить всех ботов для аккаунта
router.get('/', async (req, res) => {
  try {
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({ error: 'account_id is required' });
    }

    const bots = await Bot.findAll({
      where: { account_id: parseInt(account_id as string) },
      order: [['created_at', 'DESC']]
    });

    return res.json(bots);
  } catch (error) {
    console.error('Error fetching bots:', error);
    return res.status(500).json({ error: 'Failed to fetch bots' });
  }
});

// GET /api/bots/:id - Получить бота по ID
router.get('/:id', async (req, res) => {
  try {
    const bot = await Bot.findByPk(req.params.id);

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    return res.json(bot);
  } catch (error) {
    console.error('Error fetching bot:', error);
    return res.status(500).json({ error: 'Failed to fetch bot' });
  }
});

// POST /api/bots - Создать нового бота
router.post('/', async (req, res) => {
  try {
    const {
      account_id,
      name,
      description,
      pipeline_id,
      stage_id,
      is_active,
      prompt,
      model,
      temperature,
      max_tokens,
      deactivation_conditions,
      deactivation_message,
      files,
      actions
    } = req.body;

    if (!account_id || !name || !prompt) {
      return res.status(400).json({ error: 'account_id, name and prompt are required' });
    }

    const bot = await Bot.create({
      account_id,
      name,
      description: description || '',
      pipeline_id: pipeline_id || null,
      stage_id: stage_id || null,
      is_active: is_active || false,
      prompt,
      model: model || 'GPT-4',
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 500,
      deactivation_conditions: deactivation_conditions || '',
      deactivation_message: deactivation_message || 'Спасибо за общение! Сейчас к вам присоединится наш менеджер.',
      files: files || [],
      actions: actions || {
        move_stage: false,
        assign_manager: false,
        create_task: false,
        send_notification: false,
        add_tag: false,
        add_note: false
      }
    });

    return res.status(201).json(bot);
  } catch (error) {
    console.error('Error creating bot:', error);
    return res.status(500).json({ error: 'Failed to create bot' });
  }
});

// PUT /api/bots/:id - Обновить бота
router.put('/:id', async (req, res) => {
  try {
    const bot = await Bot.findByPk(req.params.id);

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const {
      name,
      description,
      pipeline_id,
      stage_id,
      is_active,
      prompt,
      model,
      temperature,
      max_tokens,
      deactivation_conditions,
      deactivation_message,
      files,
      actions
    } = req.body;

    await bot.update({
      name: name !== undefined ? name : bot.name,
      description: description !== undefined ? description : bot.description,
      pipeline_id: pipeline_id !== undefined ? pipeline_id : bot.pipeline_id,
      stage_id: stage_id !== undefined ? stage_id : bot.stage_id,
      is_active: is_active !== undefined ? is_active : bot.is_active,
      prompt: prompt !== undefined ? prompt : bot.prompt,
      model: model !== undefined ? model : bot.model,
      temperature: temperature !== undefined ? temperature : bot.temperature,
      max_tokens: max_tokens !== undefined ? max_tokens : bot.max_tokens,
      deactivation_conditions: deactivation_conditions !== undefined ? deactivation_conditions : bot.deactivation_conditions,
      deactivation_message: deactivation_message !== undefined ? deactivation_message : bot.deactivation_message,
      files: files !== undefined ? files : bot.files,
      actions: actions !== undefined ? actions : bot.actions
    });

    return res.json(bot);
  } catch (error) {
    console.error('Error updating bot:', error);
    return res.status(500).json({ error: 'Failed to update bot' });
  }
});

// DELETE /api/bots/:id - Удалить бота
router.delete('/:id', async (req, res) => {
  try {
    const bot = await Bot.findByPk(req.params.id);

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    await bot.destroy();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bot:', error);
    return res.status(500).json({ error: 'Failed to delete bot' });
  }
});

// POST /api/bots/:id/toggle - Переключить активность бота
router.post('/:id/toggle', async (req, res) => {
  try {
    const bot = await Bot.findByPk(req.params.id);

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    await bot.update({
      is_active: !bot.is_active
    });

    return res.json(bot);
  } catch (error) {
    console.error('Error toggling bot:', error);
    return res.status(500).json({ error: 'Failed to toggle bot' });
  }
});

// POST /api/bots/:id/duplicate - Дублировать бота
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await Bot.findByPk(req.params.id);

    if (!original) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const duplicate = await Bot.create({
      account_id: original.account_id,
      name: `${original.name} (копия)`,
      description: original.description,
      pipeline_id: original.pipeline_id,
      stage_id: original.stage_id,
      is_active: false, // Копия всегда неактивна
      prompt: original.prompt,
      model: original.model,
      temperature: original.temperature,
      max_tokens: original.max_tokens,
      deactivation_conditions: original.deactivation_conditions,
      deactivation_message: original.deactivation_message,
      files: original.files,
      actions: original.actions
    });

    return res.status(201).json(duplicate);
  } catch (error) {
    console.error('Error duplicating bot:', error);
    return res.status(500).json({ error: 'Failed to duplicate bot' });
  }
});

export default router;
