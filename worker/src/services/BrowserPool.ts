import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../utils/logger.js';

interface PageContext {
  page: Page;
  lastUsed: number;
  accountId: number;
  leadId: number;
}

interface BrowserPoolConfig {
  minBrowsers?: number;
  maxBrowsers?: number;
  maxPagesPerBrowser?: number;
  pageTimeout?: number;
  reusePages?: boolean;
}

class BrowserPool {
  private browsers: Browser[] = [];
  private pageContexts: Map<string, PageContext> = new Map();
  private config: Required<BrowserPoolConfig>;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: BrowserPoolConfig = {}) {
    this.config = {
      minBrowsers: config.minBrowsers || 1,
      maxBrowsers: config.maxBrowsers || 3,
      maxPagesPerBrowser: config.maxPagesPerBrowser || 10,
      pageTimeout: config.pageTimeout || 5 * 60 * 1000, // 5 минут
      reusePages: config.reusePages !== undefined ? config.reusePages : true
    };
  }

  /**
   * Инициализация пула браузеров
   */
  async initialize() {
    logger.info('🚀 Initializing browser pool...', this.config);

    // Запускаем минимальное количество браузеров
    for (let i = 0; i < this.config.minBrowsers; i++) {
      await this.createBrowser();
    }

    // Запускаем периодическую очистку
    this.startCleanup();

    logger.info(`✅ Browser pool initialized with ${this.browsers.length} browsers`);
  }

  /**
   * Создаёт новый браузер
   */
  private async createBrowser(): Promise<Browser> {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    this.browsers.push(browser);
    logger.info(`Browser created. Total browsers: ${this.browsers.length}`);

    // Обработка закрытия браузера
    browser.on('disconnected', () => {
      this.browsers = this.browsers.filter(b => b !== browser);
      logger.warn(`Browser disconnected. Remaining: ${this.browsers.length}`);
    });

    return browser;
  }

  /**
   * Получает или создаёт страницу для аккаунта и лида
   */
  async getPage(accountId: number, leadId: number): Promise<Page> {
    const key = `${accountId}:${leadId}`;

    // ✅ ЗАЩИТА: Проверка что пул инициализирован
    if (this.browsers.length === 0) {
      logger.warn('⚠️  Browser pool not initialized, initializing now...');
      await this.initialize();
    }

    // Проверяем, есть ли уже страница для этого аккаунта и лида
    if (this.config.reusePages && this.pageContexts.has(key)) {
      const context = this.pageContexts.get(key)!;

      // Проверяем, что страница ещё валидна
      if (!context.page.isClosed()) {
        context.lastUsed = Date.now();
        logger.debug(`Reusing page for ${key}`);
        return context.page;
      } else {
        this.pageContexts.delete(key);
      }
    }

    // Создаём новую страницу
    const page = await this.createPage(accountId, leadId);

    if (this.config.reusePages) {
      this.pageContexts.set(key, {
        page,
        lastUsed: Date.now(),
        accountId,
        leadId
      });
    }

    return page;
  }

  /**
   * Создаёт новую страницу
   */
  private async createPage(accountId: number, leadId: number): Promise<Page> {
    let browser = this.browsers[0];

    // Выбираем браузер с наименьшим количеством страниц
    if (this.browsers.length > 1) {
      const browserPages = await Promise.all(
        this.browsers.map(async b => ({
          browser: b,
          count: (await b.pages()).length
        }))
      );

      browser = browserPages.sort((a, b) => a.count - b.count)[0].browser;
    }

    // Если во всех браузерах много страниц, создаём новый браузер
    const currentPages = await browser.pages();
    if (currentPages.length >= this.config.maxPagesPerBrowser) {
      if (this.browsers.length < this.config.maxBrowsers) {
        browser = await this.createBrowser();
      } else {
        logger.warn(`Reached max browsers (${this.config.maxBrowsers}), reusing existing`);
      }
    }

    const page = await browser.newPage();

    // Настраиваем страницу
    await this.setupPage(page);

    logger.info(`Created new page for account ${accountId}, lead ${leadId}`);

    return page;
  }

  /**
   * Настройка страницы (user agent, viewport, etc.)
   */
  private async setupPage(page: Page) {
    // User Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Viewport
    await page.setViewport({
      width: 1920,
      height: 1080
    });

    // Блокируем ненужные ресурсы для ускорения
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });
  }

  /**
   * Запускает периодическую очистку неиспользуемых страниц
   */
  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Каждую минуту
  }

  /**
   * Очищает неиспользуемые страницы
   */
  private async cleanup() {
    const now = Date.now();
    const pagesToDelete: string[] = [];

    for (const [key, context] of this.pageContexts.entries()) {
      const idleTime = now - context.lastUsed;

      if (idleTime > this.config.pageTimeout) {
        try {
          if (!context.page.isClosed()) {
            await context.page.close();
            logger.info(`Closed idle page: ${key} (idle: ${Math.round(idleTime / 1000)}s)`);
          }
          pagesToDelete.push(key);
        } catch (err) {
          logger.error(`Error closing page ${key}:`, err);
        }
      }
    }

    for (const key of pagesToDelete) {
      this.pageContexts.delete(key);
    }

    if (pagesToDelete.length > 0) {
      logger.info(`Cleanup: removed ${pagesToDelete.length} idle pages`);
    }
  }

  /**
   * Получает статистику пула
   */
  async getStats() {
    const activeBrowsers = this.browsers.length;
    let totalPages = 0;
    let healthyBrowsers = 0;

    for (const browser of this.browsers) {
      try {
        const pages = await browser.pages();
        totalPages += pages.length;
        healthyBrowsers++;
      } catch (err) {
        logger.error('Browser health check failed:', err);
      }
    }

    return {
      browsers: activeBrowsers,
      healthyBrowsers,
      totalPages,
      cachedPages: this.pageContexts.size,
      config: this.config
    };
  }

  /**
   * Закрывает все браузеры
   */
  async closeAll() {
    logger.info('Closing all browsers...');

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    for (const browser of this.browsers) {
      try {
        await browser.close();
      } catch (err) {
        logger.error('Error closing browser:', err);
      }
    }

    this.browsers = [];
    this.pageContexts.clear();

    logger.info('All browsers closed');
  }

  /**
   * Перезапускает пул браузеров
   */
  async restart() {
    logger.info('Restarting browser pool...');
    await this.closeAll();
    await this.initialize();
  }
}

// Singleton instance
export const browserPool = new BrowserPool({
  minBrowsers: parseInt(process.env.MIN_BROWSERS || '1'),
  maxBrowsers: parseInt(process.env.MAX_BROWSERS || '3'),
  maxPagesPerBrowser: parseInt(process.env.MAX_PAGES_PER_BROWSER || '10')
});