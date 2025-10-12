// config/amo-api.config.ts
export const AMO_API_CONFIG = {
  // Выбор метода отправки
  SEND_METHOD: process.env.AMO_SEND_METHOD || 'auto', // 'api' | 'puppeteer' | 'auto'

  // API настройки
  API_VERSION: 'v4',
  RATE_LIMIT: 7, // запросов в секунду
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,

  // Таймауты
  REQUEST_TIMEOUT: 30000,
  TOKEN_REFRESH_BUFFER: 5 * 60 * 1000, // 5 минут до истечения

  // Fallback
  FALLBACK_TO_PUPPETEER: true,

  // Кэширование
  CACHE_TTL: 60 * 60, // 1 час для данных сделок
};