-- Создание таблицы bots
CREATE TABLE IF NOT EXISTS bots (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    pipeline_id INTEGER,
    stage_id INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    prompt TEXT NOT NULL,
    ai_provider VARCHAR(50) DEFAULT 'openai',
    api_key TEXT,
    model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    temperature DECIMAL(2,1) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 500,
    deactivation_conditions TEXT,
    deactivation_message TEXT,
    files JSONB,
    actions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_bots_account_id ON bots(account_id);
CREATE INDEX IF NOT EXISTS idx_bots_pipeline_id ON bots(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_bots_stage_id ON bots(stage_id);
CREATE INDEX IF NOT EXISTS idx_bots_is_active ON bots(is_active);

-- Комментарии
COMMENT ON TABLE bots IS 'AI-боты для автоматизации работы с лидами';
COMMENT ON COLUMN bots.account_id IS 'ID аккаунта amoCRM';
COMMENT ON COLUMN bots.name IS 'Название бота';
COMMENT ON COLUMN bots.description IS 'Описание бота';
COMMENT ON COLUMN bots.pipeline_id IS 'ID воронки в amoCRM';
COMMENT ON COLUMN bots.stage_id IS 'ID этапа воронки в amoCRM';
COMMENT ON COLUMN bots.is_active IS 'Активен ли бот';
COMMENT ON COLUMN bots.prompt IS 'Промпт для AI';
COMMENT ON COLUMN bots.ai_provider IS 'Провайдер AI (openai, anthropic)';
COMMENT ON COLUMN bots.api_key IS 'API ключ для провайдера AI';
COMMENT ON COLUMN bots.model IS 'Модель AI (gpt-3.5-turbo, gpt-4, claude-3-sonnet, etc.)';
COMMENT ON COLUMN bots.temperature IS 'Температура модели (0-2)';
COMMENT ON COLUMN bots.max_tokens IS 'Максимум токенов на ответ';
COMMENT ON COLUMN bots.deactivation_conditions IS 'Условия отключения бота';
COMMENT ON COLUMN bots.deactivation_message IS 'Сообщение при отключении';
COMMENT ON COLUMN bots.files IS 'Файлы для обучения бота (JSON)';
COMMENT ON COLUMN bots.actions IS 'Действия при достижении цели (JSON)';
