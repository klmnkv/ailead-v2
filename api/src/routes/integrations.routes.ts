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
                    p { color: #666; margin-bottom: 15px; line-height: 1.6; }
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
        return res.send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
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

        // Обмениваем code на токены
        const tokenResponse = await axios.post(tokenUrl, tokenRequestData);

        const {
            access_token,
            refresh_token,
            expires_in
        } = tokenResponse.data;

        const base_domain = `${subdomain}.amocrm.ru`;
        logger.info('✅ Tokens received', { base_domain, expires_in });

        // Получаем информацию об аккаунте amoCRM
        const accountInfo = await axios.get(`https://${base_domain}/api/v4/account`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const amocrm_account_id = accountInfo.data.id;
        const accountSubdomain = accountInfo.data.subdomain || subdomain;

        logger.info('✅ Account info received', { amocrm_account_id, subdomain: accountSubdomain });

        // Извлекаем domain из state
        const domain = (state as string && state !== 'false') ? state : `${accountSubdomain}.amocrm.ru`;

        logger.info('📝 Saving integration...', { domain, amocrm_account_id });

        // ✅ ИСПРАВЛЕНИЕ: Используем findOrCreate вместо upsert
        const [integration, created] = await Integration.findOrCreate({
            where: {
                amocrm_account_id: amocrm_account_id
            },
            defaults: {
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
            }
        });

        // Если запись уже существовала - обновляем токены
        if (!created) {
            logger.info('⚠️ Integration already exists, updating tokens...');
            await integration.update({
                base_url: `https://${base_domain}`,
                domain: domain,
                client_id: (client_id as string) || integration.client_id,
                access_token: access_token,
                refresh_token: refresh_token,
                token_expiry: Math.floor(Date.now() / 1000) + expires_in,
                status: 'active',
                last_sync_at: new Date()
            });
            logger.info('✅ Tokens updated');
        } else {
            logger.info('✅ New integration created');
        }

        logger.info(created ? '✅ Integration created' : '✅ Integration updated', {
            integration_id: integration.id
        });

        // Регистрируем webhook в amoCRM (если еще не зарегистрирован)
        try {
            const webhookDestination = `${process.env.API_DOMAIN || 'http://localhost:4000'}/api/webhook`;

            // Проверяем существующие webhooks
            const webhooksResponse = await axios.get(
                `https://${base_domain}/api/v4/webhooks`,
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            const existingWebhook = webhooksResponse.data._embedded?.webhooks?.find(
                (hook: any) => hook.destination === webhookDestination
            );

            if (!existingWebhook) {
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
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                        margin: 0;
                    }
                    .success-card {
                        background: white;
                        padding: 50px 40px;
                        border-radius: 20px;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        text-align: center;
                        max-width: 500px;
                        animation: slideUp 0.5s ease-out;
                    }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .checkmark {
                        width: 100px;
                        height: 100px;
                        border-radius: 50%;
                        background: #4CAF50;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 30px;
                        animation: scaleIn 0.5s ease-out 0.2s both;
                    }
                    @keyframes scaleIn {
                        from { transform: scale(0); }
                        to { transform: scale(1); }
                    }
                    .checkmark::after {
                        content: "✓";
                        color: white;
                        font-size: 60px;
                        font-weight: bold;
                    }
                    h1 {
                        color: #333;
                        margin: 0 0 15px 0;
                        font-size: 32px;
                        font-weight: 600;
                    }
                    p {
                        color: #666;
                        margin: 0 0 25px 0;
                        font-size: 16px;
                        line-height: 1.6;
                    }
                    .info-box {
                        background: #f5f5f5;
                        padding: 20px;
                        border-radius: 10px;
                        margin: 20px 0;
                        text-align: left;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .info-row:last-child {
                        border-bottom: none;
                    }
                    .info-label {
                        color: #999;
                        font-size: 14px;
                    }
                    .info-value {
                        color: #333;
                        font-weight: 600;
                        font-size: 14px;
                    }
                    .countdown {
                        color: #999;
                        font-size: 13px;
                        margin-top: 20px;
                    }
                    button {
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                        transition: all 0.3s;
                    }
                    button:hover {
                        background: #5568d3;
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                    }
                </style>
            </head>
            <body>
                <div class="success-card">
                    <div class="checkmark"></div>
                    <h1>Успешно!</h1>
                    <p>VoiceLead AI подключен к amoCRM</p>
                    
                    <div class="info-box">
                        <div class="info-row">
                            <span class="info-label">Аккаунт:</span>
                            <span class="info-value">${accountSubdomain}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Статус:</span>
                            <span class="info-value">${created ? 'Новая интеграция' : 'Обновлено'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">ID аккаунта:</span>
                            <span class="info-value">${amocrm_account_id}</span>
                        </div>
                    </div>
                    
                    <p style="font-size: 14px; color: #999;">
                        Страница AmoCRM автоматически обновится
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
                    
                    // Отправляем сообщение родительскому окну
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

        res.send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>Ошибка</title>
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
                    h1 { color: #f5576c; margin-bottom: 20px; }
                    p { color: #666; margin-bottom: 15px; }
                    .error-details {
                        background: #ffebee;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-size: 13px;
                        color: #c62828;
                        text-align: left;
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
 * Получить воронки и этапы из amoCRM
 * GET /api/integrations/pipelines?account_id=XXX
 */
router.get('/pipelines', async (req, res) => {
    try {
        const { account_id } = req.query;

        if (!account_id) {
            return res.status(400).json({ error: 'account_id is required' });
        }

        logger.info('📥 Fetching pipelines for amoCRM account', { amocrm_account_id: account_id });

        // ВАЖНО: account_id это ID аккаунта amoCRM, ищем по amocrm_account_id
        const integration = await Integration.findOne({
            where: { amocrm_account_id: Number(account_id) }
        });

        if (!integration) {
            logger.warn('⚠️ No integration found for account', { account_id });
            return res.status(404).json({
                error: 'Integration not found',
                message: 'Подключите интеграцию с amoCRM в настройках виджета'
            });
        }

        // Проверяем, не истек ли токен
        const now = Math.floor(Date.now() / 1000);
        if (integration.token_expiry < now) {
            logger.warn('⚠️ Access token expired, need to refresh');
            return res.status(401).json({
                error: 'Token expired',
                message: 'Токен доступа устарел. Переподключите интеграцию в настройках виджета в amoCRM.'
            });
        }

        // Запрашиваем воронки из amoCRM
        const pipelinesResponse = await axios.get(
            `${integration.base_url}/api/v4/leads/pipelines`,
            {
                headers: {
                    'Authorization': `Bearer ${integration.access_token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const pipelines = pipelinesResponse.data._embedded?.pipelines || [];

        // Преобразуем в нужный формат
        const formattedPipelines = pipelines.map((pipeline: any) => ({
            id: pipeline.id,
            name: pipeline.name,
            sort: pipeline.sort,
            is_main: pipeline.is_main,
            stages: Object.values(pipeline._embedded?.statuses || {}).map((status: any) => ({
                id: status.id,
                name: status.name,
                sort: status.sort,
                color: status.color,
                type: status.type
            }))
        }));

        logger.info(`✅ Found ${formattedPipelines.length} pipelines`);
        res.json(formattedPipelines);

    } catch (error: any) {
        logger.error('❌ Error fetching pipelines:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        if (error.response?.status === 401) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Токен доступа устарел. Переподключите интеграцию в настройках виджета в amoCRM.'
            });
        }

        res.status(500).json({
            error: 'Failed to fetch pipelines',
            message: error.message
        });
    }
});

export default router;