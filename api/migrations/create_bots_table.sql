-- Создание таблицы bots
CREATE TABLE IF NOT EXISTS bots (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    ai_provider VARCHAR(50) DEFAULT 'openai',
    api_key TEXT,
    model VARCHAR(100) NOT NULL DEFAULT 'gpt-3.5-turbo',
    temperature REAL NOT NULL DEFAULT 0.7,
    max_tokens INTEGER NOT NULL DEFAULT 500,
    pipeline_id INTEGER,
    stage_id INTEGER,
    deactivation_conditions TEXT,
    deactivation_message TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_bots_account_id ON bots(account_id);
CREATE INDEX IF NOT EXISTS idx_bots_is_active ON bots(is_active);
CREATE INDEX IF NOT EXISTS idx_bots_stage_id ON bots(stage_id);

-- Комментарии
COMMENT ON TABLE bots IS 'AI боты для автоматизации работы с лидами';
COMMENT ON COLUMN bots.account_id IS 'ID аккаунта amoCRM';
COMMENT ON COLUMN bots.name IS 'Название бота';
COMMENT ON COLUMN bots.prompt IS 'Промпт для AI';
COMMENT ON COLUMN bots.ai_provider IS 'Провайдер AI (openai, anthropic)';
COMMENT ON COLUMN bots.api_key IS 'API ключ для провайдера AI';
COMMENT ON COLUMN bots.model IS 'Модель AI';
COMMENT ON COLUMN bots.temperature IS 'Temperature (0-2) - креативность ответов';
COMMENT ON COLUMN bots.max_tokens IS 'Максимальное количество токенов в ответе';
COMMENT ON COLUMN bots.pipeline_id IS 'ID воронки в amoCRM';
COMMENT ON COLUMN bots.stage_id IS 'ID этапа в воронке amoCRM';
COMMENT ON COLUMN bots.is_active IS 'Активен ли бот';
