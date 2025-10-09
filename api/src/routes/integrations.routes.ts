import { Router } from 'express';
import axios from 'axios';
import { Integration } from '../models/Integration.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * OAuth callback от amoCRM
 * GET /api/integrations/amocrm/callback?code=xxx&state=xxx&referer=xxx
 */
router.get('/amocrm/callback', async (req, res) => {
    const { code, state, referer, client_id, error, error_description } = req.query;

    logger.info('📥 OAuth callback received');
    logger.info('Full URL:', req.url);
    logger.info('Query params:', req.query);
    logger.info('Headers:', {
        referer: req.headers.referer,
        origin: req.headers.origin,
        host: req.headers.host
    });

    // Проверяем, не пришла ли ошибка от amoCRM
    if (error) {
        logger.error('❌ OAuth error from amoCRM:', { error, error_description });

        return res.send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ошибка авторизации</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
                        padding: 20px;
                        margin: 0;
                    }
                    .error-card {
                        background: white;
                        padding: 40px;
                        border-radius: 20px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        text-align: center;
                        max-width: 500px;
                    }
                    h1 { color: #f5576c; margin-bottom: 20px; font-size: 28px; }
                    p { color: #666; margin-bottom: 20px; line-height: 1.6; }
                    .error-details {
                        background: #ffebee;
                        padding: 15px;
                        border-radius: 5px;
                        border-left: 4px solid #f5576c;
                        margin: 20px 0;
                        text-align: left;
                        font-family: monospace;
                        font-size: 13px;
                        color: #c62828;
                    }
                    button {
                        background: #f5576c;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                    }
                    button:hover { background: #e03e52; }
                </style>
            </head>
            <body>
                <div class="error-card">
                    <h1>❌ Ошибка авторизации</h1>
                    <p>К сожалению, произошла ошибка при подключении VoiceLead AI к amoCRM.</p>
                    
                    <div class="error-details">
                        <strong>Ошибка:</strong> ${error}<br>
                        <strong>Описание:</strong> ${error_description || 'Не указано'}
                    </div>
                    
                    <button onclick="window.close()">Закрыть окно</button>
                </div>
            </body>
            </html>
        `);
    }

    // Проверяем наличие code
    if (!code) {
        logger.error('❌ Authorization code not provided');
        logger.error('Received params:', { code, state, referer, client_id });

        return res.send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ошибка авторизации</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
                        padding: 20px;
                        margin: 0;
                    }
                    .error-card {
                        background: white;
                        padding: 40px;
                        border-radius: 20px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        text-align: center;
                        max-width: 600px;
                    }
                    h1 { color: #f5576c; margin-bottom: 20px; font-size: 28px; }
                    p { color: #666; margin-bottom: 15px; line-height: 1.6; }
                    button {
                        background: #f5576c;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                        margin: 5px;
                    }
                    button:hover { background: #e03e52; }
                </style>
            </head>
            <body>
                <div class="error-card">
                    <h1>❌ Authorization code not provided</h1>
                    <p>К сожалению, произошла ошибка при подключении VoiceLead AI к amoCRM.</p>
                    <button onclick="window.close()">Закрыть окно</button>
                </div>
            </body>
            </html>
        `);
    }

    try {
        logger.info('✅ Code received, exchanging for tokens...');

        // Определяем subdomain из referer
        const subdomain = (referer as string)?.replace('.amocrm.ru', '').replace('.amocrm.com', '') || 'kirilltihiy';
        const tokenUrl = `https://${subdomain}.amocrm.ru/oauth2/access_token`;

        logger.info('🔗 Token URL:', tokenUrl);

        const tokenRequestData = {
            client_id: process.env.AMOCRM_CLIENT_ID,
            client_secret: process.env.AMOCRM_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code as string,
            redirect_uri: `${process.env.API_DOMAIN || 'http://localhost:4000'}/api/integrations/amocrm/callback`
        };

        logger.info('Token request data:', {
            client_id: tokenRequestData.client_id,
            client_secret: '***hidden***',
            grant_type: tokenRequestData.grant_type,
            code: '***hidden***',
            redirect_uri: tokenRequestData.redirect_uri
        });

        // Обмениваем code на токены
        const tokenResponse = await axios.post(
            tokenUrl,
            tokenRequestData
        );

        const {
            access_token,
            refresh_token,
            expires_in,
            token_type
        } = tokenResponse.data;

        // ✅ ИСПРАВЛЕНИЕ: Используем subdomain из referer для base_domain
        const base_domain = `${subdomain}.amocrm.ru`;

        logger.info('✅ Tokens received', { base_domain, expires_in });

        // Получаем информацию об аккаунте amoCRM
        logger.info('📡 Fetching account info from:', `https://${base_domain}/api/v4/account`);

        const accountInfo = await axios.get(`https://${base_domain}/api/v4/account`, {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const amocrm_account_id = accountInfo.data.id;
        const accountSubdomain = accountInfo.data.subdomain || subdomain;

        logger.info('✅ Account info received', {
            amocrm_account_id,
            subdomain: accountSubdomain
        });

        // Извлекаем domain из state (если передан)
        const domain = (state as string && state !== 'false') ? state : `${accountSubdomain}.amocrm.ru`;

        logger.info('📝 Saving integration...', { domain, amocrm_account_id });

        // Сохраняем или обновляем интеграцию в БД
        const [integration, created] = await Integration.upsert({
            account_id: 1, // TODO: Получить из state или сессии
            amocrm_account_id: amocrm_account_id,
            base_url: `https://${base_domain}`,
            domain: domain,
            client_id: (client_id as string) || 'widget',
            access_token: access_token,
            refresh_token: refresh_token,
            token_expiry: Math.floor(Date.now() / 1000) + expires_in,
            status: 'active',
            last_sync_at: new Date()
        }, {
            returning: true
        });

        logger.info(created ? '✅ Integration created' : '✅ Integration updated', {
            integration_id: integration.id
        });

        // Регистрируем webhook в amoCRM (если еще не зарегистрирован)
        try {
            const webhookDestination = `${process.env.API_DOMAIN || 'http://localhost:4000'}/api/webhook`;

            logger.info('🔗 Checking webhooks at:', `https://${base_domain}/api/v4/webhooks`);

            // Проверяем существующие webhooks
            const webhooksResponse = await axios.get(
                `https://${base_domain}/api/v4/webhooks`,
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            const existingWebhook = webhooksResponse.data._embedded?.webhooks?.find(
                (hook: any) => hook.destination === webhookDestination
            );

            if (!existingWebhook) {
                // Создаем webhook
                await axios.post(
                    `https://${base_domain}/api/v4/webhooks`,
                    {
                        destination: webhookDestination,
                        settings: ['add_message']
                    },
                    { headers: { Authorization: `Bearer ${access_token}` } }
                );

                logger.info('✅ Webhook registered', { destination: webhookDestination });
            } else {
                logger.info('✅ Webhook already exists');
            }
        } catch (webhookError: any) {
            logger.error('⚠️ Failed to register webhook (non-critical)', webhookError.message);
        }

        // Отправляем красивую страницу успеха
        res.send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Авторизация успешна - VoiceLead AI</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                    }
                    
                    .success-card {
                        background: white;
                        padding: 50px 40px;
                        border-radius: 20px;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        text-align: center;
                        max-width: 500px;
                        width: 100%;
                        animation: slideIn 0.5s ease-out;
                    }
                    
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(-30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    .checkmark-container {
                        width: 100px;
                        height: 100px;
                        margin: 0 auto 30px;
                    }
                    
                    .checkmark {
                        width: 100px;
                        height: 100px;
                        border-radius: 50%;
                        display: block;
                        stroke-width: 3;
                        stroke: #4CAF50;
                        stroke-miterlimit: 10;
                        animation: fill 0.4s ease-in-out 0.4s forwards;
                    }
                    
                    .checkmark__circle {
                        stroke-dasharray: 166;
                        stroke-dashoffset: 166;
                        stroke-width: 3;
                        stroke-miterlimit: 10;
                        stroke: #4CAF50;
                        fill: none;
                        animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                    }
                    
                    .checkmark__check {
                        transform-origin: 50% 50%;
                        stroke-dasharray: 48;
                        stroke-dashoffset: 48;
                        animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
                    }
                    
                    @keyframes stroke {
                        100% {
                            stroke-dashoffset: 0;
                        }
                    }
                    
                    @keyframes fill {
                        100% {
                            box-shadow: inset 0px 0px 0px 50px #4CAF50;
                        }
                    }
                    
                    h1 {
                        color: #333;
                        font-size: 32px;
                        margin-bottom: 15px;
                        font-weight: 600;
                    }
                    
                    .subtitle {
                        color: #666;
                        font-size: 18px;
                        margin-bottom: 10px;
                        line-height: 1.6;
                    }
                    
                    .info {
                        background: #f5f5f5;
                        padding: 15px;
                        border-radius: 10px;
                        margin: 25px 0;
                        font-size: 14px;
                        color: #555;
                    }
                    
                    .info-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    
                    .info-item:last-child {
                        border-bottom: none;
                    }
                    
                    .info-label {
                        font-weight: 600;
                        color: #333;
                    }
                    
                    .info-value {
                        color: #667eea;
                    }
                    
                    .note {
                        font-size: 14px;
                        color: #999;
                        margin: 20px 0;
                    }
                    
                    button {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 15px 40px;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                        transition: transform 0.2s, box-shadow 0.2s;
                        margin-top: 10px;
                    }
                    
                    button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
                    }
                    
                    button:active {
                        transform: translateY(0);
                    }
                    
                    .countdown {
                        font-size: 12px;
                        color: #999;
                        margin-top: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="success-card">
                    <div class="checkmark-container">
                        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                            <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                    </div>
                    
                    <h1>✅ Авторизация успешна!</h1>
                    <p class="subtitle">VoiceLead AI успешно подключен к вашему amoCRM</p>
                    
                    <div class="info">
                        <div class="info-item">
                            <span class="info-label">Аккаунт:</span>
                            <span class="info-value">${accountSubdomain}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Домен:</span>
                            <span class="info-value">${base_domain}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Статус:</span>
                            <span class="info-value">✅ Активен</span>
                        </div>
                    </div>
                    
                    <p class="note">
                        Теперь вы можете вернуться в amoCRM и начать использовать бота.<br>
                        Все настройки доступны в карточке сделки.
                    </p>
                    
                    <button onclick="window.close()">Закрыть окно</button>
                    
                    <p class="countdown">Окно автоматически закроется через <span id="countdown">5</span> секунд</p>
                </div>
                
                <script>
                    // Автоматическое закрытие через 5 секунд
                    let seconds = 5;
                    const countdownElement = document.getElementById('countdown');
                    
                    const interval = setInterval(() => {
                        seconds--;
                        if (countdownElement) {
                            countdownElement.textContent = seconds;
                        }
                        
                        if (seconds <= 0) {
                            clearInterval(interval);
                            window.close();
                        }
                    }, 1000);
                    
                    // Попытка отправить сообщение родительскому окну
                    if (window.opener) {
                        window.opener.postMessage({ 
                            type: 'oauth_success',
                            subdomain: '${accountSubdomain}'
                        }, '*');
                    }
                </script>
            </body>
            </html>
        `);

    } catch (error: any) {
        logger.error('❌ OAuth callback error:', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });

        // Страница с ошибкой
        res.status(500).send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ошибка авторизации</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
                        padding: 20px;
                    }
                    .error-card {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        text-align: center;
                        max-width: 500px;
                    }
                    h1 { color: #f5576c; margin-bottom: 20px; }
                    p { color: #666; margin-bottom: 20px; line-height: 1.6; }
                    .error-details {
                        background: #ffebee;
                        padding: 15px;
                        border-radius: 5px;
                        border-left: 4px solid #f5576c;
                        margin: 20px 0;
                        text-align: left;
                        font-family: monospace;
                        font-size: 12px;
                        color: #c62828;
                        overflow-x: auto;
                    }
                    button {
                        background: #f5576c;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    button:hover { background: #e03e52; }
                </style>
            </head>
            <body>
                <div class="error-card">
                    <h1>❌ Ошибка</h1>
                    <p>К сожалению, произошла ошибка при подключении VoiceLead AI к amoCRM.</p>
                    
                    <div class="error-details">
                        ${error.message}
                    </div>
                    
                    <p style="font-size: 14px;">
                        Попробуйте повторить попытку или свяжитесь с поддержкой:<br>
                        <a href="mailto:support@voiceleadai.ru">support@voiceleadai.ru</a>
                    </p>
                    
                    <button onclick="window.close()">Закрыть окно</button>
                </div>
            </body>
            </html>
        `);
    }
});

/**
 * Инициация OAuth авторизации (опционально)
 * POST /api/integrations/amocrm/auth
 */
router.post('/amocrm/auth', async (req, res) => {
    try {
        const { subdomain } = req.body;

        if (!subdomain) {
            return res.status(400).json({
                error: 'Subdomain is required'
            });
        }

        const authUrl = `https://www.amocrm.ru/oauth?` +
            `client_id=${process.env.AMOCRM_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(`${process.env.API_DOMAIN}/api/integrations/amocrm/callback`)}&` +
            `state=${subdomain}.amocrm.ru`;

        res.json({ authorization_url: authUrl });

    } catch (error: any) {
        logger.error('❌ Auth initiation error', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Удаление интеграции
 * DELETE /api/integrations/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const integration = await Integration.findByPk(id);

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        await integration.destroy();

        logger.info('✅ Integration deleted', { id });

        res.json({ success: true });

    } catch (error: any) {
        logger.error('❌ Delete integration error', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Получение списка интеграций
 * GET /api/integrations
 */
router.get('/', async (req, res) => {
    try {
        const integrations = await Integration.findAll({
            attributes: ['id', 'amocrm_account_id', 'base_url', 'domain', 'status', 'last_sync_at', 'created_at'],
            order: [['created_at', 'DESC']]
        });

        res.json(integrations);

    } catch (error: any) {
        logger.error('❌ List integrations error', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;