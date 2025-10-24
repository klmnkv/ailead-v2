import { Router } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

// URL Next.js админки
const NEXT_ADMIN_URL = process.env.NEXT_ADMIN_URL || 'http://localhost:3000';

/**
 * Админ-панель управления ботом - редирект на Next.js
 * GET /iframe/panel/:account_id
 */
router.get('/panel/:account_id', async (req, res) => {
    const { account_id } = req.params;

    logger.info('🔧 Admin panel opened, redirecting to Next.js', { account_id });

    // Редирект на Next.js админку с сохранением account_id
    res.redirect(`${NEXT_ADMIN_URL}/bots?account_id=${account_id}`);
});

/**
 * Универсальный редирект для всех страниц админки
 */
router.get('/admin/:page?', async (req, res) => {
    const { page } = req.params;
    const account_id = req.query.account_id;

    const path = page || 'bots';
    const queryString = account_id ? `?account_id=${account_id}` : '';

    logger.info('🔧 Admin page redirect', { page: path, account_id });

    res.redirect(`${NEXT_ADMIN_URL}/${path}${queryString}`);
});

export default router;
