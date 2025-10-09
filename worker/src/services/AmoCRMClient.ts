import { Page } from 'puppeteer';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

/**
 * Селекторы для amoCRM (с fallback вариантами)
 */
const SELECTORS = {
  // Авторизация
  authPage: '#authentication',

  // Чат
  chatButton: [
    'button[data-entity="chats"]',
    '.messenger-button',
    '[class*="messenger"]',
    'button:has-text("Чат")'
  ],
  chatInput: [
    'textarea[data-test="chat-input"]',
    'textarea[placeholder*="Напишите"]',
    '.chat-input textarea',
    'textarea[class*="message-input"]'
  ],
  chatSendButton: [
    'button[data-test="send-message"]',
    'button[class*="send-button"]',
    'button:has-text("Отправить")'
  ],

  // Примечания
  noteButton: [
    'button[data-entity="notes"]',
    '[class*="notes-button"]',
    'button:has-text("Примечание")'
  ],
  noteInput: [
    'textarea[data-test="note-input"]',
    'textarea[placeholder*="примечание"]',
    '.note-input textarea'
  ],
  noteSaveButton: [
    'button[data-test="save-note"]',
    'button:has-text("Сохранить")',
    'button[class*="save-button"]'
  ],

  // Задачи
  taskButton: [
    'button[data-entity="tasks"]',
    '[class*="task-button"]',
    'button:has-text("Задача")'
  ],
  taskInput: [
    'input[data-test="task-title"]',
    'input[placeholder*="задач"]',
    '.task-title input'
  ],
  taskSaveButton: [
    'button[data-test="save-task"]',
    'button:has-text("Создать")',
    'button[class*="create-task"]'
  ]
};

export class AmoCRMClient {
  constructor(
    private page: Page,
    private baseUrl: string,
    private accessToken: string
  ) {}

  /**
   * Открывает лид по ID
   */
  async openLead(leadId: number) {
    const leadUrl = `${this.baseUrl}/leads/detail/${leadId}`;
    logger.info(`Opening lead: ${leadUrl}`);

    try {
      await this.page.goto(leadUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Ждём загрузки основного контента
      await this.page.waitForSelector('body', { timeout: 10000 });

      logger.info(`Lead ${leadId} opened successfully`);
    } catch (error) {
      logger.error(`Failed to open lead ${leadId}:`, error);
      throw new Error(`Failed to open lead: ${error}`);
    }
  }

  /**
   * Отправляет сообщение в чат
   */
  async sendChatMessage(messageText: string) {
    logger.info('Sending chat message...');

    try {
      // Открываем чат
      const chatButton = await this.findElement(SELECTORS.chatButton);
      if (chatButton) {
        await chatButton.click();
        await this.page.waitForTimeout(1000);
      }

      // Находим поле ввода
      const inputElement = await this.findElement(SELECTORS.chatInput);
      if (!inputElement) {
        throw new Error('Chat input field not found');
      }

      // Вводим текст
      await inputElement.click();
      await this.page.waitForTimeout(500);
      await inputElement.type(messageText, { delay: 50 });
      await this.page.waitForTimeout(500);

      // Отправляем
      const sendButton = await this.findElement(SELECTORS.chatSendButton);
      if (!sendButton) {
        // Пробуем отправить через Enter
        await inputElement.press('Enter');
      } else {
        await sendButton.click();
      }

      await this.page.waitForTimeout(2000); // Ждём отправки

      logger.info('Chat message sent successfully');
    } catch (error) {
      logger.error('Failed to send chat message:', error);
      throw new Error(`Failed to send chat message: ${error}`);
    }
  }

  /**
   * Добавляет примечание
   */
  async addNote(noteText: string) {
    logger.info('Adding note...');

    try {
      // Открываем раздел примечаний
      const noteButton = await this.findElement(SELECTORS.noteButton);
      if (noteButton) {
        await noteButton.click();
        await this.page.waitForTimeout(1000);
      }

      // Находим поле ввода
      const inputElement = await this.findElement(SELECTORS.noteInput);
      if (!inputElement) {
        throw new Error('Note input field not found');
      }

      // Вводим текст
      await inputElement.click();
      await this.page.waitForTimeout(500);
      await inputElement.type(noteText, { delay: 50 });

      // Сохраняем
      const saveButton = await this.findElement(SELECTORS.noteSaveButton);
      if (saveButton) {
        await saveButton.click();
        await this.page.waitForTimeout(2000);
      }

      logger.info('Note added successfully');
    } catch (error) {
      logger.error('Failed to add note:', error);
      throw new Error(`Failed to add note: ${error}`);
    }
  }

  /**
   * Создаёт задачу
   */
  async createTask(taskText: string) {
    logger.info('Creating task...');

    try {
      // Открываем раздел задач
      const taskButton = await this.findElement(SELECTORS.taskButton);
      if (taskButton) {
        await taskButton.click();
        await this.page.waitForTimeout(1000);
      }

      // Находим поле ввода
      const inputElement = await this.findElement(SELECTORS.taskInput);
      if (!inputElement) {
        throw new Error('Task input field not found');
      }

      // Вводим текст
      await inputElement.click();
      await this.page.waitForTimeout(500);
      await inputElement.type(taskText, { delay: 50 });

      // Сохраняем
      const saveButton = await this.findElement(SELECTORS.taskSaveButton);
      if (saveButton) {
        await saveButton.click();
        await this.page.waitForTimeout(2000);
      }

      logger.info('Task created successfully');
    } catch (error) {
      logger.error('Failed to create task:', error);
      throw new Error(`Failed to create task: ${error}`);
    }
  }

  /**
   * Проверяет, требуется ли авторизация
   */
  async isAuthRequired(): Promise<boolean> {
    try {
      const authElement = await this.page.$(SELECTORS.authPage);
      return authElement !== null;
    } catch {
      return false;
    }
  }

  /**
   * Устанавливает cookies для авторизации
   */
  async setAuthCookies(refreshToken: string, expiry: number) {
    const domain = new URL(this.baseUrl).hostname;

    await this.page.setCookie(
      {
        name: 'access_token',
        value: this.accessToken,
        domain: domain,
        secure: true,
        expires: expiry
      },
      {
        name: 'refresh_token',
        value: refreshToken,
        domain: domain,
        secure: true,
        expires: expiry
      }
    );

    logger.info('Auth cookies set');
  }

  /**
   * Делает скриншот (для ошибок)
   */
  async takeScreenshot(filename: string): Promise<string> {
    try {
      const screenshotsDir = path.join(process.cwd(), 'logs', 'screenshots');

      // Создаём директорию если нет
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      const filepath = path.join(screenshotsDir, filename);
      await this.page.screenshot({
        path: filepath,
        fullPage: false
      });

      logger.info(`Screenshot saved: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error('Failed to take screenshot:', error);
      return '';
    }
  }

  /**
   * Универсальный поиск элемента с fallback селекторами
   */
  private async findElement(selectors: string | string[]) {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];

    for (const selector of selectorList) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          logger.debug(`Element found with selector: ${selector}`);
          return element;
        }
      } catch (error) {
        // Пробуем следующий селектор
        continue;
      }
    }

    logger.warn(`Element not found with any of the selectors:`, selectorList);
    return null;
  }

  /**
   * Ждёт появления элемента (с fallback)
   */
  private async waitForElement(selectors: string | string[], timeout = 10000) {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];

    for (const selector of selectorList) {
      try {
        await this.page.waitForSelector(selector, { timeout });
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }
}