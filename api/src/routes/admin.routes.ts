import { Router } from 'express';
import { Integration } from '../models/Integration.js';
import { Account } from '../models/Account.js';
import { Message } from '../models/Message.js';
import { sequelize } from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/admin/integrations
 * Получить список всех интеграций с информацией об аккаунтах
 */
router.get('/integrations', async (req, res) => {
  try {
    const integrations = await sequelize.query(`
      SELECT
        i.id,
        i.account_id,
        i.amocrm_account_id,
        i.domain,
        i.base_url,
        i.status,
        i.created_at,
        i.updated_at,
        a.email,
        a.company_name,
        a.subscription_plan,
        -- Статистика сообщений за последние 7 дней
        (SELECT COUNT(*) FROM messages m WHERE m.integration_id = i.id AND m.created_at >= NOW() - INTERVAL '7 days') as messages_last_7_days,
        -- Количество ошибок за последние 24 часа
        (SELECT COUNT(*) FROM messages m WHERE m.integration_id = i.id AND m.status = 'failed' AND m.created_at >= NOW() - INTERVAL '24 hours') as errors_last_24h,
        -- Среднее время обработки за последние 100 сообщений
        (SELECT AVG(processing_time) FROM (
          SELECT processing_time FROM messages m
          WHERE m.integration_id = i.id AND m.processing_time IS NOT NULL
          ORDER BY m.created_at DESC LIMIT 100
        ) sub) as avg_response_time,
        -- Количество уникальных лидов за последние 30 дней
        (SELECT COUNT(DISTINCT lead_id) FROM messages m WHERE m.integration_id = i.id AND m.created_at >= NOW() - INTERVAL '30 days') as unique_leads_30d
      FROM integrations i
      LEFT JOIN accounts a ON i.account_id = a.id
      ORDER BY i.created_at DESC
    `, { type: QueryTypes.SELECT });

    res.json({
      success: true,
      data: integrations,
      total: integrations.length
    });
  } catch (error: any) {
    logger.error('Error fetching integrations list:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/integrations/:id
 * Получить детальную информацию об интеграции
 */
router.get('/integrations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Основная информация об интеграции
    const integration = await sequelize.query(`
      SELECT
        i.*,
        a.email,
        a.company_name,
        a.subscription_plan,
        a.token_balance
      FROM integrations i
      LEFT JOIN accounts a ON i.account_id = a.id
      WHERE i.id = :id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT,
      plain: true
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    // Статистика сообщений по дням за последние 30 дней
    const dailyStats = await sequelize.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total_messages,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        AVG(processing_time) as avg_processing_time
      FROM messages
      WHERE integration_id = :id
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    // Последние ошибки
    const recentErrors = await sequelize.query(`
      SELECT
        id,
        lead_id,
        message_text,
        error_message,
        created_at,
        processing_time
      FROM messages
      WHERE integration_id = :id
        AND status = 'failed'
      ORDER BY created_at DESC
      LIMIT 50
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    // Сценарии (боты) для этого аккаунта
    const scenarios = await sequelize.query(`
      SELECT
        id,
        name,
        description,
        is_active,
        priority,
        created_at,
        updated_at
      FROM scenarios
      WHERE account_id = :account_id
      ORDER BY priority DESC, created_at DESC
    `, {
      replacements: { account_id: integration.account_id },
      type: QueryTypes.SELECT
    });

    // Общая статистика
    const overallStats = await sequelize.query(`
      SELECT
        COUNT(*) as total_messages,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_messages,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_messages,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_messages,
        AVG(processing_time) as avg_processing_time,
        MIN(processing_time) as min_processing_time,
        MAX(processing_time) as max_processing_time,
        COUNT(DISTINCT lead_id) as unique_leads
      FROM messages
      WHERE integration_id = :id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT,
      plain: true
    });

    res.json({
      success: true,
      data: {
        integration,
        scenarios,
        daily_stats: dailyStats,
        recent_errors: recentErrors,
        overall_stats: overallStats
      }
    });
  } catch (error: any) {
    logger.error('Error fetching integration details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/integrations/:id/errors
 * Получить логи ошибок для интеграции с пагинацией
 */
router.get('/integrations/:id/errors', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Получаем account_id для интеграции
    const integration = await Integration.findByPk(parseInt(id));
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    // Получаем ошибки из error_logs
    const errorLogs = await sequelize.query(`
      SELECT
        id,
        job_id,
        error_type,
        error_message,
        created_at,
        context
      FROM error_logs
      WHERE account_id = :account_id
      ORDER BY created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: {
        account_id: integration.account_id,
        limit,
        offset
      },
      type: QueryTypes.SELECT
    });

    // Получаем общее количество ошибок
    const [{ total }] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM error_logs
      WHERE account_id = :account_id
    `, {
      replacements: { account_id: integration.account_id },
      type: QueryTypes.SELECT
    }) as any[];

    res.json({
      success: true,
      data: errorLogs,
      pagination: {
        page,
        limit,
        total: parseInt(total),
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    logger.error('Error fetching error logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/integrations/:id/response-times
 * Получить статистику времени ответа по часам за последние 24 часа
 */
router.get('/integrations/:id/response-times', async (req, res) => {
  try {
    const { id } = req.params;

    const responseTimesData = await sequelize.query(`
      SELECT
        DATE_TRUNC('hour', created_at) as hour,
        AVG(processing_time) as avg_time,
        MIN(processing_time) as min_time,
        MAX(processing_time) as max_time,
        COUNT(*) as message_count
      FROM messages
      WHERE integration_id = :id
        AND processing_time IS NOT NULL
        AND created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hour ASC
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: responseTimesData
    });
  } catch (error: any) {
    logger.error('Error fetching response times:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/admin/integrations/:id/status
 * Обновить статус интеграции (активна/неактивна)
 */
router.patch('/integrations/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'error'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: active, inactive, error'
      });
    }

    const integration = await Integration.findByPk(parseInt(id));
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    await integration.update({ status });

    res.json({
      success: true,
      data: integration.toJSON()
    });
  } catch (error: any) {
    logger.error('Error updating integration status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/stats/overview
 * Получить общую статистику по всем интеграциям
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await sequelize.query(`
      SELECT
        COUNT(DISTINCT i.id) as total_integrations,
        COUNT(DISTINCT i.account_id) as total_accounts,
        COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.id END) as active_integrations,
        COUNT(DISTINCT m.id) as total_messages,
        COUNT(DISTINCT CASE WHEN m.created_at >= NOW() - INTERVAL '24 hours' THEN m.id END) as messages_24h,
        COUNT(DISTINCT CASE WHEN m.status = 'failed' AND m.created_at >= NOW() - INTERVAL '24 hours' THEN m.id END) as errors_24h,
        AVG(m.processing_time) as avg_processing_time
      FROM integrations i
      LEFT JOIN messages m ON i.id = m.integration_id
    `, {
      type: QueryTypes.SELECT,
      plain: true
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error fetching overview stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
