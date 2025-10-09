import { Page } from 'puppeteer';
import { logger } from '../utils/logger.js';

export class AmoCRMClient {
  private page: Page;
  private baseUrl: string;
  private accessToken: string;

  constructor(page: Page, baseUrl: string, accessToken: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
  }

  async openLead(leadId: number): Promise<void> {
    const url = `${this.baseUrl}/leads/detail/${leadId}`;
    logger.info(`Opening lead: ${url}`);

    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await this.page.waitForSelector('body', { timeout: 10000 });

      logger.info(`Lead page loaded: ${leadId}`);
    } catch (error) {
      logger.error(`Failed to open lead ${leadId}:`, error);
      throw error;
    }
  }

  async sendChatMessage(text: string): Promise<void> {
    logger.info('Sending chat message...');

    try {
      const selectors = [
        'textarea[data-type="message"]',
        'textarea.chat-input__textarea',
        '.messenger-compose__textarea textarea',
        '[data-test="chat-input"] textarea',
        'div[contenteditable="true"][data-placeholder]'
      ];

      let inputElement = null;

      for (const selector of selectors) {
        try {
          inputElement = await this.page.$(selector);
          if (inputElement) {
            logger.info(`Found input with selector: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!inputElement) {
        throw new Error('Chat input not found');
      }

      await inputElement.click();
      await this.page.keyboard.type(text, { delay: 50 });
      await this.page.waitForTimeout(500);

      const sendButtonSelectors = [
        'button[data-type="send"]',
        'button.chat-input__send',
        '.messenger-compose__send button',
        '[data-test="send-button"]'
      ];

      let sendButton = null;

      for (const selector of sendButtonSelectors) {
        try {
          sendButton = await this.page.$(selector);
          if (sendButton) {
            logger.info(`Found send button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!sendButton) {
        logger.info('Send button not found, trying Enter key');
        await this.page.keyboard.press('Enter');
      } else {
        await sendButton.click();
      }

      await this.page.waitForTimeout(1000);
      logger.info('Chat message sent successfully');

    } catch (error) {
      logger.error('Failed to send chat message:', error);
      throw error;
    }
  }

  async addNote(text: string): Promise<void> {
    logger.info('Adding note...');
    try {
      const noteSelectors = [
        'textarea[name="note"]',
        '.note-editor textarea',
        '[data-test="note-input"] textarea'
      ];

      let noteInput = null;

      for (const selector of noteSelectors) {
        try {
          noteInput = await this.page.$(selector);
          if (noteInput) break;
        } catch (e) {
          continue;
        }
      }

      if (!noteInput) {
        logger.warn('Note input not found, skipping note');
        return;
      }

      await noteInput.click();
      await this.page.keyboard.type(text, { delay: 30 });

      const saveSelectors = [
        'button[data-type="save-note"]',
        '.note-save-button',
        'button:has-text("Сохранить")'
      ];

      for (const selector of saveSelectors) {
        try {
          const saveButton = await this.page.$(selector);
          if (saveButton) {
            await saveButton.click();
            break;
          }
        } catch (e) {
          continue;
        }
      }

      await this.page.waitForTimeout(1000);
      logger.info('Note added successfully');

    } catch (error) {
      logger.error('Failed to add note:', error);
    }
  }

  async createTask(text: string): Promise<void> {
    logger.info('Creating task...');
    try {
      const taskSelectors = [
        'button[data-type="add-task"]',
        '.task-add-button',
        '[data-test="create-task"]'
      ];

      let taskButton = null;

      for (const selector of taskSelectors) {
        try {
          taskButton = await this.page.$(selector);
          if (taskButton) break;
        } catch (e) {
          continue;
        }
      }

      if (!taskButton) {
        logger.warn('Task button not found, skipping task');
        return;
      }

      await taskButton.click();
      await this.page.waitForTimeout(500);

      const taskInputSelectors = [
        'textarea[name="task_text"]',
        '.task-input textarea',
        '[data-test="task-text"] textarea'
      ];

      for (const selector of taskInputSelectors) {
        try {
          const taskInput = await this.page.$(selector);
          if (taskInput) {
            await taskInput.click();
            await this.page.keyboard.type(text, { delay: 30 });
            break;
          }
        } catch (e) {
          continue;
        }
      }

      const saveTaskSelectors = [
        'button[data-type="save-task"]',
        '.task-save-button',
        'button:has-text("Создать")'
      ];

      for (const selector of saveTaskSelectors) {
        try {
          const saveButton = await this.page.$(selector);
          if (saveButton) {
            await saveButton.click();
            break;
          }
        } catch (e) {
          continue;
        }
      }

      await this.page.waitForTimeout(1000);
      logger.info('Task created successfully');

    } catch (error) {
      logger.error('Failed to create task:', error);
    }
  }

  async takeScreenshot(filename: string): Promise<string> {
    const path = `logs/screenshots/${filename}`;
    await this.page.screenshot({ path, fullPage: true });
    logger.info(`Screenshot saved: ${path}`);
    return path;
  }
}