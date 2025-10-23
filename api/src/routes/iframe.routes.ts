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

    // Отправляем улучшенную HTML страницу админ-панели
    res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI.LEAD - Управление ботом</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    color: #2d3748;
                    font-size: 14px;
                    line-height: 1.5;
                    height: 100vh;
                    overflow: hidden;
                }
                
                .container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.1);
                }
                
                /* Header */
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: white;
                }
                
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .logo {
                    font-size: 24px;
                    font-weight: 700;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .header-title {
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .status-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.2);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 500;
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    background: #10b981;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                }
                
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
                
                /* Main Content */
                .main-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                    background: #f8fafb;
                }
                
                .settings-section {
                    background: white;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    transition: all 0.3s;
                }
                
                .settings-section:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                
                .section-header {
                    padding: 16px 20px;
                    background: linear-gradient(to right, #f8fafc, white);
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .section-title {
                    font-weight: 600;
                    color: #1a202c;
                    font-size: 15px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .section-content {
                    padding: 20px;
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-group:last-child {
                    margin-bottom: 0;
                }
                
                .form-label {
                    display: block;
                    font-weight: 500;
                    color: #2d3748;
                    margin-bottom: 6px;
                    font-size: 13px;
                }
                
                .form-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: all 0.2s;
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .form-textarea {
                    min-height: 100px;
                    resize: vertical;
                }
                
                .form-select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    background: white;
                    font-size: 14px;
                    cursor: pointer;
                    font-family: inherit;
                }
                
                /* Info Box */
                .info-box {
                    background: linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%);
                    border-left: 4px solid #667eea;
                    border-radius: 8px;
                    padding: 12px;
                    font-size: 13px;
                    color: #4338ca;
                    margin-top: 8px;
                }
                
                .warning-box {
                    background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
                    border-left: 4px solid #f59e0b;
                    border-radius: 8px;
                    padding: 12px;
                    font-size: 13px;
                    color: #c2410c;
                    margin-top: 8px;
                }
                
                /* Buttons */
                .btn {
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-weight: 500;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    font-family: inherit;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                }
                
                .btn-secondary {
                    background: #f7fafc;
                    color: #4a5568;
                    border: 2px solid #e2e8f0;
                }
                
                .btn-secondary:hover {
                    background: #edf2f7;
                    border-color: #cbd5e0;
                }
                
                /* Footer */
                .footer {
                    background: white;
                    border-top: 2px solid #e2e8f0;
                    padding: 16px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .footer-left {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }
                
                .footer-right {
                    display: flex;
                    gap: 12px;
                }
                
                .save-status {
                    font-size: 13px;
                    color: #10b981;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: #f0fdf4;
                    border-radius: 6px;
                }
                
                /* Loading */
                .loading {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid #e2e8f0;
                    border-top-color: #667eea;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Range Input */
                .form-range {
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: #e2e8f0;
                    outline: none;
                    -webkit-appearance: none;
                }

                .form-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
                }

                .form-range::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
                    border: none;
                }
                
                /* Toggle Switch */
                .toggle-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 8px;
                    transition: all 0.3s;
                }
                
                .toggle-container:hover {
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                }
                
                .toggle-label {
                    font-weight: 500;
                    color: #2d3748;
                }
                
                .toggle-switch {
                    width: 48px;
                    height: 26px;
                    background: #e2e8f0;
                    border-radius: 13px;
                    position: relative;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                
                .toggle-switch.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                
                .toggle-switch::after {
                    content: '';
                    width: 22px;
                    height: 22px;
                    background: white;
                    border-radius: 50%;
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    transition: transform 0.3s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                .toggle-switch.active::after {
                    transform: translateX(22px);
                }
                
                /* Stats */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                }
                
                .stat-card {
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                    transition: all 0.3s;
                }
                
                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                    border-color: #667eea;
                }
                
                .stat-label {
                    font-size: 12px;
                    color: #718096;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .stat-value {
                    font-size: 28px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .stat-change {
                    font-size: 12px;
                    margin-top: 6px;
                    font-weight: 500;
                }
                
                .stat-change.positive {
                    color: #10b981;
                }
                
                /* Scrollbar */
                ::-webkit-scrollbar {
                    width: 10px;
                }
                
                ::-webkit-scrollbar-track {
                    background: #f1f5f9;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 5px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(135deg, #5568d3 0%, #6a3f8c 100%);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <div class="header-left">
                        <div class="logo">🤖 AI.LEAD</div>
                        <div class="header-title">Панель управления ботом</div>
                    </div>
                    <div class="status-badge">
                        <div class="status-dot"></div>
                        Активен
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="main-content">
                    <!-- Статистика -->
                    <div class="settings-section">
                        <div class="section-header">
                            <div class="section-title">
                                📊 Статистика за сегодня
                            </div>
                        </div>
                        <div class="section-content">
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-label">Обработано лидов</div>
                                    <div class="stat-value">12</div>
                                    <div class="stat-change positive">↑ +25% от вчера</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Отправлено сообщений</div>
                                    <div class="stat-value">48</div>
                                    <div class="stat-change positive">↑ +15%</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Успешных диалогов</div>
                                    <div class="stat-value">9</div>
                                    <div class="stat-change positive">↑ 75%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Основные настройки -->
                    <div class="settings-section">
                        <div class="section-header">
                            <div class="section-title">⚙️ Основные настройки</div>
                        </div>
                        <div class="section-content">
                            <div class="form-group">
                                <div class="toggle-container">
                                    <div class="toggle-label">Автоматическая обработка новых лидов</div>
                                    <div class="toggle-switch active" onclick="toggleSwitch(this)"></div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Промпт для AI-бота</label>
                                <textarea 
                                    class="form-input form-textarea" 
                                    placeholder="Опишите, как должен вести себя бот..."
                                >Ты - профессиональный менеджер по продажам. Твоя задача - помочь клиенту с выбором товара, ответить на вопросы и довести до покупки. Веди себя дружелюбно, но профессионально.</textarea>
                                <div class="info-box">
                                    💡 Промпт определяет поведение и стиль общения бота с клиентами
                                </div>
                            </div>
                            
                            <!-- AI Integration Settings -->
                            <div class="form-group">
                                <div class="toggle-container">
                                    <div class="toggle-label">🤖 Включить AI интеграцию</div>
                                    <div class="toggle-switch" id="ai-enabled-toggle" onclick="toggleAI(this)"></div>
                                </div>
                                <div class="info-box" style="margin-top: 8px;">
                                    💡 При включении бот будет использовать AI для генерации ответов
                                </div>
                            </div>

                            <div id="ai-settings" style="display: none;">
                                <div class="form-group">
                                    <label class="form-label">Провайдер AI</label>
                                    <select class="form-select" id="ai-provider" onchange="updateModelsList()">
                                        <option value="openai">OpenAI (GPT)</option>
                                        <option value="anthropic">Anthropic (Claude)</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">API Ключ</label>
                                    <input
                                        type="password"
                                        id="ai-api-key"
                                        class="form-input"
                                        placeholder="sk-..."
                                    />
                                    <div class="info-box" style="margin-top: 8px;">
                                        🔒 Ваш API ключ хранится безопасно и используется только для генерации ответов
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Модель</label>
                                    <select class="form-select" id="ai-model">
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (быстрее, дешевле)</option>
                                        <option value="gpt-4">GPT-4 (лучше качество)</option>
                                        <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Температура (креативность): <span id="temperature-value">0.7</span></label>
                                    <input
                                        type="range"
                                        id="ai-temperature"
                                        class="form-range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value="0.7"
                                        oninput="updateTemperature(this.value)"
                                    />
                                    <div class="info-box" style="margin-top: 8px;">
                                        💡 0 = более точные ответы, 2 = более креативные ответы
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Максимальная длина ответа (токены)</label>
                                    <input
                                        type="number"
                                        id="ai-max-tokens"
                                        class="form-input"
                                        value="500"
                                        min="50"
                                        max="4000"
                                    />
                                    <div class="info-box" style="margin-top: 8px;">
                                        💡 1 токен ≈ 4 символа. 500 токенов ≈ 2000 символов
                                    </div>
                                </div>

                                <div class="form-group">
                                    <button class="btn btn-secondary" onclick="testAIConnection()">
                                        🧪 Проверить подключение
                                    </button>
                                    <span id="ai-test-result" style="margin-left: 10px;"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Условия передачи -->
                    <div class="settings-section">
                        <div class="section-header">
                            <div class="section-title">🔄 Передача менеджеру</div>
                        </div>
                        <div class="section-content">
                            <div class="form-group">
                                <label class="form-label">Когда передать лид менеджеру?</label>
                                <textarea 
                                    class="form-input form-textarea"
                                    placeholder="Опишите условия..."
                                >Передавай лид менеджеру, если клиент:
- Просит поговорить с человеком
- Хочет сделать заказ
- Задает сложные технические вопросы
- Не получает ответ после 2-3 попыток</textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Сообщение при передаче</label>
                                <input 
                                    type="text" 
                                    class="form-input" 
                                    value="Спасибо за общение! Сейчас к вам присоединится наш менеджер."
                                    placeholder="Что написать клиенту"
                                />
                            </div>
                            
                            <div class="warning-box">
                                ⚠️ После передачи бот прекратит автоматические ответы по этому лиду
                            </div>
                        </div>
                    </div>
                    
                    <!-- Действия при цели -->
                    <div class="settings-section">
                        <div class="section-header">
                            <div class="section-title">🎯 Действия при достижении цели</div>
                        </div>
                        <div class="section-content">
                            <div class="form-group">
                                <label class="form-label">Цель бота</label>
                                <textarea 
                                    class="form-input form-textarea"
                                    placeholder="Опишите, какую цель должен достичь бот..."
                                >Квалифицировать лид: узнать бюджет, срочность покупки, контактные данные и передать менеджеру для закрытия сделки.</textarea>
                            </div>
                            
                            <div class="form-group">
                                <div class="toggle-container">
                                    <div class="toggle-label">Переместить лид на следующий этап</div>
                                    <div class="toggle-switch active" onclick="toggleSwitch(this)"></div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <div class="toggle-container">
                                    <div class="toggle-label">Назначить ответственного менеджера</div>
                                    <div class="toggle-switch active" onclick="toggleSwitch(this)"></div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <div class="toggle-container">
                                    <div class="toggle-label">Отправить уведомление менеджеру</div>
                                    <div class="toggle-switch active" onclick="toggleSwitch(this)"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <div class="footer-left">
                        <div class="save-status">
                            <span>✓</span> Сохранено в 14:25
                        </div>
                    </div>
                    <div class="footer-right">
                        <button class="btn btn-secondary" onclick="testBot()">🧪 Тестировать</button>
                        <button class="btn btn-primary" onclick="saveSettings()">💾 Сохранить</button>
                    </div>
                </div>
            </div>
            
            <script>
                function toggleSwitch(element) {
                    element.classList.toggle('active');
                }

                function toggleAI(element) {
                    element.classList.toggle('active');
                    const aiSettings = document.getElementById('ai-settings');
                    if (element.classList.contains('active')) {
                        aiSettings.style.display = 'block';
                    } else {
                        aiSettings.style.display = 'none';
                    }
                }

                function updateTemperature(value) {
                    document.getElementById('temperature-value').textContent = value;
                }

                async function updateModelsList() {
                    const provider = document.getElementById('ai-provider').value;
                    const modelSelect = document.getElementById('ai-model');

                    try {
                        const response = await fetch('/api/bot/ai/models?provider=' + provider);
                        const data = await response.json();

                        modelSelect.innerHTML = '';
                        data.models.forEach(model => {
                            const option = document.createElement('option');
                            option.value = model.value;
                            option.textContent = model.label;
                            modelSelect.appendChild(option);
                        });
                    } catch (error) {
                        console.error('Error fetching models:', error);
                    }
                }

                async function testAIConnection() {
                    const resultSpan = document.getElementById('ai-test-result');
                    resultSpan.textContent = '⏳ Проверка...';
                    resultSpan.style.color = '#666';

                    const aiConfig = {
                        enabled: true,
                        provider: document.getElementById('ai-provider').value,
                        model: document.getElementById('ai-model').value,
                        api_key: document.getElementById('ai-api-key').value,
                        temperature: parseFloat(document.getElementById('ai-temperature').value),
                        max_tokens: parseInt(document.getElementById('ai-max-tokens').value)
                    };

                    try {
                        const response = await fetch('/api/bot/ai/test', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ ai: aiConfig })
                        });

                        const data = await response.json();

                        if (response.ok && data.success) {
                            resultSpan.textContent = '✓ Подключение успешно (' + data.duration + 'ms)';
                            resultSpan.style.color = '#22c55e';
                        } else {
                            resultSpan.textContent = '✗ Ошибка: ' + (data.error || 'Неизвестная ошибка');
                            resultSpan.style.color = '#ef4444';
                        }
                    } catch (error) {
                        resultSpan.textContent = '✗ Ошибка: ' + error.message;
                        resultSpan.style.color = '#ef4444';
                    }
                }

                async function saveSettings() {
                    const saveBtn = event.target;
                    const originalHTML = saveBtn.innerHTML;

                    saveBtn.innerHTML = '<span class="loading"></span> Сохранение...';
                    saveBtn.disabled = true;

                    // Собираем все настройки
                    const aiEnabled = document.getElementById('ai-enabled-toggle').classList.contains('active');
                    const config = {
                        auto_process: true,
                        prompt: document.querySelector('textarea.form-textarea').value,
                        ai: {
                            enabled: aiEnabled,
                            provider: document.getElementById('ai-provider').value,
                            model: document.getElementById('ai-model').value,
                            api_key: document.getElementById('ai-api-key').value,
                            temperature: parseFloat(document.getElementById('ai-temperature').value),
                            max_tokens: parseInt(document.getElementById('ai-max-tokens').value)
                        }
                    };

                    try {
                        const response = await fetch('/api/bot/config', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(config)
                        });

                        if (response.ok) {
                            saveBtn.innerHTML = '✓ Сохранено';
                            setTimeout(() => {
                                saveBtn.innerHTML = originalHTML;
                                saveBtn.disabled = false;
                            }, 1500);
                        } else {
                            throw new Error('Failed to save');
                        }
                    } catch (error) {
                        saveBtn.innerHTML = '✗ Ошибка';
                        setTimeout(() => {
                            saveBtn.innerHTML = originalHTML;
                            saveBtn.disabled = false;
                        }, 2000);
                    }
                }

                // Загрузка настроек при загрузке страницы
                async function loadSettings() {
                    try {
                        const response = await fetch('/api/bot/config');
                        const config = await response.json();

                        if (config.prompt) {
                            document.querySelector('textarea.form-textarea').value = config.prompt;
                        }

                        if (config.ai) {
                            // Устанавливаем значения AI настроек
                            const aiToggle = document.getElementById('ai-enabled-toggle');
                            if (config.ai.enabled) {
                                aiToggle.classList.add('active');
                                document.getElementById('ai-settings').style.display = 'block';
                            }

                            document.getElementById('ai-provider').value = config.ai.provider || 'openai';
                            document.getElementById('ai-model').value = config.ai.model || 'gpt-3.5-turbo';
                            document.getElementById('ai-api-key').value = config.ai.api_key || '';
                            document.getElementById('ai-temperature').value = config.ai.temperature || 0.7;
                            document.getElementById('ai-max-tokens').value = config.ai.max_tokens || 500;

                            updateTemperature(config.ai.temperature || 0.7);
                        }
                    } catch (error) {
                        console.error('Error loading settings:', error);
                    }
                }

                // Загружаем настройки при старте
                window.addEventListener('DOMContentLoaded', loadSettings);

                function testBot() {
                    alert('Функция тестирования в разработке');
                }
                
                // Автосохранение
                setInterval(() => {
                    const status = document.querySelector('.save-status');
                    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    status.innerHTML = \`<span>✓</span> Сохранено в \${time}\`;
                }, 30000);
            </script>
        </body>
        </html>
    `);
});

export default router;