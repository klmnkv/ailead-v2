import { Router } from 'express';
import { Op } from 'sequelize'; // ← ДОБАВИЛИ ЭТОТ ИМПОРТ
import { Integration } from '../models/Integration.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Проверка статуса плагина
 * POST /api/webhook/plugin-status
 */
router.post('/plugin-status', async (req, res) => {
    try {
        const { client_id, domain } = req.body;

        logger.info('📥 Plugin status check', { client_id, domain });

        if (!domain) {
            return res.json({ status: -1 });
        }

        // Ищем интеграцию по домену ИЛИ по base_url (для старых записей)
        const integration = await Integration.findOne({
            where: {
                [Op.or]: [
                    { domain: domain },
                    { base_url: `https://${domain}` }
                ]
            }
        });

        if (!integration) {
            logger.info('❌ Integration not found');
            return res.json({ status: -1 });
        }

        // Проверяем статус и валидность токена
        const now = Math.floor(Date.now() / 1000);

        if (integration.status === 'active' && integration.token_expiry > now) {
            logger.info('✅ Integration active');
            return res.json({ status: 1 });
        }

        logger.info('⚠️ Integration registered but not active');
        return res.json({ status: 0 });

    } catch (error: any) {
        logger.error('❌ Plugin status check error', error);
        return res.json({ status: -1 });
    }
});

/**
 * Проверка статуса бота для конкретного лида
 * POST /api/webhook/bot-status
 */
router.post('/bot-status', async (req, res) => {
    try {
        const { lead_id, domain } = req.body;

        logger.info('📥 Bot status check', { lead_id, domain });

        // TODO: Реализовать логику проверки статуса бота для лида
        // Здесь должна быть проверка в БД, включен ли бот для этого лида

        res.json({ status: false });

    } catch (error: any) {
        logger.error('❌ Bot status check error', error);
        res.json({ status: false });
    }
});

/**
 * Переключение статуса бота
 * POST /api/webhook/bot-switch
 */
router.post('/bot-switch', async (req, res) => {
    try {
        const { lead_id, domain } = req.body;

        logger.info('📥 Bot switch', { lead_id, domain });

        // TODO: Реализовать логику включения/выключения бота для лида

        res.json({ status: true });

    } catch (error: any) {
        logger.error('❌ Bot switch error', error);
        res.json({ status: false });
    }
});

/**
 * Webhook для получения событий от amoCRM
 * POST /api/webhook
 */
router.post('/', async (req, res) => {
    try {
        const events = req.body;

        logger.info('📥 Webhook received', {
            count: events?.length || 0
        });

        // TODO: Обработка событий webhook

        res.status(200).send('OK');

    } catch (error: any) {
        logger.error('❌ Webhook processing error', error);
        res.status(500).send('Error');
    }
});

export default router;