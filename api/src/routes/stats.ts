import express from 'express';
import { Message } from '../models';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/stats/today - Статистика за сегодня
router.get('/today', async (_req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Статистика за сегодня
    const todayStats = await Message.count({
      where: {
        created_at: {
          [Op.gte]: today,
        },
      },
    });

    const todaySuccess = await Message.count({
      where: {
        created_at: {
          [Op.gte]: today,
        },
        status: 'completed',
      },
    });

    // Статистика за вчера
    const yesterdayStats = await Message.count({
      where: {
        created_at: {
          [Op.gte]: yesterday,
          [Op.lt]: today,
        },
      },
    });

    const yesterdaySuccess = await Message.count({
      where: {
        created_at: {
          [Op.gte]: yesterday,
          [Op.lt]: today,
        },
        status: 'completed',
      },
    });

    // Подсчет изменений
    const messagesChange =
      yesterdayStats > 0
        ? Math.round(((todayStats - yesterdayStats) / yesterdayStats) * 100)
        : 0;

    const successChange =
      yesterdaySuccess > 0
        ? Math.round(((todaySuccess - yesterdaySuccess) / yesterdaySuccess) * 100)
        : 0;

    res.json({
      processed_leads: Math.floor(todayStats * 0.6), // Примерно 60% от сообщений
      processed_leads_change: messagesChange,
      messages_sent: todayStats,
      messages_sent_change: messagesChange,
      successful_dialogs: todaySuccess,
      successful_dialogs_change: successChange,
    });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ error: 'Failed to fetch daily stats' });
  }
});

export default router;