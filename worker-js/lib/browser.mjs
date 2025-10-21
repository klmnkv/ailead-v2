// worker-js/lib/browser.mjs
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logger } from './logger.mjs';

puppeteer.use(StealthPlugin());

class BrowserPool {
  constructor() {
    this.browsers = [];
    this.pages = new Map(); // key: "accountId:leadId", value: {page, lastUsed, inUse}
    this.maxBrowsers = 3;
    this.pageTimeout = 5 * 60 * 1000; // 5 минут неактивности
  }

  async initialize() {
    logger.info('Initializing browser pool...');

    // ✅ ВОЗВРАЩАЕМ как было - без executablePath
    for (let i = 0; i < this.maxBrowsers; i++) {
      const browser = await puppeteer.launch({
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled'
        ]
      });
      this.browsers.push(browser);
    }

    logger.info(`Browser pool initialized with ${this.browsers.length} browsers`);
  }

  async getPage(accountId, leadId) {
    const key = `${accountId}:${leadId}`;

    // Проверяем есть ли уже страница для этой комбинации
    if (this.pages.has(key)) {
      const pageInfo = this.pages.get(key);

      // ✅ Проверяем что страница не закрыта
      if (!pageInfo.page.isClosed()) {
        logger.info(`Reusing existing page for ${key}`);
        pageInfo.lastUsed = Date.now();
        pageInfo.inUse = true; // ✅ Помечаем как используемую
        return pageInfo.page;
      } else {
        logger.warn(`Page for ${key} was closed, creating new one`);
        this.pages.delete(key);
      }
    }

    // Создаём новую страницу
    const browser = this.browsers[Math.floor(Math.random() * this.browsers.length)];

    // ✅ Проверяем что браузер не закрыт
    if (!browser || !browser.isConnected()) {
      throw new Error('Browser is not connected');
    }

    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    this.pages.set(key, {
      page,
      lastUsed: Date.now(),
      inUse: true // ✅ Помечаем как используемую
    });

    logger.info(`Created new page for ${key}`);
    return page;
  }

  // ✅ Метод для освобождения страницы после использования
  releasePage(accountId, leadId) {
    const key = `${accountId}:${leadId}`;
    if (this.pages.has(key)) {
      const pageInfo = this.pages.get(key);
      pageInfo.inUse = false;
      pageInfo.lastUsed = Date.now();
      logger.info(`Released page for ${key}`);
    }
  }

  async cleanup() {
    logger.info('Cleaning up browser pool...');

    const now = Date.now();
    const toDelete = [];

    for (const [key, pageInfo] of this.pages.entries()) {
      const inactive = now - pageInfo.lastUsed > this.pageTimeout;

      // ✅ НЕ закрываем страницы которые используются
      if (inactive && !pageInfo.inUse) {
        try {
          if (!pageInfo.page.isClosed()) {
            await pageInfo.page.close();
            logger.info(`Closed inactive page: ${key}`);
          }
          toDelete.push(key);
        } catch (error) {
          logger.error(`Error closing page ${key}:`, error);
          toDelete.push(key);
        }
      } else if (inactive && pageInfo.inUse) {
        logger.info(`Page ${key} is inactive but still in use, keeping it`);
      }
    }

    toDelete.forEach(key => this.pages.delete(key));

    logger.info(`Cleanup complete. Active pages: ${this.pages.size}`);
  }

  async closeAll() {
    logger.info('Closing all browsers...');

    // Закрываем все страницы
    for (const [key, pageInfo] of this.pages.entries()) {
      try {
        if (!pageInfo.page.isClosed()) {
          await pageInfo.page.close();
        }
      } catch (error) {
        logger.error(`Error closing page ${key}:`, error);
      }
    }

    this.pages.clear();

    // Закрываем все браузеры
    for (const browser of this.browsers) {
      try {
        if (browser.isConnected()) {
          await browser.close();
        }
      } catch (error) {
        logger.error('Error closing browser:', error);
      }
    }

    this.browsers = [];
    logger.info('All browsers closed');
  }
}

export const browserPool = new BrowserPool();