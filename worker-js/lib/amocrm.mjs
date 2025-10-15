import { logger } from './logger.mjs';

export class AmoCRMClient {
  constructor(page, credentials) {
    this.page = page;
    // Нормализуем URL
    this.baseUrl = credentials.base_url.replace(/^https?:\/\//, '');
    this.email = credentials.email;
    this.password = credentials.password;
    this.accessToken = credentials.access_token;
    this.refreshToken = credentials.refresh_token;
    this.tokenExpiry = credentials.expiry;
    this.isAuthenticated = false;
  }

  /**
   * Главный метод авторизации - пробует все способы
   */
  async ensureAuthorized() {
    logger.info('Checking authorization...');

    // Проверяем текущее состояние
    if (await this.isAuthorized()) {
      logger.info('Already authorized');
      return;
    }

    logger.warn('Not authorized, trying auth methods...');

    // Метод 1: Куки с токенами
    logger.info('Method 1: Setting auth cookies...');

    // Проверяем не истекли ли токены
    const now = Date.now();
    if (this.tokenExpiry && this.tokenExpiry < now) {
      logger.warn('⚠️ Tokens expired');
    }

    await this.setAuthCookies();
    await this.page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
    await this.page.waitForTimeout(2000);

    if (await this.isAuthorized()) {
      logger.info('✅ Authorized via cookies');
      this.isAuthenticated = true;
      return;
    }

    // Метод 2: Авторизация через форму (логин/пароль)
    if (this.email && this.password) {
      logger.warn('Method 2: Login via form (email/password)...');
      const loginSuccess = await this.loginWithCredentials();

      if (loginSuccess && await this.isAuthorized()) {
        logger.info('✅ Authorized via login form');
        this.isAuthenticated = true;
        return;
      }
    }

    // Все методы не сработали
    await this.takeScreenshot('auth-failed-all-methods');
    logger.error('❌ Authorization failed after all attempts');
    throw new Error('Authorization failed - all methods exhausted');
  }

  /**
   * Проверка авторизации
   */
  async isAuthorized() {
    try {
      // Проверяем что НЕ на странице логина
      const authPage = await this.isAuthPage();
      if (authPage) {
        logger.warn('On auth page - not authorized');
        return false;
      }

      // Проверяем наличие основных элементов amoCRM
      const hasContent = await this.page.evaluate(() => {
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
   * Проверка страницы авторизации
   */
  async isAuthPage() {
    try {
      const authElement = await this.page.$('#authentication');
      return authElement !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Установка куков с токенами
   */
  async setAuthCookies() {
    try {
      const domain = this.baseUrl.replace(/^https?:\/\//, '');

      // Очищаем старые куки
      const cookies = await this.page.cookies();
      for (const cookie of cookies) {
        await this.page.deleteCookie(cookie);
      }

      // Устанавливаем новые куки
      await this.page.setCookie(
        {
          name: 'access_token',
          value: this.accessToken,
          domain: `.${domain}`,
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'Lax'
        },
        {
          name: 'refresh_token',
          value: this.refreshToken,
          domain: `.${domain}`,
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'Lax'
        }
      );

      logger.info(`Auth cookies set for domain: ${domain}`);
    } catch (error) {
      logger.error('Error setting cookies:', error);
    }
  }

  /**
   * Авторизация через форму логина
   */
  async loginWithCredentials() {
    if (!this.email || !this.password) {
      logger.warn('Email/password not provided - cannot login via form');
      return false;
    }

    logger.info('Attempting login via form...', {
      email: this.email.substring(0, 3) + '***'
    });

    try {
      // Переходим на страницу логина
      const loginUrl = `https://${this.baseUrl}/oauth`;
      await this.page.goto(loginUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await this.page.waitForTimeout(2000);

      // Ждем форму авторизации (несколько вариантов селекторов)
      const emailInput = await this.page.waitForSelector(
        'input[name="username"], input[type="email"], input[name="login"]',
        { timeout: 10000 }
      ).catch(() => null);

      if (!emailInput) {
        logger.error('Login form not found');
        await this.takeScreenshot('login-no-form');
        return false;
      }

      // Вводим email
      await emailInput.click();
      await emailInput.type(this.email, { delay: 100 });
      await this.page.waitForTimeout(500);

      // Ищем кнопку "Далее" или сразу поле пароля
      const nextButton = await this.page.$('button[type="submit"]');
      if (nextButton) {
        const buttonText = await this.page.evaluate(el => el.textContent, nextButton);
        logger.info(`Found submit button: "${buttonText}"`);

        // Если кнопка говорит "Далее" или "Next" - кликаем
        if (buttonText && (buttonText.includes('Далее') || buttonText.includes('Next') || buttonText.includes('Продолжить'))) {
          await nextButton.click();
          await this.page.waitForTimeout(2000);
        }
      }

      // Вводим пароль
      const passwordInput = await this.page.waitForSelector(
        'input[name="password"], input[type="password"]',
        { timeout: 10000 }
      ).catch(() => null);

      if (!passwordInput) {
        logger.error('Password field not found');
        await this.takeScreenshot('login-no-password-field');
        return false;
      }

      await passwordInput.click();
      await passwordInput.type(this.password, { delay: 100 });
      await this.page.waitForTimeout(500);

      logger.info('Credentials entered, submitting form...');

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

      logger.info('✅ Login form submitted');
      return true;

    } catch (error) {
      logger.error('Error during form login:', error);
      await this.takeScreenshot('login-error');
      return false;
    }
  }

  /**
   * Открывает сделку по ID
   */
  async openLead(leadId) {
    const leadUrl = `https://${this.baseUrl}/leads/detail/${leadId}`;
    logger.info(`Opening lead: ${leadUrl}...`);

    try {
      await this.page.goto(leadUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // ✅ Сразу проверяем авторизацию
      await this.ensureAuthorized();
      await this.page.waitForTimeout(3000);

      logger.info(`✅ Lead ${leadId} opened successfully`);

    } catch (error) {
      logger.error(`Failed to open lead ${leadId}:`, error);
      await this.takeScreenshot('open-lead-error');
      throw error;
    }
  }

  /**
   * Отправляет сообщение в чат сделки
   */
  async sendChatMessage(messageText) {
    logger.info('Sending chat message...');

    try {
      // Выбираем получателя
      await this.selectRecipient();

      // Отправляем сообщение
      await this.sendMessage(messageText);

      logger.info('✅ Chat message sent successfully');

    } catch (error) {
      logger.error('Failed to send chat message:', error);
      await this.takeScreenshot('send-message-error');
      throw error;
    }
  }

  /**
   * Выбор получателя сообщения
   */
  async selectRecipient() {
    logger.info('Selecting recipient...');

    const userSelector = '.feed-compose-user__name';
    const recipientSelector = '.multisuggest__suggest-item';

    const userElement = await this.page.waitForSelector(userSelector, {
      timeout: 10000
    }).catch(() => null);

    if (!userElement) {
      await this.takeScreenshot('no-user-selector');
      throw new Error('User selector not found');
    }

    await userElement.click();
    await this.page.waitForTimeout(1500);

    logger.info('Waiting for recipient list...');
    const recipientElement = await this.page.waitForSelector(recipientSelector, {
      timeout: 15000
    }).catch(() => null);

    if (recipientElement) {
      await recipientElement.click();
      await this.page.waitForTimeout(1500);
      logger.info('Recipient selected');
    } else {
      logger.warn('Recipient list not found, continuing anyway...');
    }

    await this.page.waitForTimeout(1000);
  }

  /**
   * Ввод и отправка сообщения
   */
  async sendMessage(messageText) {
    logger.info('Typing and sending message...');

    const messageInputSelector = '.feed-compose__message';
    const sendButtonSelector = '.feed-note__button';

    const messageInput = await this.page.waitForSelector(messageInputSelector, {
      timeout: 10000
    }).catch(() => null);

    if (!messageInput) {
      await this.takeScreenshot('no-message-input');
      throw new Error('Message input not found');
    }

    // Вводим текст
    await messageInput.click();
    await this.page.waitForTimeout(500);
    await messageInput.type(messageText, { delay: 50 });
    await this.page.waitForTimeout(500);

    logger.info('Message typed, clicking send button...');

    // Нажимаем кнопку отправки
    const sendButton = await this.page.waitForSelector(sendButtonSelector, {
      timeout: 10000
    }).catch(() => null);

    if (sendButton) {
      await sendButton.click();
    } else {
      // Альтернатива: Enter
      await messageInput.press('Enter');
    }

    await this.page.waitForTimeout(2000);
    logger.info('✅ Message sent');
  }

  /**
   * Добавляет примечание к сделке
   */
  async addNote(noteText) {
    logger.info('Adding note...');
    logger.warn('Note adding not implemented yet');
  }

  /**
   * Создает задачу в сделке
   */
  async createTask(taskText) {
    logger.info('Creating task...');
    logger.warn('Task creation not implemented yet');
  }

  /**
   * Делает скриншот страницы для отладки
   */
  async takeScreenshot(name) {
    try {
      const fs = await import('fs');
      if (!fs.existsSync('logs/screenshots')) {
        fs.mkdirSync('logs/screenshots', { recursive: true });
      }

      const filename = `logs/screenshots/${name}-${Date.now()}.png`;
      await this.page.screenshot({
        path: filename,
        fullPage: true
      });
      logger.info(`Screenshot saved: ${filename}`);
    } catch (error) {
      logger.error('Failed to take screenshot:', error);
    }
  }
}