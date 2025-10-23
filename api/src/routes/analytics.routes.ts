import { Router } from 'express';
import { Message } from '../models/index.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';

const router = Router();

// GET /api/analytics - Получить аналитику за период
router.get('/', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Определяем начальную дату в зависимости от периода
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Общее количество сообщений за период
    const totalMessages = await Message.count({
      where: {
        created_at: {
          [Op.gte]: startDate
        }
      }
    });

    // Успешные сообщения
    const successfulMessages = await Message.count({
      where: {
        created_at: {
          [Op.gte]: startDate
        },
        status: 'completed'
      }
    });

    // Среднее время обработки (в секундах)
    const avgTimeResult = await Message.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.literal('EXTRACT(EPOCH FROM (updated_at - created_at))')), 'avg_time']
      ],
      where: {
        created_at: {
          [Op.gte]: startDate
        },
        status: 'completed'
      },
      raw: true
    });

    const avgTime = avgTimeResult[0]?.avg_time ? parseFloat(avgTimeResult[0].avg_time as any) : 0;

    // Активные лиды (уникальные lead_id за период)
    const activeLeads = await Message.count({
      distinct: true,
      col: 'lead_id',
      where: {
        created_at: {
          [Op.gte]: startDate
        }
      }
    });

    // Success rate
    const successRate = totalMessages > 0
      ? Math.round((successfulMessages / totalMessages) * 100 * 10) / 10
      : 0;

    // Данные по дням для графиков
    const dailyStats = await Message.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN status = 'completed' THEN 1 END`)), 'successful']
      ],
      where: {
        created_at: {
          [Op.gte]: startDate
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    res.json({
      total_messages: totalMessages,
      success_rate: successRate,
      avg_time: Math.round(avgTime * 10) / 10,
      active_leads: activeLeads,
      daily_stats: dailyStats,
      period
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;