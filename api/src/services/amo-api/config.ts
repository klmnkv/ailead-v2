export const AMO_CONFIG = {
  // Метод отправки
  SEND_METHOD: process.env.AMO_SEND_METHOD || 'auto', // 'api' | 'puppeteer' | 'auto'

  // API настройки
  USE_API: process.env.AMO_USE_API === 'true',
  CLIENT_ID: process.env.AMO_CLIENT_ID,
  CLIENT_SECRET: process.env.AMO_CLIENT_SECRET,
  REDIRECT_URI: process.env.AMO_REDIRECT_URI || 'http://localhost:4000/api/integrations/amocrm/callback',

  // Лимиты и таймауты
  RATE_LIMIT: parseInt(process.env.AMO_RATE_LIMIT || '7'),
  RETRY_ATTEMPTS: parseInt(process.env.AMO_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(process.env.AMO_RETRY_DELAY || '1000'),
  REQUEST_TIMEOUT: parseInt(process.env.AMO_REQUEST_TIMEOUT || '30000'),

  // Токены
  TOKEN_REFRESH_BUFFER: 5 * 60 * 1000, // 5 минут до истечения

  // Fallback настройки
  FALLBACK_TO_PUPPETEER: process.env.AMO_FALLBACK_TO_PUPPETEER !== 'false',
  FALLBACK_EMAIL: process.env.AMO_FALLBACK_EMAIL,
  FALLBACK_PASSWORD: process.env.AMO_FALLBACK_PASSWORD,

  // Кэширование
  CACHE_TTL: parseInt(process.env.AMO_CACHE_TTL || '3600'), // 1 час по умолчанию

  // Дебаг
  DEBUG: process.env.AMO_DEBUG === 'true'
};