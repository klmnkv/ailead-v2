import { Router } from 'express';
import { Scenario } from '../models/index.js';

const router = Router();

// GET /api/scenarios - Получить все сценарии
router.get('/', async (_req, res) => {
  try {
    const scenarios = await Scenario.findAll({
      order: [['created_at', 'DESC']]
    });
    return res.json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// GET /api/scenarios/:id - Получить сценарий по ID
router.get('/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findByPk(req.params.id);

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    return res.json(scenario);
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return res.status(500).json({ error: 'Failed to fetch scenario' });
  }
});

// POST /api/scenarios - Создать новый сценарий
router.post('/', async (req, res) => {
  try {
    const { name, description, is_active, steps, trigger_type, trigger_conditions, actions } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const scenario = await Scenario.create({
      name,
      description: description || '',
      is_active: is_active || false,
      steps: steps || 0,
      trigger_type: trigger_type || 'manual',
      trigger_conditions: trigger_conditions || {},
      actions: actions || [],
      runs_count: 0
    });

    return res.status(201).json(scenario);
  } catch (error) {
    console.error('Error creating scenario:', error);
    return res.status(500).json({ error: 'Failed to create scenario' });
  }
});

// PUT /api/scenarios/:id - Обновить сценарий
router.put('/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findByPk(req.params.id);

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    const { name, description, is_active, steps, trigger_type, trigger_conditions, actions } = req.body;

    await scenario.update({
      name: name !== undefined ? name : scenario.name,
      description: description !== undefined ? description : scenario.description,
      is_active: is_active !== undefined ? is_active : scenario.is_active,
      steps: steps !== undefined ? steps : scenario.steps,
      trigger_type: trigger_type !== undefined ? trigger_type : scenario.trigger_type,
      trigger_conditions: trigger_conditions !== undefined ? trigger_conditions : scenario.trigger_conditions,
      actions: actions !== undefined ? actions : scenario.actions
    });

    return res.json(scenario);
  } catch (error) {
    console.error('Error updating scenario:', error);
    return res.status(500).json({ error: 'Failed to update scenario' });
  }
});

// DELETE /api/scenarios/:id - Удалить сценарий
router.delete('/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findByPk(req.params.id);

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    await scenario.destroy();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return res.status(500).json({ error: 'Failed to delete scenario' });
  }
});

// POST /api/scenarios/:id/duplicate - Дублировать сценарий
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await Scenario.findByPk(req.params.id);

    if (!original) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    const duplicate = await Scenario.create({
      name: `${original.name} (копия)`,
      description: original.description,
      is_active: false, // Копия всегда неактивна по умолчанию
      steps: original.steps,
      trigger_type: original.trigger_type,
      trigger_conditions: original.trigger_conditions,
      actions: original.actions,
      runs_count: 0
    });

    return res.status(201).json(duplicate);
  } catch (error) {
    console.error('Error duplicating scenario:', error);
    return res.status(500).json({ error: 'Failed to duplicate scenario' });
  }
});

// POST /api/scenarios/:id/toggle - Переключить активность сценария
router.post('/:id/toggle', async (req, res) => {
  try {
    const scenario = await Scenario.findByPk(req.params.id);

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    await scenario.update({
      is_active: !scenario.is_active
    });

    return res.json(scenario);
  } catch (error) {
    console.error('Error toggling scenario:', error);
    return res.status(500).json({ error: 'Failed to toggle scenario' });
  }
});

export default router;