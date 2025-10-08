-- Тестовый аккаунт
INSERT INTO accounts (email, password_hash, company_name, subscription_plan, token_balance)
VALUES (
  'test@ailead.ru',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: "test123"
  'Test Company',
  'premium',
  10000
);

-- Тестовая интеграция (замените на реальные данные)
INSERT INTO integrations (
  account_id,
  amocrm_account_id,
  base_url,
  access_token,
  refresh_token,
  token_expiry,
  status
)
VALUES (
  1,
  12345,
  'https://yoursubdomain.amocrm.ru',
  'test_access_token',
  'test_refresh_token',
  EXTRACT(EPOCH FROM NOW() + INTERVAL '1 day')::INTEGER,
  'active'
);