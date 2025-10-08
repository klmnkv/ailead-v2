-- Аккаунты AI.LEAD
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  subscription_plan VARCHAR(50) DEFAULT 'free',
  token_balance INTEGER DEFAULT 1000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для accounts
CREATE INDEX idx_accounts_email ON accounts(email);

-- Интеграции с amoCRM
CREATE TABLE integrations (
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

-- Индексы для integrations
CREATE INDEX idx_integrations_account ON integrations(account_id);
CREATE INDEX idx_integrations_status ON integrations(status);

-- История сообщений
CREATE TABLE messages (
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
CREATE INDEX idx_messages_account_lead ON messages(account_id, lead_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_job_id ON messages(job_id);

-- Сценарии бота
CREATE TABLE scenarios (
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

-- Индексы для scenarios
CREATE INDEX idx_scenarios_account ON scenarios(account_id);
CREATE INDEX idx_scenarios_active ON scenarios(is_active);

-- Статистика по дням
CREATE TABLE stats_daily (
  id BIGSERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  date DATE NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  avg_processing_time INTEGER,
  unique_leads INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  UNIQUE(account_id, date)
);

-- Индексы для stats_daily
CREATE INDEX idx_stats_account_date ON stats_daily(account_id, date);

-- Логи ошибок
CREATE TABLE error_logs (
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

-- Индексы для error_logs
CREATE INDEX idx_error_logs_account ON error_logs(account_id);
CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();