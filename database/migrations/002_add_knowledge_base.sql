-- База знаний для ботов
CREATE TABLE IF NOT EXISTS knowledge_base (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_knowledge_base_account_id ON knowledge_base(account_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_is_active ON knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);

-- Комментарии
COMMENT ON TABLE knowledge_base IS 'База знаний для AI ботов';
COMMENT ON COLUMN knowledge_base.title IS 'Название записи базы знаний';
COMMENT ON COLUMN knowledge_base.content IS 'Содержимое записи';
COMMENT ON COLUMN knowledge_base.category IS 'Категория (например: продукты, услуги, FAQ)';
COMMENT ON COLUMN knowledge_base.is_active IS 'Активна ли запись';
