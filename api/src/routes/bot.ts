import express from 'express';
import { redisClient } from '../config/redis';

const router = express.Router();

const BOT_CONFIG_KEY = 'bot:config';

// GET /api/bot/config - Получить настройки бота
router.get('/config', async (req, res) => {
  try {
    const config = await redisClient.get(BOT_CONFIG_KEY);

    if (!config) {
      // Дефолтные настройки
      return res.json({
        auto_process: false,
        prompt:
          'Ты - профессиональный менеджер по продажам. Твоя задача - помочь клиенту с выбором товара, ответить на вопросы и довести до покупки. Веди себя дружелюбно, но профессионально.',
        knowledge_base_ids: []
      });
    }

    res.json(JSON.parse(config));
  } catch (error) {
    console.error('Error fetching bot config:', error);
    res.status(500).json({ error: 'Failed to fetch bot config' });
  }
});

// PUT /api/bot/config - Сохранить настройки бота
router.put('/config', async (req, res) => {
  try {
    const { auto_process, prompt, knowledge_base_ids } = req.body;

    const config = {
      auto_process: auto_process || false,
      prompt: prompt || '',
      knowledge_base_ids: knowledge_base_ids || [],
      updated_at: new Date().toISOString(),
    };

    await redisClient.set(BOT_CONFIG_KEY, JSON.stringify(config));

    res.json(config);
  } catch (error) {
    console.error('Error saving bot config:', error);
    res.status(500).json({ error: 'Failed to save bot config' });
  }
});

// POST /api/bot/test - Тестировать промпт
router.post('/test', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.length < 10) {
      return res.status(400).json({
        error: 'Промпт слишком короткий (минимум 10 символов)',
      });
    }

    // Простая валидация промпта
    const hasKeywords =
      prompt.includes('менеджер') ||
      prompt.includes('продажа') ||
      prompt.includes('клиент') ||
      prompt.includes('помощь');

    if (!hasKeywords) {
      return res.status(400).json({
        error:
          'Промпт должен содержать ключевые слова о продажах или помощи клиентам',
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error testing bot prompt:', error);
    res.status(500).json({ error: 'Failed to test bot prompt' });
  }
});

export default router;