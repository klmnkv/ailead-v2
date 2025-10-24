-- Создание таблицы knowledge_base для хранения базы знаний
CREATE TABLE IF NOT EXISTS knowledge_base (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL COMMENT 'ID аккаунта amoCRM',
  title VARCHAR(255) NOT NULL COMMENT 'Название записи в базе знаний',
  content TEXT NOT NULL COMMENT 'Содержимое записи',
  category VARCHAR(100) COMMENT 'Категория записи',
  tags TEXT COMMENT 'Теги для поиска (через запятую)',
  is_active BOOLEAN NOT NULL DEFAULT true COMMENT 'Активна ли запись',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_account_id (account_id),
  INDEX idx_is_active (is_active),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='База знаний для ботов';

-- Создание таблицы bot_knowledge для связи ботов с базой знаний (многие-ко-многим)
CREATE TABLE IF NOT EXISTS bot_knowledge (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER NOT NULL COMMENT 'ID бота',
  knowledge_id INTEGER NOT NULL COMMENT 'ID записи базы знаний',
  priority INTEGER DEFAULT 0 COMMENT 'Приоритет использования (больше = выше)',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
  FOREIGN KEY (knowledge_id) REFERENCES knowledge_base(id) ON DELETE CASCADE,

  UNIQUE KEY unique_bot_knowledge (bot_id, knowledge_id),
  INDEX idx_bot_id (bot_id),
  INDEX idx_knowledge_id (knowledge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Связь ботов с базой знаний';
