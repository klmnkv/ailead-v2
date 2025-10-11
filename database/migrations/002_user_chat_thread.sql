-- Таблица для управления статусом бота по лидам
CREATE TABLE IF NOT EXISTS user_chat_thread (
  domain VARCHAR(255) NOT NULL,
  lead_id INTEGER NOT NULL,
  thread_id VARCHAR(50),
  status BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (domain, lead_id)
);

COMMENT ON TABLE user_chat_thread IS 'Статус бота для каждого лида';
COMMENT ON COLUMN user_chat_thread.status IS 'true = бот включен, false = выключен';

CREATE INDEX IF NOT EXISTS idx_user_chat_thread_status
ON user_chat_thread(domain, status);