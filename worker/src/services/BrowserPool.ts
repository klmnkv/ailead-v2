import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../utils/logger.js';

interface BrowserContext {
  browser: Browser;
  pages: Map<string, Page>;
  lastUsed: Map<string, number>;
}

class BrowserPool {
  private contexts: Map<number, BrowserContext> = new Map();
  private maxBrowsers: number;
  private maxPagesPerBrowser: number;
  private pageTimeout: number = 300000;

  constructor() {
    this.maxBrowsers = parseInt(process.env.MAX_BROWSERS || '2');
    this.maxPagesPerBrowser = parseInt(process.env.MAX_PAGES_PER_BROWSER || '8');

    setInterval(() => this.cleanup(), 120000);
  }

  async getBrowser(accountId: number): Promise<Browser> {
    let context = this.contexts.get(accountId);

    if (!context || !context.browser.isConnected()) {
      logger.info(`Creating new browser for account ${accountId}`);

      const browser = await puppeteer.launch({
        headless: process.env.PUPPETEER_HEADLESS !== 'false',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions'
        ]
      });

      context = {
        browser,
        pages: new Map(),
        lastUsed: new Map()
      };

      this.contexts.set(accountId, context);
    }

    return context.browser;
  }

  async getPage(accountId: number, leadId: number): Promise<Page> {
    const key = `${accountId}:${leadId}`;
    const context = this.contexts.get(accountId);

    if (!context) {
      throw new Error(`No browser context for account ${accountId}`);
    }

    let page = context.pages.get(key);

    if (page && !page.isClosed()) {
      context.lastUsed.set(key, Date.now());
      return page;
    }

    logger.info(`Creating new page for account ${accountId}, lead ${leadId}`);

    const browser = await this.getBrowser(accountId);
    page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    context.pages.set(key, page);
    context.lastUsed.set(key, Date.now());

    if (context.pages.size > this.maxPagesPerBrowser) {
      await this.closeOldestPage(accountId);
    }

    return page;
  }

  private async closeOldestPage(accountId: number) {
    const context = this.contexts.get(accountId);
    if (!context) return;

    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, time] of context.lastUsed.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const page = context.pages.get(oldestKey);
      if (page && !page.isClosed()) {
        await page.close();
      }
      context.pages.delete(oldestKey);
      context.lastUsed.delete(oldestKey);
      logger.info(`Closed oldest page: ${oldestKey}`);
    }
  }

  private async cleanup() {
    const now = Date.now();

    for (const [accountId, context] of this.contexts.entries()) {
      for (const [key, lastUsed] of context.lastUsed.entries()) {
        if (now - lastUsed > this.pageTimeout) {
          const page = context.pages.get(key);
          if (page && !page.isClosed()) {
            await page.close();
          }
          context.pages.delete(key);
          context.lastUsed.delete(key);
          logger.info(`Cleaned up inactive page: ${key}`);
        }
      }
    }
  }

  async closeAll() {
    logger.info('Closing all browsers...');

    for (const context of this.contexts.values()) {
      if (context.browser.isConnected()) {
        await context.browser.close();
      }
    }

    this.contexts.clear();
    logger.info('All browsers closed');
  }
}

export const browserPool = new BrowserPool();