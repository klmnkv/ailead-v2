import { Router, Request, Response } from 'express';
import { KnowledgeBase, BotKnowledge } from '../models/index.js';
import { Op } from 'sequelize';

const router = Router();

// Получение всех записей базы знаний для аккаунта
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { account_id, category, search } = req.query;

    if (!account_id) {
      res.status(400).json({ error: 'account_id is required' });
      return;
    }

    const whereClause: any = {
      account_id: Number(account_id),
    };

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
        { tags: { [Op.like]: `%${search}%` } },
      ];
    }

    const knowledge = await KnowledgeBase.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
    });

    res.json(knowledge);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

// Получение конкретной записи
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const knowledge = await KnowledgeBase.findByPk(req.params.id);

    if (!knowledge) {
      res.status(404).json({ error: 'Knowledge not found' });
      return;
    }

    res.json(knowledge);
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge' });
  }
});

// Создание новой записи
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { account_id, title, content, category, tags, is_active } = req.body;

    if (!account_id || !title || !content) {
      res.status(400).json({ error: 'account_id, title, and content are required' });
      return;
    }

    const knowledge = await KnowledgeBase.create({
      account_id,
      title,
      content,
      category,
      tags,
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json(knowledge);
  } catch (error) {
    console.error('Error creating knowledge:', error);
    res.status(500).json({ error: 'Failed to create knowledge' });
  }
});

// Обновление записи
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const knowledge = await KnowledgeBase.findByPk(req.params.id);

    if (!knowledge) {
      res.status(404).json({ error: 'Knowledge not found' });
      return;
    }

    const { title, content, category, tags, is_active } = req.body;

    await knowledge.update({
      title: title !== undefined ? title : knowledge.title,
      content: content !== undefined ? content : knowledge.content,
      category: category !== undefined ? category : knowledge.category,
      tags: tags !== undefined ? tags : knowledge.tags,
      is_active: is_active !== undefined ? is_active : knowledge.is_active,
    });

    res.json(knowledge);
  } catch (error) {
    console.error('Error updating knowledge:', error);
    res.status(500).json({ error: 'Failed to update knowledge' });
  }
});

// Удаление записи
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const knowledge = await KnowledgeBase.findByPk(req.params.id);

    if (!knowledge) {
      res.status(404).json({ error: 'Knowledge not found' });
      return;
    }

    await knowledge.destroy();
    res.json({ message: 'Knowledge deleted successfully' });
  } catch (error) {
    console.error('Error deleting knowledge:', error);
    res.status(500).json({ error: 'Failed to delete knowledge' });
  }
});

// Получение базы знаний для конкретного бота
router.get('/bot/:botId', async (req: Request, res: Response): Promise<void> => {
  try {
    const botKnowledge = await BotKnowledge.findAll({
      where: { bot_id: req.params.botId },
      include: [{
        model: KnowledgeBase,
        as: 'knowledge',
        where: { is_active: true },
      }],
      order: [['priority', 'DESC']],
    });

    res.json(botKnowledge);
  } catch (error) {
    console.error('Error fetching bot knowledge:', error);
    res.status(500).json({ error: 'Failed to fetch bot knowledge' });
  }
});

// Привязка базы знаний к боту
router.post('/bot/:botId/attach', async (req: Request, res: Response): Promise<void> => {
  try {
    const { knowledge_id, priority } = req.body;

    if (!knowledge_id) {
      res.status(400).json({ error: 'knowledge_id is required' });
      return;
    }

    const botKnowledge = await BotKnowledge.create({
      bot_id: Number(req.params.botId),
      knowledge_id,
      priority: priority || 0,
    });

    res.status(201).json(botKnowledge);
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ error: 'Knowledge already attached to this bot' });
      return;
    }
    console.error('Error attaching knowledge to bot:', error);
    res.status(500).json({ error: 'Failed to attach knowledge to bot' });
  }
});

// Отвязка базы знаний от бота
router.delete('/bot/:botId/detach/:knowledgeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await BotKnowledge.destroy({
      where: {
        bot_id: req.params.botId,
        knowledge_id: req.params.knowledgeId,
      },
    });

    if (deleted === 0) {
      res.status(404).json({ error: 'Knowledge attachment not found' });
      return;
    }

    res.json({ message: 'Knowledge detached from bot successfully' });
  } catch (error) {
    console.error('Error detaching knowledge from bot:', error);
    res.status(500).json({ error: 'Failed to detach knowledge from bot' });
  }
});

export default router;
