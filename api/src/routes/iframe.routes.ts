import { Router } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Админ-панель управления ботом
 * GET /iframe/panel/:account_id
 */
router.get('/panel/:account_id', async (req, res) => {
    const { account_id } = req.params;

    logger.info('🔧 Admin panel opened', { account_id });

    // URL новой админ панели на Next.js
    const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:3000';

    // Встраиваем новую админ панель через iframe
    res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI.LEAD - Админ панель</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body, html {
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        #admin-frame {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }

        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">
        <div class="spinner"></div>
        <p>Загрузка админ панели...</p>
    </div>
    <iframe
        id="admin-frame"
        src="${adminPanelUrl}?account_id=${account_id}"
        onload="document.getElementById('loading').style.display='none'">
    </iframe>
</body>
</html>
    `);
});

export default router;