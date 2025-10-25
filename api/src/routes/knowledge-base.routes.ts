import express from 'express';
import { KnowledgeBase } from '../models/KnowledgeBase.js';
import { KnowledgeBaseItem } from '../models/KnowledgeBaseItem.js';
import { logger } from '../utils/logger.js';
import { Op } from 'sequelize';

const router = express.Router();

// ============================================
// KNOWLEDGE BASES
// ============================================

// GET /api/knowledge-bases - Получить все базы знаний
router.get('/', async (req, res) => {
  try {
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({ error: 'account_id is required' });
    }

    const knowledgeBases = await KnowledgeBase.findAll({
      where: { account_id: Number(account_id) },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']],
    });

    // Добавляем количество элементов для каждой базы знаний
    const knowledgeBasesWithCount = await Promise.all(
      knowledgeBases.map(async (kb) => {
        const items_count = await KnowledgeBaseItem.count({
          where: { knowledge_base_id: kb.id },
        });
        return {
          ...kb.toJSON(),
          items_count,
        };
      })
    );

    logger.info(`Found ${knowledgeBases.length} knowledge bases for account ${account_id}`);
    res.json(knowledgeBasesWithCount);
  } catch (error: any) {
    logger.error('Error fetching knowledge bases:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch knowledge bases' });
  }
});

// POST /api/knowledge-bases - Создать базу знаний
router.post('/', async (req, res) => {
  try {
    const { account_id, name, description, is_active, is_default } = req.body;

    if (!account_id || !name) {
      return res.status(400).json({ error: 'account_id and name are required' });
    }

    // Если is_default = true, сбрасываем флаг у других баз знаний
    if (is_default) {
      await KnowledgeBase.update(
        { is_default: false },
        { where: { account_id: Number(account_id) } }
      );
    }

    const knowledgeBase = await KnowledgeBase.create({
      account_id,
      name,
      description,
      is_active: is_active !== undefined ? is_active : true,
      is_default: is_default || false,
    });

    logger.info(`Created knowledge base ${knowledgeBase.id} for account ${account_id}`);
    res.status(201).json(knowledgeBase.toJSON());
  } catch (error: any) {
    logger.error('Error creating knowledge base:', error);
    res.status(500).json({ error: error.message || 'Failed to create knowledge base' });
  }
});

// PUT /api/knowledge-bases/:id - Обновить базу знаний
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const knowledgeBase = await KnowledgeBase.findByPk(id);

    if (!knowledgeBase) {
      return res.status(404).json({ error: 'Knowledge base not found' });
    }

    // Если is_default = true, сбрасываем флаг у других баз знаний
    if (updateData.is_default) {
      await KnowledgeBase.update(
        { is_default: false },
        { where: { account_id: knowledgeBase.account_id, id: { [Op.ne]: id } } }
      );
    }

    await knowledgeBase.update(updateData);
    logger.info(`Updated knowledge base ${id}`);
    res.json(knowledgeBase.toJSON());
  } catch (error: any) {
    logger.error('Error updating knowledge base:', error);
    res.status(500).json({ error: error.message || 'Failed to update knowledge base' });
  }
});

// DELETE /api/knowledge-bases/:id - Удалить базу знаний
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const knowledgeBase = await KnowledgeBase.findByPk(id);

    if (!knowledgeBase) {
      return res.status(404).json({ error: 'Knowledge base not found' });
    }

    // Удаляем базу знаний (элементы удалятся автоматически через CASCADE)
    await knowledgeBase.destroy();

    logger.info(`Deleted knowledge base ${id}`);
    res.json({ success: true, message: 'Knowledge base deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting knowledge base:', error);
    res.status(500).json({ error: error.message || 'Failed to delete knowledge base' });
  }
});

// GET /api/knowledge-bases/:id/items - Получить элементы базы знаний
router.get('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;

    const knowledgeBase = await KnowledgeBase.findByPk(id);

    if (!knowledgeBase) {
      return res.status(404).json({ error: 'Knowledge base not found' });
    }

    const items = await KnowledgeBaseItem.findAll({
      where: { knowledge_base_id: Number(id) },
      order: [['created_at', 'DESC']],
    });

    logger.info(`Found ${items.length} items for knowledge base ${id}`);
    res.json(items);
  } catch (error: any) {
    logger.error('Error fetching knowledge base items:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch knowledge base items' });
  }
});

// ============================================
// KNOWLEDGE BASE ITEMS
// ============================================

// POST /api/knowledge-base-items - Создать элемент базы знаний
router.post('/items', async (req, res) => {
  try {
    const { knowledge_base_id, title, content, type, metadata } = req.body;

    if (!knowledge_base_id || !title || !content) {
      return res.status(400).json({
        error: 'knowledge_base_id, title, and content are required',
      });
    }

    // Проверяем, существует ли база знаний
    const knowledgeBase = await KnowledgeBase.findByPk(knowledge_base_id);
    if (!knowledgeBase) {
      return res.status(404).json({ error: 'Knowledge base not found' });
    }

    const item = await KnowledgeBaseItem.create({
      knowledge_base_id,
      title,
      content,
      type: type || 'text',
      metadata,
    });

    logger.info(`Created knowledge base item ${item.id} for KB ${knowledge_base_id}`);
    res.status(201).json(item.toJSON());
  } catch (error: any) {
    logger.error('Error creating knowledge base item:', error);
    res.status(500).json({ error: error.message || 'Failed to create knowledge base item' });
  }
});

// PUT /api/knowledge-base-items/:id - Обновить элемент базы знаний
router.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const item = await KnowledgeBaseItem.findByPk(id);

    if (!item) {
      return res.status(404).json({ error: 'Knowledge base item not found' });
    }

    await item.update(updateData);
    logger.info(`Updated knowledge base item ${id}`);
    res.json(item.toJSON());
  } catch (error: any) {
    logger.error('Error updating knowledge base item:', error);
    res.status(500).json({ error: error.message || 'Failed to update knowledge base item' });
  }
});

// DELETE /api/knowledge-base-items/:id - Удалить элемент базы знаний
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await KnowledgeBaseItem.findByPk(id);

    if (!item) {
      return res.status(404).json({ error: 'Knowledge base item not found' });
    }

    await item.destroy();
    logger.info(`Deleted knowledge base item ${id}`);
    res.json({ success: true, message: 'Knowledge base item deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting knowledge base item:', error);
    res.status(500).json({ error: error.message || 'Failed to delete knowledge base item' });
  }
});

export default router;
