// worker-js/lib/amocrm.mjs
import { logger } from './logger.mjs';

export class AmoCRMClient {
  constructor(page, credentials) {
    this.page = page;
    this.baseUrl = credentials.base_url;
    this.email = credentials.email;
    this.password = credentials.password;
    this.isAuthenticated = false;
  }

  /**
   * Авторизация через форму логина
   */
  async login() {
    if (this.isAuthenticated) {
      logger.info('Already authenticated');
      return;
    }

    logger.info('Starting login process...', {
      email: this.email?.substring(0, 3) + '***'
    });

    try {
      const domain = new URL(this.baseUrl).hostname;
      const loginUrl = `https://${domain}/leads`;

      logger.info(`Navigating to: ${loginUrl}`);
      await this.page.goto(loginUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await this.page.waitForTimeout(2000);

      const hasAuthForm = await this.page.$('#authentication');

      if (!hasAuthForm) {
        logger.info('Already logged in (no auth form found)');
        this.isAuthenticated = true;
        return;
      }

      logger.info('Auth form detected, filling credentials...');

      const emailSelector = 'input[name="username"], input[type="email"], input[name="login"]';
      const passwordSelector = 'input[name="password"], input[type="password"]';

      await this.page.waitForSelector(emailSelector, {
        visible: true,
        timeout: 10000
      });

      logger.info('Clearing and filling email field...');

      await this.page.evaluate((selector, email) => {
        const input = document.querySelector(selector);
        if (input) {
          input.value = '';
          input.defaultValue = '';
          input.setAttribute('autocomplete', 'off');
          input.focus();
          input.select();
          document.execCommand('delete');
          input.value = email;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        }
      }, emailSelector, this.email);

      await this.page.waitForTimeout(500);

      const emailValue = await this.page.$eval(emailSelector, el => el.value);
      logger.info('Email field value:', emailValue);

      if (emailValue !== this.email) {
        logger.warn('Email value mismatch! Trying alternative method...');
        await this.page.click(emailSelector, { clickCount: 3 });
        await this.page.keyboard.press('Backspace');
        await this.page.waitForTimeout(200);
        await this.page.keyboard.type(this.email, { delay: 50 });
        await this.page.waitForTimeout(500);
      }

      const submitButton = await this.page.$('button[type="submit"]');
      const passwordExists = await this.page.$(passwordSelector);

      if (submitButton && !passwordExists) {
        const buttonText = await this.page.evaluate(btn => btn.innerText, submitButton);
        logger.info('Submit button found:', buttonText);

        if (buttonText.includes('Далее') || buttonText.includes('Продолжить') || buttonText.includes('Next')) {
          logger.info('Clicking "Next" button...');
          await submitButton.click();
          await this.page.waitForTimeout(2000);
        }
      }

      await this.page.waitForSelector(passwordSelector, {
        visible: true,
        timeout: 10000
      });

      logger.info('Clearing and filling password field...');

      await this.page.evaluate((selector, password) => {
        const input = document.querySelector(selector);
        if (input) {
          input.value = '';
          input.defaultValue = '';
          input.setAttribute('autocomplete', 'off');
          input.focus();
          input.select();
          document.execCommand('delete');
          input.value = password;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        }
      }, passwordSelector, this.password);

      await this.page.waitForTimeout(500);

      const passwordLength = await this.page.$eval(passwordSelector, el => el.value.length);
      logger.info('Password field length:', passwordLength);

      if (passwordLength !== this.password.length) {
        logger.warn('Password length mismatch! Expected:', this.password.length, 'Got:', passwordLength);
      }

      const hasCaptcha = await this.page.evaluate(() => {
        return !!(
          document.querySelector('.g-recaptcha') ||
          document.querySelector('[data-sitekey]') ||
          document.querySelector('iframe[src*="recaptcha"]') ||
          document.querySelector('iframe[src*="captcha"]') ||
          document.querySelector('.captcha')
        );
      });

      if (hasCaptcha) {
        logger.warn('⚠️ Captcha detected! Waiting 30 seconds for manual solving...');
        await this.takeScreenshot(`captcha_detected_${Date.now()}`);
        await this.page.waitForTimeout(30000);
      }

      const loginButton = await this.page.$('button[type="submit"]');
      if (loginButton) {
        logger.info('Clicking login button...');
        await loginButton.click();
      } else {
        logger.info('Login button not found, pressing Enter...');
        await this.page.keyboard.press('Enter');
      }

      logger.info('Waiting for navigation after login...');

      await Promise.race([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 }),
        this.page.waitForFunction(() => !document.querySelector('#authentication'), { timeout: 45000 }),
        this.page.waitForFunction(() => {
          return !!(
            document.querySelector('.top-menu') ||
            document.querySelector('.nav-menu') ||
            document.querySelector('.feed-compose') ||
            document.querySelector('.pipeline-selector')
          );
        }, { timeout: 45000 })
      ]).catch((error) => {
        logger.warn('Wait timeout after login:', error.message);
      });

      await this.page.waitForTimeout(3000);

      const stillHasAuthForm = await this.page.$('#authentication');

      if (!stillHasAuthForm) {
        logger.info('✅ Login successful - auth form disappeared');
        this.isAuthenticated = true;
      } else {
        logger.error('Login failed - auth form still present');
        await this.takeScreenshot('login-failed');
        throw new Error('Login failed - auth form still visible');
      }

    } catch (error) {
      logger.error('Login error:', error);
      await this.takeScreenshot('login-error');
      throw error;
    }
  }

  /**
   * Проверка авторизации
   */
  async ensureAuthorized() {
    // ✅ ДОБАВЛЕНО: Проверяем что страница не закрыта
    if (this.page.isClosed()) {
      logger.error('Page is closed!');
      throw new Error('Page is closed');
    }

    const isAuthPage = await this.page.$('#authentication').catch(() => null);

    if (isAuthPage) {
      logger.info('Auth required, logging in...');
      await this.login();

      const stillAuthPage = await this.page.$('#authentication').catch(() => null);
      if (stillAuthPage) {
        logger.warn('Still on auth page after login, reloading...');
        await this.page.reload({ waitUntil: 'domcontentloaded' });
        await this.page.waitForTimeout(2000);
      }

      if (await this.page.$('#authentication').catch(() => null)) {
        logger.error('Authorization failed after all attempts');
        await this.takeScreenshot('auth-failed');
        throw new Error('Authorization failed');
      }
    }
  }

  /**
   * Открывает сделку по ID
   */
  async openLead(leadId) {
    const leadUrl = `${this.baseUrl}/leads/detail/${leadId}`;

    logger.info(`Opening lead: ${leadUrl}...`);

    try {
      // ✅ ДОБАВЛЕНО: Проверяем что страница не закрыта
      if (this.page.isClosed()) {
        throw new Error('Page is closed before opening lead');
      }

      const currentUrl = this.page.url();

      if (currentUrl.includes(`/leads/detail/${leadId}`)) {
        logger.info(`Already on lead ${leadId} page, verifying...`);

        const pageLoaded = await this.page.evaluate(() => {
          return !!(
            document.querySelector('.card-header') ||
            document.querySelector('.feed-compose') ||
            document.querySelector('.pipeline-leads__card')
          );
        });

        if (pageLoaded) {
          logger.info(`Lead ${leadId} page verified`);
        } else {
          logger.warn(`Lead page elements not found, reloading...`);
          await this.page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
          await this.page.waitForTimeout(2000);
        }
      } else {
        logger.info(`Navigating to lead ${leadId}...`);
        await this.page.goto(leadUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        await this.page.waitForTimeout(2000);
      }

      // Проверяем авторизацию
      await this.ensureAuthorized();

      // ✅ ИСПРАВЛЕНО: После логина могли попасть на воронку - проверяем и переходим заново
      const finalUrl = this.page.url();
      if (!finalUrl.includes(`/leads/detail/${leadId}`)) {
        logger.warn(`Not on lead page after auth. Current: ${finalUrl}. Navigating again...`);
        await this.page.goto(leadUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        await this.page.waitForTimeout(3000);
      }

      // Ждём ключевые элементы страницы сделки
      logger.info('Waiting for lead page elements...');

      const leadPageLoaded = await Promise.race([
        this.page.waitForSelector('.card-header', { timeout: 15000 }).then(() => true),
        this.page.waitForSelector('.feed-compose', { timeout: 15000 }).then(() => true),
        this.page.waitForSelector('.pipeline-leads__card', { timeout: 15000 }).then(() => true),
        new Promise(resolve => setTimeout(() => resolve(false), 15000))
      ]);

      if (!leadPageLoaded) {
        logger.warn('Lead page elements not found after timeout');
        await this.takeScreenshot(`lead-page-not-loaded-${leadId}`);

        const verifyUrl = this.page.url();
        if (!verifyUrl.includes(`/leads/detail/${leadId}`)) {
          throw new Error(`Not on lead page. Current URL: ${verifyUrl}`);
        }

        logger.warn('URL is correct but elements not found - continuing anyway');
      }

      await this.page.waitForTimeout(3000);

      logger.info(`✅ Lead ${leadId} opened successfully`);

    } catch (error) {
      logger.error(`Failed to open lead ${leadId}:`, error);

      // ✅ ДОБАВЛЕНО: Безопасная диагностика
      try {
        const diagnostics = await this.page.evaluate(() => {
          return {
            url: window.location.href,
            title: document.title,
            hasCardHeader: !!document.querySelector('.card-header'),
            hasFeedCompose: !!document.querySelector('.feed-compose'),
            hasPipelineCard: !!document.querySelector('.pipeline-leads__card'),
            hasAuthForm: !!document.querySelector('#authentication')
          };
        });
        logger.error('Lead page diagnostics:', diagnostics);
      } catch (diagError) {
        logger.error('Could not get diagnostics:', diagError.message);
      }

      await this.takeScreenshot(`error-open-lead-${leadId}`).catch(() => {});
      throw error;
    }
  }

  // ... остальные методы без изменений (openChat, sendChatMessage и т.д. - оставляем как были)

  async openChat() {
    logger.info('Opening chat...');

    try {
      await this.page.waitForSelector('.feed-compose', { timeout: 10000 });
      await this.expandChatIfMinimized();
      await this.page.waitForSelector('.feed-compose-switcher', { visible: true, timeout: 5000 });

      const currentText = await this.page.$eval('.feed-compose-switcher', el => el.innerText?.trim() || '').catch(() => '');
      logger.info(`Current tab: "${currentText}"`);

      if (currentText === 'Чат') {
        logger.info('Chat tab already selected, verifying...');
        const hasCorrectClasses = await this.page.evaluate(() => {
          const noteContainer = document.querySelector('.js-note');
          return noteContainer?.classList.contains('feed-compose_amojo') &&
                 !noteContainer?.classList.contains('feed-compose_note');
        });

        if (hasCorrectClasses) {
          logger.info('Chat interface already loaded with correct classes');
          return;
        }
        logger.warn('Chat selected but wrong classes, fixing...');
      }

      logger.info('Switching to chat...');

      const switchResult = await this.page.evaluate(() => {
        const hiddenInput = document.querySelector('input[name="feed-compose-switcher"]');
        if (hiddenInput) {
          hiddenInput.value = 'chat';
          hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const chatSwitcher = document.querySelector('.js-switcher-chat');
        if (!chatSwitcher) {
          return { success: false, error: 'Chat switcher not found' };
        }

        chatSwitcher.click();
        return { success: true };
      });

      if (!switchResult.success) {
        throw new Error(switchResult.error || 'Failed to switch to chat');
      }

      await this.page.waitForTimeout(2000);

      const messageInput = await this.page.$('.control-contenteditable__area.feed-compose__message');
      if (!messageInput) {
        logger.error('Chat interface did not load');
        await this.takeScreenshot('error-chat-interface');
        throw new Error('Chat interface did not load');
      }

      await this.page.evaluate(() => {
        const feedCompose = document.querySelector('.feed-compose');
        const noteContainer = document.querySelector('.js-note');

        if (feedCompose) {
          feedCompose.classList.remove('feed-compose_note', 'feed-compose_task');
        }

        if (noteContainer) {
          noteContainer.className = 'js-note feed-note-fixer feed-compose_amojo internal';
        }
      });

      await this.page.waitForTimeout(500);

      logger.info('✅ Chat opened successfully');

    } catch (error) {
      logger.error('Failed to open chat:', error);
      await this.takeScreenshot('error-open-chat');
      throw error;
    }
  }

  async expandChatIfMinimized() {
    const isMinimized = await this.page.evaluate(() => {
      const feedCompose = document.querySelector('.feed-compose');
      return feedCompose?.classList.contains('minimized');
    });

    if (isMinimized) {
      logger.info('Chat is minimized, expanding...');

      await this.page.evaluate(() => {
        const expandButton = document.querySelector('.feed-compose__minimized-title');
        if (expandButton) {
          expandButton.click();
        }
      });

      await this.page.waitForTimeout(1000);
      logger.info('Chat expanded');
    }
  }

  async sendChatMessage(messageText) {
    logger.info('Sending chat message...');

    try {
      await this.openChat();
      await this.selectRecipient();
      await this.sendMessage(messageText);

      logger.info('✅ Chat message sent successfully');

    } catch (error) {
      logger.error('Failed to send chat message:', error);
      await this.takeScreenshot('send-message-error');
      throw error;
    }
  }

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

  async sendMessage(text) {
    logger.info('Typing message...');

    const messageInput = '.control-contenteditable__area.feed-compose__message';
    const sendButton = '.js-note-submit.feed-note__button';

    try {
      await this.page.evaluate((inputSelector, messageText) => {
        const input = document.querySelector(inputSelector);
        if (!input) throw new Error('Message input not found');

        input.focus();
        input.click();

        const range = document.createRange();
        range.selectNodeContents(input);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('delete');

        document.execCommand('insertText', false, messageText);

      }, messageInput, text);

      await this.page.waitForTimeout(500);

      const inputValue = await this.page.$eval(messageInput, el => el.textContent?.trim());

      if (inputValue !== text.trim()) {
        logger.error('Text not inserted correctly');
        await this.takeScreenshot('error-text-input');
        throw new Error('Text not inserted correctly');
      }

      logger.info('Text inserted, sending...');

      await this.page.click(sendButton);
      await this.page.waitForTimeout(2000);

      logger.info('✅ Message sent');

    } catch (error) {
      logger.error('Failed to send message:', error);
      await this.takeScreenshot('error-send-message');
      throw error;
    }
  }

  async addNote(noteText) {
    logger.info('Adding note...');

    try {
      await this.switchToNote();
      await this.sendMessage(noteText);

      logger.info('✅ Note added successfully');

    } catch (error) {
      logger.error('Failed to add note:', error);
      await this.takeScreenshot('error-add-note');
      throw error;
    }
  }

  async createTask(taskText) {
    logger.info('Creating task...');

    try {
      await this.switchToTask();
      await this.sendMessage(taskText);

      logger.info('✅ Task created successfully');

    } catch (error) {
      logger.error('Failed to create task:', error);
      await this.takeScreenshot('error-create-task');
      throw error;
    }
  }

  async switchToNote() {
    await this.switchTab('Примечание', '[data-id="note"]');
  }

  async switchToTask() {
    await this.switchTab('Задача', '[data-id="task"]');
  }

  async switchTab(expectedText, targetSelector) {
    logger.info(`Switching to: ${expectedText}`);

    await this.page.click('.feed-compose-switcher');
    await this.page.waitForTimeout(500);

    await this.page.waitForSelector(targetSelector, { visible: true, timeout: 3000 });
    await this.page.click(targetSelector);
    await this.page.waitForTimeout(1000);

    logger.info(`Switched to: ${expectedText}`);
  }

  async takeScreenshot(name) {
    try {
      if (this.page.isClosed()) {
        logger.warn('Cannot take screenshot - page is closed');
        return;
      }

      await this.page.screenshot({
        path: `logs/screenshots/${name}-${Date.now()}.png`,
        fullPage: false
      });
    } catch (error) {
      logger.error('Failed to take screenshot:', error);
    }
  }
}