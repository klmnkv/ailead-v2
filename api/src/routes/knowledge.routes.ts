import express from 'express';
import { KnowledgeBase } from '../models/index.js';

const router = express.Router();

// GET /api/knowledge - Получить все записи базы знаний
router.get('/', async (req, res) => {
  try {
    const accountId = parseInt(req.query.account_id as string) || 1;

    const items = await KnowledgeBase.findAll({
      where: { account_id: accountId },
      order: [['created_at', 'DESC']]
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

// GET /api/knowledge/:id - Получить одну запись
router.get('/:id', async (req, res) => {
  try {
    const accountId = parseInt(req.query.account_id as string) || 1;
    const { id } = req.params;

    const item = await KnowledgeBase.findOne({
      where: {
        id,
        account_id: accountId
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching knowledge base item:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base item' });
  }
});

// POST /api/knowledge - Создать новую запись
router.post('/', async (req, res) => {
  try {
    const accountId = parseInt(req.body.account_id as string) || 1;
    const { title, content, category, is_active } = req.body;

    // Валидация
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const item = await KnowledgeBase.create({
      account_id: accountId,
      title: title.trim(),
      content: content.trim(),
      category: category?.trim() || null,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating knowledge base item:', error);
    res.status(500).json({ error: 'Failed to create knowledge base item' });
  }
});

// PUT /api/knowledge/:id - Обновить запись
router.put('/:id', async (req, res) => {
  try {
    const accountId = parseInt(req.body.account_id as string) || 1;
    const { id } = req.params;
    const { title, content, category, is_active } = req.body;

    const item = await KnowledgeBase.findOne({
      where: {
        id,
        account_id: accountId
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Валидация
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    if (content !== undefined && !content.trim()) {
      return res.status(400).json({ error: 'Content cannot be empty' });
    }

    // Обновляем только переданные поля
    if (title !== undefined) item.title = title.trim();
    if (content !== undefined) item.content = content.trim();
    if (category !== undefined) item.category = category?.trim() || null;
    if (is_active !== undefined) item.is_active = is_active;

    await item.save();

    res.json(item);
  } catch (error) {
    console.error('Error updating knowledge base item:', error);
    res.status(500).json({ error: 'Failed to update knowledge base item' });
  }
});

// DELETE /api/knowledge/:id - Удалить запись
router.delete('/:id', async (req, res) => {
  try {
    const accountId = parseInt(req.query.account_id as string) || 1;
    const { id } = req.params;

    const item = await KnowledgeBase.findOne({
      where: {
        id,
        account_id: accountId
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Record not found' });
    }

    await item.destroy();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge base item:', error);
    res.status(500).json({ error: 'Failed to delete knowledge base item' });
  }
});

export default router;
