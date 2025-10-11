import { Page } from 'puppeteer';
import { logger } from '../utils/logger.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const SELECTORS = {
  authPage: '#authentication',
  userSelector: '.feed-compose-user__name',
  recipientItem: '.multisuggest__suggest-item',
  messageInput: '.feed-compose__message',
  sendButton: '.feed-note__button',
  taskInput: '.control-contenteditable__area',
};

interface AmoCRMCredentials {
  base_url: string;
  access_token: string;
  refresh_token: string;
  expiry: number;
  email?: string;       // ← ДОБАВИЛИ
  password?: string;    // ← ДОБАВИЛИ
}

export class AmoCRMClient {
  constructor(
    private page: Page,
    private baseUrl: string,
    private credentials: AmoCRMCredentials
  ) {}

  /**
   * 🔐 Проверка и обновление токенов через API
   */
  private async refreshAccessToken(): Promise<string> {
    logger.info('Refreshing access token via API...');

    try {
      const clientId = process.env.AMOCRM_CLIENT_ID;
      const clientSecret = process.env.AMOCRM_CLIENT_SECRET;
      const redirectUri = process.env.AMOCRM_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        logger.warn('OAuth credentials not configured in .env - skipping token refresh');
        logger.warn('Using existing tokens (they may be expired)');
        return this.credentials.access_token;
      }

      logger.info('Attempting to refresh token...', {
        baseUrl: this.baseUrl,
        clientId: clientId.substring(0, 8) + '...',
        hasRefreshToken: !!this.credentials.refresh_token
      });

      const response = await axios.post(
        `${this.baseUrl}/oauth2/access_token`,
        {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: this.credentials.refresh_token,
          redirect_uri: redirectUri
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const newAccessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token;
      const expiresIn = response.data.expires_in;

      logger.info('✅ Access token refreshed successfully');

      // Обновляем credentials
      this.credentials.access_token = newAccessToken;
      this.credentials.refresh_token = newRefreshToken;
      this.credentials.expiry = Date.now() + expiresIn * 1000;

      // TODO: Обновить токены в БД через API
      // await this.updateTokensInDatabase(newAccessToken, newRefreshToken);

      return newAccessToken;

    } catch (error: any) {
      logger.error('❌ Failed to refresh access token:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Не бросаем ошибку, а продолжаем с существующими токенами
      logger.warn('⚠️ Continuing with existing tokens (may fail if expired)');
      return this.credentials.access_token;
    }
  }

  /**
   * 🔐 Проверка авторизации (проверяем доступ к контенту)
   */
  private async isAuthorized(): Promise<boolean> {
    try {
      // Проверяем что НЕ на странице логина
      const authPage = await this.isAuthPage();
      if (authPage) {
        logger.warn('On auth page - not authorized');
        return false;
      }

      // Проверяем наличие основных элементов amoCRM
      const hasContent = await this.page.evaluate(() => {
        // Ищем типичные элементы интерфейса amoCRM
        const selectors = [
          '.page-body',
          '.page-head',
          '.pipeline-trigger',
          '.feed-compose-user__name',
          '.card-contact',
          '[data-entity="leads"]'
        ];

        return selectors.some(selector => document.querySelector(selector) !== null);
      });

      if (!hasContent) {
        logger.warn('amoCRM content not found - probably not authorized');
        return false;
      }

      logger.info('✅ Authorized - content accessible');
      return true;

    } catch (error) {
      logger.error('Error checking authorization:', error);
      return false;
    }
  }

  /**
   * 🔐 Установка авторизации через куки
   */
  async ensureAuthorized(): Promise<void> {
    logger.info('Checking authorization...');

    // Проверяем текущее состояние
    if (await this.isAuthorized()) {
      logger.info('Already authorized');
      return;
    }

    logger.warn('Not authorized, trying auth methods...');

    // Метод 1: Cookies с токенами
    logger.info('Method 1: Setting auth cookies...');

    // Обновляем токены если истекли
    const now = Date.now();
    if (this.credentials.expiry < now) {
      logger.warn('⚠️ Tokens expired, attempting to refresh...');
      await this.refreshAccessToken();
    }

    await this.setAuthCookies();
    await this.page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
    await this.page.waitForTimeout(2000);

    if (await this.isAuthorized()) {
      logger.info('✅ Authorized via cookies');
      return;
    }

    // Метод 2: Авторизация через форму (логин/пароль)
    if (this.credentials.email && this.credentials.password) {
      logger.warn('Method 2: Login via form (email/password)...');
      const loginSuccess = await this.loginWithCredentials();

      if (loginSuccess && await this.isAuthorized()) {
        logger.info('✅ Authorized via login form');
        return;
      }
    }

    // Все методы не сработали
    await this.takeScreenshot(`auth_failed_all_methods_${Date.now()}.png`);
    logger.error('❌ Authorization failed after all attempts');
    logger.error('💡 Possible solutions:');
    logger.error('   1. Check email/password in database');
    logger.error('   2. Check tokens in database (table: integrations)');
    logger.error('   3. Manually re-authorize the integration');
    throw new Error('Authorization failed - all methods exhausted');
  }

  /**
   * Проверка страницы авторизации
   */
  private async isAuthPage(): Promise<boolean> {
    try {
      const authElement = await this.page.$(SELECTORS.authPage);
      return authElement !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * 🔐 Авторизация через форму входа (логин/пароль)
   */
  private async loginWithCredentials(): Promise<boolean> {
    if (!this.credentials.email || !this.credentials.password) {
      logger.warn('Email/password not provided - cannot login via form');
      return false;
    }

    logger.info('Attempting login via form...', {
      email: this.credentials.email.substring(0, 3) + '***'
    });

    try {
      // Переходим на страницу логина
      await this.page.goto(`${this.baseUrl}/oauth`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await this.page.waitForTimeout(2000);

      // Ждем форму авторизации
      const emailInput = await this.page.waitForSelector(
        'input[name="username"], input[type="email"], input[name="login"]',
        { timeout: 10000 }
      ).catch(() => null);

      if (!emailInput) {
        logger.error('Login form not found');
        await this.takeScreenshot(`login_no_form_${Date.now()}.png`);
        return false;
      }

      // Вводим email
      await emailInput.click();
      await emailInput.type(this.credentials.email, { delay: 100 });
      await this.page.waitForTimeout(500);

      // Ищем кнопку "Далее" или сразу поле пароля
      const nextButton = await this.page.$('button[type="submit"]');
      if (nextButton) {
        const buttonText = await this.page.evaluate(el => el.textContent, nextButton);
        logger.info(`Found submit button: "${buttonText}"`);
        await nextButton.click();
        await this.page.waitForTimeout(2000);
      }

      // Вводим пароль
      const passwordInput = await this.page.waitForSelector(
        'input[name="password"], input[type="password"]',
        { timeout: 10000 }
      ).catch(() => null);

      if (!passwordInput) {
        logger.error('Password field not found');
        await this.takeScreenshot(`login_no_password_field_${Date.now()}.png`);
        return false;
      }

      await passwordInput.click();
      await passwordInput.type(this.credentials.password, { delay: 100 });
      await this.page.waitForTimeout(500);

      // Нажимаем "Войти"
      const submitButton = await this.page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
      } else {
        await passwordInput.press('Enter');
      }

      // Ждем завершения авторизации
      await this.page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 15000
      }).catch(() => {
        logger.warn('Navigation timeout - checking if logged in anyway');
      });

      await this.page.waitForTimeout(3000);

      logger.info('✅ Login form submitted, checking result...');
      return true;

    } catch (error: any) {
      logger.error('Error during form login:', error.message);
      await this.takeScreenshot(`login_error_${Date.now()}.png`);
      return false;
    }
  }

  /**
   * Установка куков для авторизации
   */
  private async setAuthCookies(): Promise<void> {
    const domain = new URL(this.baseUrl).hostname;

    // Очищаем старые куки
    const cookies = await this.page.cookies();
    for (const cookie of cookies) {
      await this.page.deleteCookie(cookie);
    }

    // Устанавливаем новые куки
    await this.page.setCookie(
      {
        name: 'access_token',
        value: this.credentials.access_token,
        domain: `.${domain}`,
        path: '/',
        secure: true,
        httpOnly: false,
        sameSite: 'Lax'
      },
      {
        name: 'refresh_token',
        value: this.credentials.refresh_token,
        domain: `.${domain}`,
        path: '/',
        secure: true,
        httpOnly: false,
        sameSite: 'Lax'
      }
    );

    logger.info('Auth cookies set for domain:', domain);
  }

  /**
   * Открывает лид по ID
   */
  async openLead(leadId: number) {
    const leadUrl = `${this.baseUrl}/leads/detail/${leadId}`;
    logger.info(`Opening lead: ${leadUrl}`);

    try {
      await this.page.goto(leadUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // ✅ СРАЗУ проверяем авторизацию
      await this.ensureAuthorized();
      await this.page.waitForTimeout(3000);

      logger.info(`Lead ${leadId} opened successfully`);
    } catch (error) {
      logger.error(`Failed to open lead ${leadId}:`, error);
      await this.takeScreenshot(`error_open_lead_${leadId}_${Date.now()}.png`);
      throw error;
    }
  }

  /**
   * Отправляет сообщение в чат
   */
  async sendChatMessage(messageText: string) {
    logger.info('Sending chat message...');

    try {
      // ✅ УБИРАЕМ повторную проверку авторизации - она уже была в openLead
      // await this.ensureAuthorized();

      await this.selectRecipient();
      await this.sendMessage(messageText);
      logger.info('Chat message sent successfully');
    } catch (error: any) {
      logger.error('Failed to send chat message:', error);
      await this.takeScreenshot(`error_chat_${Date.now()}.png`);
      throw new Error(`Failed to send chat message: ${error.message}`);
    }
  }

  /**
   * Выбор получателя
   */
  private async selectRecipient(): Promise<void> {
    logger.info('Selecting recipient...');

    const userElement = await this.page.waitForSelector(
      SELECTORS.userSelector,
      { timeout: 10000 }
    ).catch(() => null);

    if (!userElement) {
      await this.takeScreenshot(`error_no_user_selector_${Date.now()}.png`);
      throw new Error(`User selector not found: ${SELECTORS.userSelector}`);
    }

    await this.safeClick(SELECTORS.userSelector, 1500);

    logger.info('Waiting for recipient list...');
    const recipientElement = await this.page.waitForSelector(
      SELECTORS.recipientItem,
      { timeout: 15000 }
    ).catch(() => null);

    if (recipientElement) {
      await this.safeClick(SELECTORS.recipientItem, 1500, false);
      logger.info('Recipient selected');
    } else {
      logger.warn('Recipient list not found, continuing anyway...');
    }

    await this.page.waitForTimeout(1000);
  }

  /**
   * Ввод и отправка сообщения
   */
  private async sendMessage(messageText: string): Promise<void> {
    logger.info('Typing and sending message...');

    const errorMessage = await this.page.evaluate((text, inputSel, buttonSel) => {
      const inputField = document.querySelector(inputSel);
      if (!inputField) {
        return `Input field not found: ${inputSel}`;
      }

      (inputField as HTMLElement).click();

      const range = document.createRange();
      range.selectNodeContents(inputField);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand('delete');

      document.execCommand('insertText', false, text);

      const normalize = (t: string) => t.replace(/\r?\n/g, '').replace(/\s+/g, ' ').trim();
      if (normalize(inputField.textContent || '') !== normalize(text)) {
        return `Text not inserted correctly: "${inputField.textContent}" !== "${text}"`;
      }

      const sendButton = document.querySelector(buttonSel);
      if (!sendButton) {
        return `Send button not found: ${buttonSel}`;
      }

      (sendButton as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      (sendButton as HTMLElement).click();

      return null;
    }, messageText, SELECTORS.messageInput, SELECTORS.sendButton);

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    await this.page.waitForTimeout(2000);
    logger.info('Message sent');
  }

  /**
   * Безопасный клик с retry
   */
  private async safeClick(
    selector: string,
    delay: number = 1000,
    reload: boolean = true
  ): Promise<void> {
    if (await this.attemptClick(selector, delay)) {
      return;
    }

    logger.warn(`Failed to click ${selector}, reloading page...`);

    if (reload) {
      try {
        await this.page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
        await this.page.waitForTimeout(2000);

        if (await this.attemptClick(selector, delay)) {
          return;
        }
      } catch (error) {
        logger.error(`Reload failed:`, error);
      }
    }

    throw new Error(`Failed to click ${selector} after multiple attempts`);
  }

  /**
   * Попытка клика
   */
  private async attemptClick(selector: string, delay: number): Promise<boolean> {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        logger.debug(`Click attempt ${attempt} on ${selector}`);

        await this.page.waitForSelector(selector, {
          visible: true,
          timeout: 10000
        });

        const isClickable = await this.page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return false;

          const { x, y, width, height } = el.getBoundingClientRect();
          const centerX = x + width / 2;
          const centerY = y + height / 2;
          const topEl = document.elementFromPoint(centerX, centerY);

          return el === topEl;
        }, selector);

        if (!isClickable) {
          logger.warn(`Element ${selector} is covered by another element`);
          await this.page.waitForTimeout(1000 * attempt);
          continue;
        }

        await this.page.click(selector);
        await this.page.waitForTimeout(delay);

        logger.debug(`Click successful on ${selector}`);
        return true;

      } catch (error) {
        logger.warn(`Click attempt ${attempt} failed:`, error);
        await this.page.waitForTimeout(1000 * attempt);
      }
    }

    return false;
  }

  /**
   * Добавляет примечание
   */
  async addNote(noteText: string) {
    logger.info('Adding note - not implemented');
    // TODO: Implement note functionality
  }

  /**
   * Создает задачу
   */
  async createTask(taskText: string) {
    logger.info('Creating task - not implemented');
    // TODO: Implement task functionality
  }

  /**
   * Делает скриншот страницы
   */
  async takeScreenshot(filename: string): Promise<string> {
    try {
      const screenshotsDir = path.join(process.cwd(), 'logs', 'screenshots');

      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      const filepath = path.join(screenshotsDir, filename);
      await this.page.screenshot({
        path: filepath,
        fullPage: true
      });

      logger.info(`Screenshot saved: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error('Failed to take screenshot:', error);
      return '';
    }
  }
}