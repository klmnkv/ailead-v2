import { Router } from 'express';
import { Op } from 'sequelize';
import { Integration } from '../models/Integration.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Проверка статуса плагина
 * POST /api/webhook/plugin-status
 */
/**
 * Проверка статуса плагина
 * POST /api/webhook/plugin-status
 */
/**
 * Проверка статуса плагина
 * POST /api/webhook/plugin-status
 */
router.post('/plugin-status', async (req, res) => {
    try {
        const { client_id, domain } = req.body;

        logger.info('📥 Plugin status check', { client_id, domain });
        console.log('📥 [DEBUG] Request:', { client_id, domain });

        if (!domain) {
            logger.info('❌ Domain not provided');
            return res.json({ status: -1 });
        }

        // Нормализуем домен
        const normalizedDomain = domain.replace(/^https?:\/\//, '');
        console.log('🔍 [DEBUG] Normalized domain:', normalizedDomain);

        // ПРОСТОЙ поиск по точному совпадению domain
        let integration = await Integration.findOne({
            where: { domain: normalizedDomain }
        });

        console.log('🔍 [DEBUG] Search by domain result:', integration ? `FOUND id=${integration.id}` : 'NOT FOUND');

        // Если не найдено - пробуем по base_url
        if (!integration) {
            integration = await Integration.findOne({
                where: { base_url: `https://${normalizedDomain}` }
            });
            console.log('🔍 [DEBUG] Search by base_url result:', integration ? `FOUND id=${integration.id}` : 'NOT FOUND');
        }

        // Если всё ещё не найдено - выводим все записи для отладки
        if (!integration) {
            const all = await Integration.findAll({
                attributes: ['id', 'domain', 'base_url', 'status'],
                limit: 5
            });
            console.log('📊 [DEBUG] All integrations:', JSON.stringify(all, null, 2));

            logger.info('❌ Integration not found');
            return res.json({ status: 0 });
        }

        console.log('✅ [DEBUG] Integration found:', {
            id: integration.id,
            domain: integration.domain,
            base_url: integration.base_url,
            status: integration.status
        });

        logger.info('✅ Integration found:', {
            id: integration.id,
            status: integration.status
        });

        if (integration.status === 'active') {
            console.log('✅ [DEBUG] Returning status: 1');
            logger.info('✅ Integration active');
            return res.json({ status: 1 });
        }

        console.log('⚠️ [DEBUG] Status not active:', integration.status);
        logger.info('⚠️ Integration not active');
        return res.json({ status: 0 });

    } catch (error: any) {
        console.error('❌ [DEBUG] Error:', error);
        logger.error('❌ Plugin status check error', error.message);
        return res.json({ status: 0 });
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

/**
 * ВРЕМЕННЫЙ DEBUG ENDPOINT - для отладки
 * GET /api/webhook/debug-integrations
 */
router.get('/debug-integrations', async (req, res) => {
    try {
        const integrations = await Integration.findAll({
            attributes: ['id', 'account_id', 'amocrm_account_id', 'domain', 'base_url', 'client_id', 'status', 'token_expiry'],
            limit: 10,
            order: [['id', 'DESC']]
        });

        res.json({
            count: integrations.length,
            integrations: integrations.map(i => ({
                id: i.id,
                account_id: i.account_id,
                amocrm_account_id: i.amocrm_account_id,
                domain: i.domain,
                base_url: i.base_url,
                client_id: i.client_id,
                status: i.status,
                token_expiry: i.token_expiry,
                token_expiry_date: new Date(i.token_expiry * 1000).toISOString()
            }))
        });
    } catch (error: any) {
        logger.error('Debug endpoint error', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

