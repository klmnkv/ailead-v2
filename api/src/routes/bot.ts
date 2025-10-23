import express from 'express';
import { redisClient } from '../config/redis';
import { aiService } from '../services/ai.service.js';

const router = express.Router();

const BOT_CONFIG_KEY = 'bot:config';

// GET /api/bot/config - Получить настройки бота
router.get('/config', async (_req, res) => {
  try {
    const config = await redisClient.get(BOT_CONFIG_KEY);

    if (!config) {
      // Дефолтные настройки
      return res.json({
        auto_process: false,
        prompt:
          'Ты - профессиональный менеджер по продажам. Твоя задача - помочь клиенту с выбором товара, ответить на вопросы и довести до покупки. Веди себя дружелюбно, но профессионально.',
        ai: {
          enabled: false,
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          api_key: '',
          temperature: 0.7,
          max_tokens: 500,
        },
      });
    }

    return res.json(JSON.parse(config));
  } catch (error) {
    console.error('Error fetching bot config:', error);
    return res.status(500).json({ error: 'Failed to fetch bot config' });
  }
});

// PUT /api/bot/config - Сохранить настройки бота
router.put('/config', async (req, res) => {
  try {
    const { auto_process, prompt, ai } = req.body;

    const config = {
      auto_process: auto_process || false,
      prompt: prompt || '',
      ai: ai || {
        enabled: false,
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        api_key: '',
        temperature: 0.7,
        max_tokens: 500,
      },
      updated_at: new Date().toISOString(),
    };

    await redisClient.set(BOT_CONFIG_KEY, JSON.stringify(config));

    // Инициализируем AI сервис с новым ключом, если AI включен
    if (config.ai.enabled && config.ai.api_key) {
      aiService.initializeOpenAI(config.ai.api_key);
    }

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

    return res.json({ success: true });
  } catch (error) {
    console.error('Error testing bot prompt:', error);
    return res.status(500).json({ error: 'Failed to test bot prompt' });
  }
});

// POST /api/bot/ai/test - Тестировать подключение к AI
router.post('/ai/test', async (req, res) => {
  try {
    const { ai } = req.body;

    if (!ai || !ai.api_key) {
      return res.status(400).json({
        error: 'API ключ не указан',
      });
    }

    const result = await aiService.testConnection(ai);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Подключение успешно',
        duration: result.duration,
      });
    } else {
      return res.status(400).json({
        error: result.message,
      });
    }
  } catch (error: any) {
    console.error('Error testing AI connection:', error);
    res.status(500).json({ error: error.message || 'Failed to test AI connection' });
  }
});

// GET /api/bot/ai/models - Получить список доступных моделей
router.get('/ai/models', async (req, res) => {
  try {
    const provider = req.query.provider as string || 'openai';
    const models = aiService.getAvailableModels(provider);

    res.json({
      provider,
      models: models.map((model) => ({
        value: model,
        label: model,
      })),
    });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
});

export default router;