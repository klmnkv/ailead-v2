import { Request, Response } from 'express';
import { Integration } from '../models/Integration.js';
import { Message } from '../models/Message.js';
import { Account } from '../models/Account.js';
import { logger } from '../utils/logger.js';
import { Op } from 'sequelize';
import sequelize from '../database.js';

/**
 * Получить список всех интеграций
 * GET /api/company-admin/integrations
 */
export const getAllIntegrations = async (req: Request, res: Response) => {
    try {
        const { search, status } = req.query;

        const whereConditions: any = {};

        if (search) {
            whereConditions.domain = {
                [Op.like]: `%${search}%`
            };
        }

        if (status && status !== 'all') {
            whereConditions.status = status;
        }

        const integrations = await Integration.findAll({
            where: whereConditions,
            include: [
                {
                    model: Account,
                    as: 'account',
                    attributes: ['id', 'email', 'company_name']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Добавляем статистику для каждой интеграции
        const integrationsWithStats = await Promise.all(
            integrations.map(async (integration) => {
                const messageCount = await Message.count({
                    where: { integration_id: integration.id }
                });

                const errorCount = await Message.count({
                    where: {
                        integration_id: integration.id,
                        status: 'failed'
                    }
                });

                return {
                    ...integration.toJSON(),
                    message_count: messageCount,
                    error_count: errorCount
                };
            })
        );

        res.json({
            integrations: integrationsWithStats
        });
    } catch (error: any) {
        logger.error('Error fetching integrations:', error);
        res.status(500).json({ error: 'Failed to fetch integrations' });
    }
};

/**
 * Получить детали интеграции
 * GET /api/company-admin/integrations/:id
 */
export const getIntegrationDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const integration = await Integration.findByPk(id, {
            include: [
                {
                    model: Account,
                    as: 'account',
                    attributes: ['id', 'email', 'company_name']
                }
            ]
        });

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        // Статистика сообщений
        const messageStats = await Message.findAll({
            where: { integration_id: integration.id },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completed'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pending']
            ],
            raw: true
        });

        const stats = messageStats[0] as any;

        res.json({
            integration: integration.toJSON(),
            stats: {
                total_messages: parseInt(stats.total) || 0,
                completed: parseInt(stats.completed) || 0,
                failed: parseInt(stats.failed) || 0,
                pending: parseInt(stats.pending) || 0
            }
        });
    } catch (error: any) {
        logger.error('Error fetching integration details:', error);
        res.status(500).json({ error: 'Failed to fetch integration details' });
    }
};

/**
 * Получить историю сообщений для интеграции
 * GET /api/company-admin/integrations/:id/messages
 */
export const getIntegrationMessages = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        const whereConditions: any = { integration_id: parseInt(id) };

        if (status && status !== 'all') {
            whereConditions.status = status;
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const { count, rows: messages } = await Message.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limit as string),
            offset,
            order: [['created_at', 'DESC']],
            attributes: [
                'id',
                'lead_id',
                'message_text',
                'status',
                'processing_time',
                'created_at',
                'completed_at',
                'error_message'
            ]
        });

        res.json({
            messages,
            pagination: {
                total: count,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total_pages: Math.ceil(count / parseInt(limit as string))
            }
        });
    } catch (error: any) {
        logger.error('Error fetching integration messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

/**
 * Получить список ошибок для интеграции
 * GET /api/company-admin/integrations/:id/errors
 */
export const getIntegrationErrors = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { limit = 50 } = req.query;

        const errors = await Message.findAll({
            where: {
                integration_id: parseInt(id),
                status: 'failed',
                error_message: {
                    [Op.not]: null
                }
            },
            limit: parseInt(limit as string),
            order: [['created_at', 'DESC']],
            attributes: [
                'id',
                'lead_id',
                'message_text',
                'error_message',
                'created_at'
            ]
        });

        res.json({ errors });
    } catch (error: any) {
        logger.error('Error fetching integration errors:', error);
        res.status(500).json({ error: 'Failed to fetch errors' });
    }
};

/**
 * Получить настройки бота для интеграции
 * GET /api/company-admin/integrations/:id/bot-config
 */
export const getBotConfig = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const integration = await Integration.findByPk(id);

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        // TODO: Реализовать получение настроек бота из отдельной таблицы
        // Пока возвращаем заглушку
        res.json({
            bot_enabled: true,
            gpt_model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 500,
            system_prompt: 'Ты профессиональный менеджер по продажам...',
            updated_at: new Date()
        });
    } catch (error: any) {
        logger.error('Error fetching bot config:', error);
        res.status(500).json({ error: 'Failed to fetch bot config' });
    }
};

/**
 * Обновить настройки бота для интеграции
 * PUT /api/company-admin/integrations/:id/bot-config
 */
export const updateBotConfig = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { bot_enabled, gpt_model, temperature, max_tokens, system_prompt } = req.body;

        const integration = await Integration.findByPk(id);

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        // TODO: Реализовать сохранение настроек бота в отдельную таблицу
        logger.info('Bot config update requested', {
            integration_id: id,
            bot_enabled,
            gpt_model
        });

        res.json({
            success: true,
            message: 'Bot config updated successfully'
        });
    } catch (error: any) {
        logger.error('Error updating bot config:', error);
        res.status(500).json({ error: 'Failed to update bot config' });
    }
};
