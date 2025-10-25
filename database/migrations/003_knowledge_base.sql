-- Создание таблицы баз знаний
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Создание таблицы элементов базы знаний
CREATE TABLE IF NOT EXISTS knowledge_base_items (
  id SERIAL PRIMARY KEY,
  knowledge_base_id INTEGER NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Добавление полей knowledge_base_id и knowledge_base_items в таблицу bots
ALTER TABLE bots
ADD COLUMN IF NOT EXISTS knowledge_base_id INTEGER REFERENCES knowledge_bases(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS knowledge_base_items INTEGER[] DEFAULT '{}';

-- Индексы для knowledge_bases
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_account_id ON knowledge_bases(account_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_is_active ON knowledge_bases(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_is_default ON knowledge_bases(is_default);

-- Индексы для knowledge_base_items
CREATE INDEX IF NOT EXISTS idx_knowledge_base_items_kb_id ON knowledge_base_items(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_items_type ON knowledge_base_items(type);

-- Индекс для bots.knowledge_base_id
CREATE INDEX IF NOT EXISTS idx_bots_knowledge_base_id ON bots(knowledge_base_id);

-- Комментарии
COMMENT ON TABLE knowledge_bases IS 'Базы знаний для AI-ботов';
COMMENT ON TABLE knowledge_base_items IS 'Элементы базы знаний (текст, файлы, ссылки)';
COMMENT ON COLUMN knowledge_bases.is_default IS 'Использовать эту базу знаний по умолчанию';
COMMENT ON COLUMN knowledge_base_items.type IS 'Тип элемента: text, file, url';
COMMENT ON COLUMN knowledge_base_items.metadata IS 'Дополнительные метаданные (источник, теги, и т.д.)';
COMMENT ON COLUMN bots.knowledge_base_items IS 'Массив ID выбранных элементов из базы знаний';
