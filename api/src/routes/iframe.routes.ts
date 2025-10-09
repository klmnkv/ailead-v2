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

    // Отправляем HTML страницу админ-панели
    res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VoiceLead AI - Панель управления</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 20px;
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    overflow: hidden;
                }
                
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                
                .header h1 {
                    font-size: 32px;
                    margin-bottom: 10px;
                }
                
                .header p {
                    opacity: 0.9;
                    font-size: 16px;
                }
                
                .content {
                    padding: 40px;
                }
                
                .info-box {
                    background: #f8f9fa;
                    border-left: 4px solid #667eea;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                }
                
                .info-box h3 {
                    color: #333;
                    margin-bottom: 10px;
                }
                
                .info-box p {
                    color: #666;
                    line-height: 1.6;
                }
                
                .settings-section {
                    margin-bottom: 30px;
                }
                
                .settings-section h2 {
                    color: #333;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #e0e0e0;
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-group label {
                    display: block;
                    color: #555;
                    margin-bottom: 8px;
                    font-weight: 500;
                }
                
                .form-group input,
                .form-group textarea,
                .form-group select {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.3s;
                }
                
                .form-group input:focus,
                .form-group textarea:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                .btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                }
                
                .btn:active {
                    transform: translateY(0);
                }
                
                .status-badge {
                    display: inline-block;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    background: #4CAF50;
                    color: white;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🤖 VoiceLead AI</h1>
                    <p>Панель управления ботом</p>
                </div>
                
                <div class="content">
                    <div class="info-box">
                        <h3>Информация об аккаунте</h3>
                        <p><strong>ID аккаунта:</strong> ${account_id}</p>
                        <p><strong>Статус интеграции:</strong> <span class="status-badge">Активна</span></p>
                    </div>
                    
                    <div class="settings-section">
                        <h2>Настройки бота</h2>
                        
                        <div class="form-group">
                            <label for="bot_name">Имя бота</label>
                            <input type="text" id="bot_name" placeholder="Например: Александр" value="Помощник">
                        </div>
                        
                        <div class="form-group">
                            <label for="greeting_message">Приветственное сообщение</label>
                            <textarea id="greeting_message" rows="3" placeholder="Здравствуйте! Чем могу помочь?">Здравствуйте! Я виртуальный помощник VoiceLead AI. Чем могу помочь?</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="response_delay">Задержка ответа (секунды)</label>
                            <input type="number" id="response_delay" value="2" min="0" max="60">
                        </div>
                        
                        <div class="form-group">
                            <label for="auto_response">Автоматические ответы</label>
                            <select id="auto_response">
                                <option value="enabled">Включены</option>
                                <option value="disabled">Отключены</option>
                                <option value="business_hours">Только в рабочее время</option>
                            </select>
                        </div>
                        
                        <button class="btn" onclick="saveSettings()">💾 Сохранить настройки</button>
                    </div>
                    
                    <div class="settings-section">
                        <h2>Сценарии</h2>
                        <p style="color: #666; margin-bottom: 20px;">
                            Настройка сценариев общения будет доступна в следующей версии.
                        </p>
                    </div>
                    
                    <div class="settings-section">
                        <h2>Статистика</h2>
                        <p style="color: #666; margin-bottom: 20px;">
                            Статистика использования бота будет доступна в следующей версии.
                        </p>
                    </div>
                </div>
            </div>
            
            <script>
                function saveSettings() {
                    const settings = {
                        bot_name: document.getElementById('bot_name').value,
                        greeting_message: document.getElementById('greeting_message').value,
                        response_delay: document.getElementById('response_delay').value,
                        auto_response: document.getElementById('auto_response').value
                    };
                    
                    // TODO: Отправить настройки на сервер
                    console.log('Saving settings:', settings);
                    
                    alert('✅ Настройки сохранены успешно!');
                }
            </script>
        </body>
        </html>
    `);
});

export default router;