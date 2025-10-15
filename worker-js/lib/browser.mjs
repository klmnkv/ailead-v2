import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logger } from './logger.mjs';

puppeteer.use(StealthPlugin());

class BrowserPool {
  constructor() {
    this.browsers = [];
    this.pageContexts = new Map(); // account_id:lead_id -> page
    this.maxBrowsers = parseInt(process.env.MAX_BROWSERS || '3');
    this.maxPagesPerBrowser = parseInt(process.env.MAX_PAGES_PER_BROWSER || '5');
  }

  async initialize() {
    logger.info('Initializing browser pool...');

    for (let i = 0; i < this.maxBrowsers; i++) {
      const browser = await this.createBrowser();
      this.browsers.push(browser);
    }

    logger.info(`Browser pool initialized with ${this.browsers.length} browsers`);
  }

  async createBrowser() {
    // Определяем путь к Chrome
    const chromePath = process.env.CHROME_PATH ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

    return await puppeteer.launch({
      headless: false, // true для продакшена
      executablePath: chromePath, // ВАЖНО: путь к Chrome
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080'
      ],
      defaultViewport: { width: 1920, height: 1080 }
    });
  }

  async getPage(accountId, leadId) {
    const key = `${accountId}:${leadId}`;

    // Возвращаем существующую страницу
    if (this.pageContexts.has(key)) {
      const page = this.pageContexts.get(key);
      if (!page.isClosed()) {
        logger.info(`Reusing existing page for ${key}`);
        return page;
      }
      this.pageContexts.delete(key);
    }

    // Создаем новую страницу
    const browser = this.browsers[0]; // Используем первый браузер
    const page = await browser.newPage();

    this.pageContexts.set(key, page);
    logger.info(`Created new page for ${key}`);

    return page;
  }

  // Добавьте метод для освобождения страницы
  async releasePage(page) {
    try {
      if (page && !page.isClosed()) {
        await page.close();

        // Удаляем из кеша
        for (const [key, cachedPage] of this.pageContexts.entries()) {
          if (cachedPage === page) {
            this.pageContexts.delete(key);
            logger.info(`Released page for ${key}`);
            break;
          }
        }
      }
    } catch (error) {
      logger.error('Error releasing page:', error);
    }
  }

  async cleanup() {
    logger.info('Cleaning up browser pool...');

    for (const browser of this.browsers) {
      await browser.close().catch(err =>
        logger.error('Error closing browser:', err)
      );
    }

    this.browsers = [];
    this.pageContexts.clear();
  }
}

export const browserPool = new BrowserPool();