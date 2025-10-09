-- Создаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Аккаунты AI.LEAD (пользователи системы)
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  subscription_plan VARCHAR(50) DEFAULT 'free',
  token_balance INTEGER DEFAULT 1000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Интеграции с amoCRM
CREATE TABLE IF NOT EXISTS integrations (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  amocrm_account_id INTEGER NOT NULL,
  base_url VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, amocrm_account_id)
);

-- История сообщений
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  integration_id INTEGER REFERENCES integrations(id),
  lead_id INTEGER NOT NULL,
  message_text TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'chat',
  direction VARCHAR(20) DEFAULT 'outgoing',
  status VARCHAR(50) DEFAULT 'pending',
  processing_time INTEGER,
  error_message TEXT,
  screenshot_url TEXT,
  job_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP
);

-- Индексы для messages
CREATE INDEX IF NOT EXISTS idx_messages_account_lead ON messages(account_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages(job_id);

-- Сценарии бота
CREATE TABLE IF NOT EXISTS scenarios (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_conditions JSONB,
  steps JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Статистика (дневная)
CREATE TABLE IF NOT EXISTS stats_daily (
  id BIGSERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  date DATE NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  avg_processing_time INTEGER,
  unique_leads INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, date)
);

-- Логи ошибок
CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  job_id VARCHAR(255),
  error_type VARCHAR(100),
  error_message TEXT,
  stack_trace TEXT,
  context JSONB,
  screenshot_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_account_id ON error_logs(account_id);

-- Тестовые данные для разработки
INSERT INTO accounts (email, password_hash, company_name, subscription_plan)
VALUES ('test@example.com', '$2b$10$XQGvzKHYKLCvWJsqYpJQ4e7V3nZXfVxQXnR8KVYJVJKVYJVJKVYJKe', 'Test Company', 'pro')
ON CONFLICT (email) DO NOTHING;

-- Комментарии
COMMENT ON TABLE accounts IS 'Аккаунты пользователей AI.LEAD';
COMMENT ON TABLE integrations IS 'Интеграции с amoCRM';
COMMENT ON TABLE messages IS 'История отправленных сообщений';
COMMENT ON TABLE scenarios IS 'Сценарии автоматических диалогов';
COMMENT ON TABLE stats_daily IS 'Дневная статистика по аккаунтам';
COMMENT ON TABLE error_logs IS 'Логи ошибок системы';