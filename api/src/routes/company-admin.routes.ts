import { Router } from 'express';
import {
    getAllIntegrations,
    getIntegrationDetails,
    getIntegrationMessages,
    getIntegrationErrors,
    getBotConfig,
    updateBotConfig
} from '../controllers/company-admin.controller.js';

const router = Router();

/**
 * GET /api/company-admin/integrations
 * Получить список всех интеграций
 */
router.get('/integrations', getAllIntegrations);

/**
 * GET /api/company-admin/integrations/:id
 * Получить детали интеграции
 */
router.get('/integrations/:id', getIntegrationDetails);

/**
 * GET /api/company-admin/integrations/:id/messages
 * Получить историю сообщений для интеграции
 */
router.get('/integrations/:id/messages', getIntegrationMessages);

/**
 * GET /api/company-admin/integrations/:id/errors
 * Получить список ошибок для интеграции
 */
router.get('/integrations/:id/errors', getIntegrationErrors);

/**
 * GET /api/company-admin/integrations/:id/bot-config
 * Получить настройки бота для интеграции
 */
router.get('/integrations/:id/bot-config', getBotConfig);

/**
 * PUT /api/company-admin/integrations/:id/bot-config
 * Обновить настройки бота для интеграции
 */
router.put('/integrations/:id/bot-config', updateBotConfig);

export default router;
