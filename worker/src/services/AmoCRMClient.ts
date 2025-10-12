import { Page } from 'puppeteer';
import { logger } from '../utils/logger.js';

// Селекторы для amoCRM
const SELECTORS = {
  // Авторизация
  authForm: '#authentication',

  // Окно чата
  feedCompose: '.feed-compose',

  // Переключатель чат/примечание/задача
  composeSwitcher: '.feed-compose-switcher',
  chatOption: '[data-id="chat"]',
  noteOption: '[data-id="note"]',
  taskOption: '[data-id="task"]',

  // Чат
  userSelector: '.feed-compose-user__name',
  recipientItem: '.multisuggest__suggest-item',
  messageInput: '.control-contenteditable__area.feed-compose__message',
  sendButton: '.js-note-submit.feed-note__button',

  // Задача
  taskInput: '.control-contenteditable__area',
  taskButton: '.feed-note__button'
};

interface Credentials {
  base_url: string;
  email: string;
  password: string;
}

export class AmoCRMClient {
  constructor(
    private page: Page,
    private baseUrl: string,
    private credentials: Credentials
  ) {}

  /**
   * Проверка авторизации
   */
  async ensureAuthorized(): Promise<void> {
    const isAuthPage = await this.page.$(SELECTORS.authForm);

    if (isAuthPage) {
      logger.info('Not authorized, logging in via form...');
      await this.loginWithForm();

      // Проверяем успешность входа
      await this.page.waitForTimeout(3000);
      const stillAuthPage = await this.page.$(SELECTORS.authForm);
      if (stillAuthPage) {
        await this.takeScreenshot(`login_failed_${Date.now()}.png`);
        throw new Error('Authorization failed - still on auth page');
      }

      logger.info('Authorization successful');
    }
  }

/**
 * Авторизация через форму логина
 */
private async loginWithForm(): Promise<void> {
  logger.info('Logging in via form...', {
    email: this.credentials.email?.substring(0, 3) + '***'
  });

  try {
    // Ждем форму авторизации
    const emailSelector = 'input[name="username"], input[type="email"], input[name="login"]';
    const passwordSelector = 'input[name="password"], input[type="password"]';

    await this.page.waitForSelector(emailSelector, { timeout: 10000 });

    // 🔥 КРИТИЧНО: Полностью очищаем и вводим email правильно
    logger.info('Clearing and filling email field...');

    await this.page.evaluate((selector, email) => {
      const input = document.querySelector(selector) as HTMLInputElement;
      if (input) {
        // Полная очистка всех возможных способов
        input.value = '';
        input.defaultValue = '';

        // Удаляем автозаполнение
        input.setAttribute('autocomplete', 'off');

        // Фокусируемся
        input.focus();

        // Выделяем всё и удаляем
        input.select();
        document.execCommand('delete');

        // Устанавливаем новое значение
        input.value = email;

        // Триггерим события
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      }
    }, emailSelector, this.credentials.email);

    await this.page.waitForTimeout(500);

    // Проверяем что email введен правильно
    const emailValue = await this.page.$eval(
      emailSelector,
      (el: any) => el.value
    );

    logger.info('Email field value:', emailValue);

    if (emailValue !== this.credentials.email) {
      logger.warn('Email value mismatch! Trying alternative method...');

      // Альтернативный способ - через click + keyboard
      await this.page.click(emailSelector, { clickCount: 3 }); // Тройной клик выделяет всё
      await this.page.keyboard.press('Backspace');
      await this.page.waitForTimeout(200);
      await this.page.keyboard.type(this.credentials.email, { delay: 50 });
      await this.page.waitForTimeout(500);

      // Повторная проверка
      const emailValueRetry = await this.page.$eval(
        emailSelector,
        (el: any) => el.value
      );

      logger.info('Email field value after retry:', emailValueRetry);
    }

    // Проверяем есть ли кнопка "Далее" или сразу пароль
    const submitButton = await this.page.$('button[type="submit"]');

    // Ждем пароль (он может появиться после клика "Далее")
    const passwordExists = await this.page.$(passwordSelector);

    if (submitButton && !passwordExists) {
      const buttonText = await this.page.evaluate(
        (btn) => (btn as HTMLElement).innerText,
        submitButton
      );
      logger.info('Submit button found:', buttonText);

      // Если это кнопка "Далее" - кликаем
      if (buttonText.includes('Далее') || buttonText.includes('Продолжить') || buttonText.includes('Next')) {
        logger.info('Clicking "Next" button...');
        await submitButton.click();
        await this.page.waitForTimeout(2000);
      }
    }

    // Ждем появления поля пароля
    await this.page.waitForSelector(passwordSelector, { timeout: 10000 });

    // 🔥 КРИТИЧНО: Очищаем и вводим пароль правильно
    logger.info('Clearing and filling password field...');

    await this.page.evaluate((selector, password) => {
      const input = document.querySelector(selector) as HTMLInputElement;
      if (input) {
        // Полная очистка
        input.value = '';
        input.defaultValue = '';

        // Удаляем автозаполнение
        input.setAttribute('autocomplete', 'off');

        // Фокусируемся
        input.focus();

        // Выделяем всё и удаляем
        input.select();
        document.execCommand('delete');

        // Устанавливаем новое значение
        input.value = password;

        // Триггерим события
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      }
    }, passwordSelector, this.credentials.password);

    await this.page.waitForTimeout(500);

    // Проверяем длину пароля (не логируем сам пароль!)
    const passwordLength = await this.page.$eval(
      passwordSelector,
      (el: any) => el.value.length
    );

    logger.info('Password field length:', passwordLength);

    if (passwordLength !== this.credentials.password.length) {
      logger.warn('Password length mismatch! Expected:', this.credentials.password.length, 'Got:', passwordLength);
    }

    // 🔥 ПРОВЕРЯЕМ НАЛИЧИЕ КАПЧИ
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
      await this.takeScreenshot(`captcha_detected_${Date.now()}.png`);
      await this.page.waitForTimeout(30000);
    }

    // Кликаем кнопку входа
    const loginButton = await this.page.$('button[type="submit"]');
    if (loginButton) {
      logger.info('Clicking login button...');
      await loginButton.click();
    } else {
      // Если кнопки нет, пробуем Enter
      logger.info('Login button not found, pressing Enter...');
      await this.page.keyboard.press('Enter');
    }

    // 🔥 ГИБКОЕ ОЖИДАНИЕ после логина
    logger.info('Waiting for navigation after login...');

    await Promise.race([
      // Ждем навигации
      this.page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 45000
      }),
      // Ждем исчезновения формы
      this.page.waitForFunction(
        () => !document.querySelector('#authentication'),
        { timeout: 45000 }
      ),
      // Ждем появления авторизованных элементов
      this.page.waitForFunction(
        () => {
          return !!(
            document.querySelector('.top-menu') ||
            document.querySelector('.nav-menu') ||
            document.querySelector('.feed-compose') ||
            document.querySelector('.pipeline-selector')
          );
        },
        { timeout: 45000 }
      )
    ]).catch((error) => {
      logger.warn('Wait timeout after login:', error.message);
      logger.warn('Continuing anyway - page may have loaded');
    });

    // Дополнительная задержка
    await this.page.waitForTimeout(2000);

    logger.info('Login form submitted successfully');

  } catch (error: any) {
    logger.error('Failed to login via form:', error.message);

    // Детальная диагностика при ошибке
    const diagnostics = await this.page.evaluate(() => {
      const emailInput = document.querySelector('input[name="username"], input[type="email"], input[name="login"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[name="password"], input[type="password"]') as HTMLInputElement;

      return {
        url: window.location.href,
        emailValue: emailInput?.value || 'not found',
        emailLength: emailInput?.value.length || 0,
        passwordLength: passwordInput?.value.length || 0,
        hasAuthForm: !!document.querySelector('#authentication'),
        visibleText: document.body.innerText.substring(0, 300)
      };
    }).catch(() => ({ error: 'Could not get diagnostics' }));

    logger.error('Login diagnostics:', diagnostics);
    await this.takeScreenshot(`login_error_${Date.now()}.png`);
    throw new Error(`Login failed: ${error.message}`);
  }
}

  /**
   * Открытие лида
   */
  async openLead(leadId: number): Promise<void> {
    const targetUrl = `${this.baseUrl}/leads/detail/${leadId}`;
    const currentUrl = this.page.url();

    try {
      // Если уже на нужной странице, пропускаем переход
      if (currentUrl.includes(`/leads/detail/${leadId}`)) {
        logger.info(`Already on lead ${leadId} page`);
      } else {
        logger.info(`Opening lead ${leadId}...`);
        await this.page.goto(targetUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
      }

      // Проверяем авторизацию сразу после открытия
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
   * Проверка и разворачивание свернутого окна чата
   */
  private async expandChatIfMinimized(): Promise<void> {
    logger.info('Checking if chat is minimized...');

    try {
      const chatState = await this.page.evaluate((selector) => {
        const feedCompose = document.querySelector(selector);
        if (!feedCompose) {
          return { exists: false, minimized: false, classes: '' };
        }

        const classes = feedCompose.className;
        const isMinimized = feedCompose.classList.contains('minimized');

        return {
          exists: true,
          minimized: isMinimized,
          classes: classes
        };
      }, SELECTORS.feedCompose);

      logger.info('Chat state:', chatState);

      if (!chatState.exists) {
        logger.error('Feed compose element not found!');
        await this.takeScreenshot(`error_no_feed_compose_${Date.now()}.png`);
        throw new Error('Chat compose area not found');
      }

      if (!chatState.minimized) {
        logger.info('Chat is already expanded');
        return;
      }

      logger.info('Chat is minimized, expanding...');

      // 🔥 НОВЫЙ ПОДХОД: Кликаем по заголовку чата чтобы развернуть
      const expanded = await this.page.evaluate((selector) => {
        const feedCompose = document.querySelector(selector);
        if (!feedCompose) return false;

        // Ищем кликабельный элемент для разворачивания
        // Обычно это .feed-compose__before или сам feedCompose
        const expandTrigger = feedCompose.querySelector('.feed-compose__before') ||
                             feedCompose.querySelector('.feed-compose-switcher') ||
                             feedCompose;

        if (expandTrigger) {
          // Кликаем для разворачивания
          (expandTrigger as HTMLElement).click();

          // Также удаляем класс принудительно
          feedCompose.classList.remove('minimized');

          return true;
        }

        return false;
      }, SELECTORS.feedCompose);

      if (!expanded) {
        logger.warn('Could not find expand trigger, trying direct class removal...');

        // Способ 2: Прямое удаление класса
        await this.page.evaluate((selector) => {
          const feedCompose = document.querySelector(selector);
          if (feedCompose) {
            feedCompose.classList.remove('minimized');

            // Триггерим события
            feedCompose.dispatchEvent(new Event('click', { bubbles: true }));
            feedCompose.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            feedCompose.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

            // Принудительно делаем видимым
            const style = (feedCompose as HTMLElement).style;
            style.display = 'block';
            style.visibility = 'visible';
            style.opacity = '1';
          }
        }, SELECTORS.feedCompose);
      }

      // Ждём анимации
      await this.page.waitForTimeout(1500);

      // Проверяем результат
      const finalState = await this.page.evaluate((selector) => {
        const feedCompose = document.querySelector(selector);
        const isMinimized = feedCompose?.classList.contains('minimized') || false;

        // Проверяем видимость ключевых элементов
        const messageInput = feedCompose?.querySelector('.control-contenteditable__area');
        const sendButton = feedCompose?.querySelector('.js-note-submit');

        return {
          minimized: isMinimized,
          messageInputExists: !!messageInput,
          messageInputVisible: messageInput ? (messageInput as HTMLElement).offsetHeight > 0 : false,
          sendButtonExists: !!sendButton,
          sendButtonVisible: sendButton ? (sendButton as HTMLElement).offsetHeight > 0 : false,
          classes: feedCompose?.className || ''
        };
      }, SELECTORS.feedCompose);

      logger.info('Final chat state after expansion:', finalState);

      if (finalState.minimized) {
        // Последняя попытка - кликаем в любое место внутри feed-compose
        logger.warn('Still minimized, trying to click anywhere inside...');

        await this.page.evaluate((selector) => {
          const feedCompose = document.querySelector(selector) as HTMLElement;
          if (feedCompose) {
            // Кликаем по самому элементу
            feedCompose.click();

            // И по его дочерним элементам
            const inner = feedCompose.querySelector('.feed-compose__inner') as HTMLElement;
            if (inner) inner.click();

            // Удаляем класс ещё раз
            feedCompose.classList.remove('minimized');
          }
        }, SELECTORS.feedCompose);

        await this.page.waitForTimeout(1000);

        // Финальная проверка
        const lastCheck = await this.page.evaluate((selector) => {
          const feedCompose = document.querySelector(selector);
          return feedCompose?.classList.contains('minimized') || false;
        }, SELECTORS.feedCompose);

        if (lastCheck) {
          logger.error('Failed to expand chat after all attempts');
          await this.takeScreenshot(`error_cant_expand_chat_${Date.now()}.png`);
          throw new Error('Failed to expand chat interface - still minimized');
        }
      }

      if (!finalState.messageInputVisible || !finalState.sendButtonVisible) {
        logger.error('Chat expanded but elements not visible');
        await this.takeScreenshot(`error_elements_not_visible_${Date.now()}.png`);
        throw new Error('Chat elements not visible after expansion');
      }

      logger.info('✅ Chat expanded successfully - all elements are visible');
    } catch (error: any) {
      logger.error('Error expanding chat:', error);
      await this.takeScreenshot(`error_expanding_chat_${Date.now()}.png`);
      throw error;
    }
  }


  /**
 * Открытие чата
 */
async openChat(): Promise<void> {
  logger.info('Opening chat...');

  try {
    // Ждём появления окна чата
    await this.page.waitForSelector(SELECTORS.feedCompose, {
      timeout: 10000
    });

    // 🔥 КРИТИЧНО: Разворачиваем окно если оно свернуто
    await this.expandChatIfMinimized();

    // Ждём появления переключателя
    await this.page.waitForSelector(SELECTORS.composeSwitcher, {
      visible: true,
      timeout: 5000
    });

    // Проверяем текущий выбранный таб
    const currentText = await this.page.$eval(
      SELECTORS.composeSwitcher,
      (el: any) => el.innerText?.trim() || ''
    ).catch(() => '');

    logger.info(`Current tab: "${currentText}"`);

    // Если уже на "Чат", проверяем интерфейс И классы
    if (currentText === 'Чат') {
      logger.info('Chat tab already selected, verifying interface and classes...');

      const hasInterface = await this.page.$(SELECTORS.messageInput).then(el => !!el);

      if (hasInterface) {
        // 🔥 КРИТИЧНО: Даже если чат уже выбран, проверяем классы!
        const classCheck = await this.page.evaluate(() => {
          const noteContainer = document.querySelector('.js-note');
          return {
            classes: noteContainer?.className,
            isChat: noteContainer?.classList.contains('feed-compose_amojo'),
            isNote: noteContainer?.classList.contains('feed-compose_note')
          };
        });

        logger.info('Current container classes:', classCheck);

        // Если классы правильные - всё ОК, выходим
        if (classCheck.isChat && !classCheck.isNote) {
          logger.info('Chat interface already loaded with correct classes');
          return;
        }

        // Если классы неправильные - продолжаем к переключению/фиксу
        logger.warn('Chat selected but wrong classes detected, will fix classes...');
      } else {
        logger.warn('Chat tab selected but interface not loaded - reloading...');
      }
    }

    // 🔥 ПЕРЕКЛЮЧЕНИЕ НА ЧАТ через hidden input + прямые манипуляции
    logger.info('Switching to chat using hidden input + direct manipulation...');

    const switchResult = await this.page.evaluate(() => {
      // 1. Находим и устанавливаем hidden input
      const hiddenInput = document.querySelector('input[name="feed-compose-switcher"]') as HTMLInputElement;
      if (hiddenInput) {
        hiddenInput.value = 'chat';
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 2. Находим элемент переключателя с классом js-switcher-chat
      const chatSwitcher = document.querySelector('.js-switcher-chat') as HTMLElement;

      if (!chatSwitcher) {
        return {
          success: false,
          error: 'Chat switcher not found',
          hiddenInputSet: !!hiddenInput
        };
      }

      // 3. Убираем selected у всех элементов
      document.querySelectorAll('.tips-item_selected').forEach(el => {
        el.classList.remove('tips-item_selected');
        el.classList.remove('tips-item_selected-keyboard');
      });

      // 4. Добавляем selected к элементу чата
      chatSwitcher.classList.add('tips-item_selected');

      // 5. Обновляем текст в переключателе
      const switcherText = document.querySelector('.feed-compose-switcher__text');
      if (switcherText) {
        switcherText.textContent = 'Чат';
      }

      // 6. Кликаем по элементу для триггера событий
      chatSwitcher.click();

      // 7. Триггерим событие изменения на переключателе
      const switcher = document.querySelector('.feed-compose-switcher');
      if (switcher) {
        switcher.dispatchEvent(new Event('change', { bubbles: true }));
        switcher.dispatchEvent(new Event('click', { bubbles: true }));
      }

      return {
        success: true,
        error: null,
        hiddenInputSet: !!hiddenInput,
        switcherTextUpdated: !!switcherText
      };
    });

    logger.info('Switch result:', switchResult);

    if (!switchResult.success) {
      logger.error('Failed to switch via direct manipulation:', switchResult.error);

      // Последний шанс - попробуем через JS вызов функций amoCRM
      logger.info('Trying last resort: amoCRM internal functions...');

      await this.page.evaluate(() => {
        // Ищем jQuery объект переключателя (если amoCRM использует jQuery)
        const $ = (window as any).$;
        if ($) {
          const switcher = $('.feed-compose-switcher');
          if (switcher.length) {
            switcher.trigger('change');
            switcher.data('value', 'chat');
          }

          const chatOption = $('.js-switcher-chat');
          if (chatOption.length) {
            chatOption.trigger('click');
          }
        }
      });

      await this.page.waitForTimeout(1000);
    }

    // Ждём переключения
    await this.page.waitForTimeout(2000);

    // Проверяем результат переключения
    const newTabText = await this.page.$eval(
      SELECTORS.composeSwitcher,
      (el: any) => el.innerText?.trim() || ''
    ).catch(() => '');

    logger.info(`Tab after switch attempts: "${newTabText}"`);

    if (newTabText !== 'Чат') {
      // Диагностическая информация
      const diagnostics = await this.page.evaluate(() => {
        const hiddenInput = document.querySelector('input[name="feed-compose-switcher"]') as HTMLInputElement;
        const switcherText = document.querySelector('.feed-compose-switcher__text');
        const chatSwitcher = document.querySelector('.js-switcher-chat');

        return {
          hiddenInputValue: hiddenInput?.value,
          switcherTextContent: switcherText?.textContent,
          chatSwitcherExists: !!chatSwitcher,
          chatSwitcherClasses: chatSwitcher?.className,
          feedComposeClasses: document.querySelector('.feed-compose')?.className
        };
      });

      logger.error('Diagnostic after switch attempt:', diagnostics);
      await this.takeScreenshot(`error_switch_failed_${Date.now()}.png`);
      throw new Error(`Failed to switch to Chat tab after all attempts. Current: "${newTabText}"`);
    }

    // Ждём загрузки интерфейса чата
    logger.info('Waiting for chat interface to load...');
    await this.page.waitForTimeout(2000);

    // Проверяем что интерфейс загрузился
    const interfaceLoaded = await this.page.waitForSelector(SELECTORS.messageInput, {
      visible: true,
      timeout: 15000
    }).then(() => true).catch(() => false);

    if (!interfaceLoaded) {
      logger.error('Chat interface did not load after switching');
      await this.takeScreenshot(`error_chat_interface_not_loaded_${Date.now()}.png`);
      throw new Error('Chat interface did not load - message input not found');
    }

    // 🔥 КРИТИЧНО: Принудительно устанавливаем правильные классы для режима ЧАТА
    logger.info('Setting correct chat mode classes...');

    await this.page.evaluate(() => {
      const feedCompose = document.querySelector('.feed-compose');
      const noteContainer = document.querySelector('.js-note');
      const hiddenInput = document.querySelector('input[name="feed-compose-switcher"]') as HTMLInputElement;

      // Убираем все режимы у feed-compose
      if (feedCompose) {
        feedCompose.classList.remove('feed-compose_note', 'feed-compose_task', 'feed-compose_email');
      }

      // Устанавливаем правильные классы для контейнера чата
      if (noteContainer) {
        noteContainer.className = 'js-note feed-note-fixer feed-compose_amojo internal';
      }

      // Убеждаемся что hidden input тоже правильный
      if (hiddenInput) {
        hiddenInput.value = 'chat';
      }
    });

    await this.page.waitForTimeout(500);

    // 🔍 ФИНАЛЬНАЯ ПРОВЕРКА: Проверяем что всё установлено правильно
    const finalCheck = await this.page.evaluate(() => {
      const feedCompose = document.querySelector('.feed-compose');
      const noteContainer = document.querySelector('.js-note');
      const messageInput = feedCompose?.querySelector('.control-contenteditable__area');
      const hiddenInput = document.querySelector('input[name="feed-compose-switcher"]') as HTMLInputElement;

      return {
        feedComposeClasses: feedCompose?.className,
        noteContainerClasses: noteContainer?.className,
        hasAmojo: noteContainer?.classList.contains('feed-compose_amojo'),
        hasNote: noteContainer?.classList.contains('feed-compose_note'),
        hasTask: noteContainer?.classList.contains('feed-compose_task'),
        messageInputExists: !!messageInput,
        messageInputClasses: messageInput?.className,
        hiddenInputValue: hiddenInput?.value,
        allCorrect: noteContainer?.classList.contains('feed-compose_amojo') &&
                   !noteContainer?.classList.contains('feed-compose_note') &&
                   !noteContainer?.classList.contains('feed-compose_task') &&
                   hiddenInput?.value === 'chat'
      };
    });

    logger.info('🔍 Final interface check after class setup:', finalCheck);

    // Проверяем критичные условия
    if (!finalCheck.allCorrect) {
      logger.error('Failed to set correct chat mode!');
      logger.error('Issues:', {
        hasAmojo: finalCheck.hasAmojo,
        hasNote: finalCheck.hasNote,
        hasTask: finalCheck.hasTask,
        hiddenInput: finalCheck.hiddenInputValue
      });
      await this.takeScreenshot(`error_wrong_classes_${Date.now()}.png`);
      throw new Error('Failed to set correct chat mode classes');
    }

    if (!finalCheck.messageInputExists) {
      logger.error('Message input not found after setup');
      await this.takeScreenshot(`error_no_message_input_${Date.now()}.png`);
      throw new Error('Message input not found');
    }

    logger.info('✅ Chat tab opened, interface loaded, and classes set correctly');

  } catch (error) {
    logger.error('Failed to open chat:', error);
    await this.takeScreenshot(`error_open_chat_${Date.now()}.png`);
    throw error;
  }
}

  /**
   * Отправка сообщения в чат
   */
  async sendChatMessage(messageText: string): Promise<void> {
    logger.info('Sending chat message...');

    try {
      // 1. Открываем чат (теперь он сам дожидается загрузки интерфейса)
      await this.openChat();

      // 2. Даем время интерфейсу стабилизироваться после загрузки
      await this.page.waitForTimeout(3000);

      // 3. Проверяем нужно ли выбирать получателя
      const recipientStatus = await this.checkIfRecipientNeeded();

      logger.info('Recipient status:', recipientStatus);

      if (recipientStatus.needsSelection) {
        logger.info('Attempting to select recipient...');

        // Пробуем выбрать получателя
        // Для Telegram-интеграций получатель выбирается автоматически
        // поэтому если селектор не найден - это нормально
        try {
          await this.selectRecipient();
        } catch (error: any) {
          logger.info('Recipient selection skipped (likely auto-selected for Telegram):', error.message);
        }
      } else {
        logger.info(`Recipient already selected: "${recipientStatus.currentRecipient}"`);
      }

      // 4. Отправляем сообщение (даже если выбор получателя не удался)
      await this.sendMessage(messageText);

      logger.info('Chat message sent successfully');
    } catch (error: any) {
      logger.error('Failed to send chat message:', error);
      await this.takeScreenshot(`error_chat_${Date.now()}.png`);
      throw new Error(`Failed to send chat message: ${error.message}`);
    }
  }

  /**
   * Проверка нужно ли выбирать получателя
   */
  private async checkIfRecipientNeeded(): Promise<{
    needsSelection: boolean;
    currentRecipient: string;
  }> {
    logger.info('Checking if recipient selection needed...');

    try {
      const recipientInfo = await this.page.evaluate((selector) => {
        const userElement = document.querySelector(selector);

        if (!userElement) {
          return {
            exists: false,
            hasRecipient: false,
            text: '',
            dataId: null,
            isVisible: false
          };
        }

        const text = userElement.textContent?.trim() || '';
        const dataId = userElement.getAttribute('data-id');

        // Проверяем видимость элемента
        const rect = userElement.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;

        // Получатель считается выбранным если:
        // 1. Есть data-id
        // 2. data-id не пустой и не содержит "undefined"
        // 3. Есть текст с именем
        const hasValidRecipient = !!(
          dataId &&
          dataId.length > 0 &&
          !dataId.includes('undefined') &&
          text.length > 0
        );

        return {
          exists: true,
          hasRecipient: hasValidRecipient,
          text: text,
          dataId: dataId,
          isVisible: isVisible
        };
      }, SELECTORS.userSelector);

      logger.info('Recipient check details:', recipientInfo);

      // Если элемент не найден - однозначно нужно выбирать
      if (!recipientInfo.exists) {
        return {
          needsSelection: true,
          currentRecipient: 'not found'
        };
      }

      // Если получатель уже выбран - выбирать не нужно
      if (recipientInfo.hasRecipient) {
        return {
          needsSelection: false,
          currentRecipient: recipientInfo.text
        };
      }

      // Если элемент есть но получатель не выбран - нужно выбирать
      return {
        needsSelection: true,
        currentRecipient: 'empty'
      };

    } catch (error) {
      logger.error('Error checking recipient:', error);
      // В случае ошибки считаем что нужно выбирать
      return {
        needsSelection: true,
        currentRecipient: 'error'
      };
    }
  }

  /**
   * Выбор получателя
   */
  private async selectRecipient(): Promise<void> {
    logger.info('Selecting recipient...');

    const recipientSelector = '.multisuggest__suggest-item';

    try {
      // 1. Проверяем что элемент выбора пользователя существует И ВИДЕН
      const userSelectorInfo = await this.page.evaluate((selector) => {
        const el = document.querySelector(selector);
        if (!el) {
          return { exists: false, visible: false };
        }

        // Проверяем реальную видимость элемента
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const isVisible = rect.width > 0 &&
                         rect.height > 0 &&
                         style.display !== 'none' &&
                         style.visibility !== 'hidden' &&
                         (el as HTMLElement).offsetHeight > 0;

        return {
          exists: true,
          visible: isVisible,
          offsetHeight: (el as HTMLElement).offsetHeight,
          rect: { width: rect.width, height: rect.height },
          display: style.display,
          visibility: style.visibility
        };
      }, SELECTORS.userSelector);

      logger.info('User selector visibility check:', userSelectorInfo);

      if (!userSelectorInfo.exists || !userSelectorInfo.visible) {
        logger.info('User selector not found or not visible - recipient likely pre-selected');
        logger.info('This is normal for Telegram integrations where recipient is automatic');

        // Для Telegram-чатов получатель выбирается автоматически
        // Просто возвращаемся и продолжаем отправку
        return;
      }

      // 2. Получаем информацию о текущем состоянии
      const selectorInfo = await this.page.evaluate((selector) => {
        const el = document.querySelector(selector);
        if (!el) return { exists: false };

        const rect = el.getBoundingClientRect();
        const dataId = el.getAttribute('data-id');
        const text = el.textContent?.trim() || '';

        return {
          exists: true,
          visible: rect.width > 0 && rect.height > 0,
          dataId: dataId,
          text: text,
          hasRecipient: !!(dataId && dataId.length > 0 && !dataId.includes('undefined') && text)
        };
      }, SELECTORS.userSelector);

      logger.info('User selector state:', selectorInfo);

      // 3. Если получатель уже выбран, не кликаем
      if (selectorInfo.hasRecipient) {
        logger.info(`Recipient already selected: "${selectorInfo.text}", skipping click`);
        return;
      }

      // 4. Кликаем для открытия списка получателей
      logger.info('Clicking user selector to open recipient list...');
      await this.page.evaluate((selector) => {
        const el = document.querySelector(selector) as HTMLElement;
        if (el) el.click();
      }, SELECTORS.userSelector);

      await this.page.waitForTimeout(2000);

      // 5. Ждём появления списка получателей
      logger.info('Waiting for recipient list...');
      const recipientElement = await this.page.waitForSelector(recipientSelector, {
        timeout: 10000,
        visible: true
      }).catch(() => null);

      if (recipientElement) {
        logger.info('Recipient list appeared, selecting first recipient...');

        // Кликаем через evaluate
        await this.page.evaluate((selector) => {
          const el = document.querySelector(selector) as HTMLElement;
          if (el) el.click();
        }, recipientSelector);

        await this.page.waitForTimeout(1000);
        logger.info('Recipient selected successfully');
      } else {
        logger.info('Recipient list did not appear - recipient already selected by default');
      }
    } catch (error: any) {
      logger.error('Error in selectRecipient:', error.message);
      await this.takeScreenshot(`error_select_recipient_${Date.now()}.png`);
      // Не бросаем ошибку дальше - пробуем продолжить
      throw error;
    }
  }




/**
 * Ввод и отправка сообщения
 */
private async sendMessage(messageText: string): Promise<void> {
  logger.info('Typing and sending message...');

  try {
    // 🔥 ШАГ 1: КРИТИЧНО - Принудительно устанавливаем ВСЕ правильные классы
    await this.page.evaluate(() => {
      const feedCompose = document.querySelector('.feed-compose');
      const noteContainer = document.querySelector('.js-note');
      const hiddenInput = document.querySelector('input[name="feed-compose-switcher"]');

      if (feedCompose) {
        feedCompose.classList.remove('feed-compose_note', 'feed-compose_task', 'feed-compose_email');
      }

      if (noteContainer) {
        noteContainer.className = 'js-note feed-note-fixer feed-compose_amojo internal';
      }

      if (hiddenInput) {
        (hiddenInput as HTMLInputElement).value = 'chat';
      }
    });

    await this.page.waitForTimeout(500);

    // 🔥 ШАГ 2: Диагностика - проверяем что классы установлены
    const modeCheck = await this.page.evaluate(() => {
      const noteContainer = document.querySelector('.js-note');
      const hiddenInput = document.querySelector('input[name="feed-compose-switcher"]');

      return {
        containerClasses: noteContainer?.className,
        hiddenInputValue: hiddenInput ? (hiddenInput as HTMLInputElement).value : null,
        hasAmojo: noteContainer?.classList.contains('feed-compose_amojo'),
        hasNote: noteContainer?.classList.contains('feed-compose_note'),
      };
    });

    logger.info('🔍 Mode after class setup:', modeCheck);

    if (!modeCheck.hasAmojo || modeCheck.hasNote) {
      logger.error('Failed to set correct chat mode classes!');
      await this.takeScreenshot(`error_wrong_classes_${Date.now()}.png`);
      throw new Error('Failed to set chat mode - wrong container classes');
    }

    // 🔥 ШАГ 3: СТАРЫЙ СПОСОБ - evaluate в чистом JS без современного синтаксиса
    const sendResult = await this.page.evaluate(function(message) {
      // Используем старый синтаксис function вместо стрелочной функции
      var inputSelector = '.control-contenteditable__area.feed-compose__message';
      var buttonSelector = '.js-note-submit.feed-note__button';

      // Находим поле ввода
      var inputField = document.querySelector(inputSelector);
      if (!inputField) {
        return { success: false, error: 'Input field not found' };
      }

      // Активируем поле
      inputField.click();
      inputField.focus();

      // Очищаем поле через selection
      var range = document.createRange();
      range.selectNodeContents(inputField);
      var selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      document.execCommand('delete');

      // Небольшая задержка (busy wait)
      var start = Date.now();
      while (Date.now() - start < 100) {
        // ничего не делаем
      }

      // Вставляем текст через execCommand
      document.execCommand('insertText', false, message);

      // Триггерим события
      inputField.dispatchEvent(new Event('input', { bubbles: true }));
      inputField.dispatchEvent(new Event('change', { bubbles: true }));
      inputField.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

      // Проверяем что текст вставился
      var insertedText = inputField.textContent ? inputField.textContent.trim() : '';

      // Функция нормализации (старый синтаксис)
      function normalize(text) {
        if (!text) return '';
        return text.replace(/\r?\n/g, '').replace(/\s+/g, ' ').trim();
      }

      if (normalize(insertedText) !== normalize(message)) {
        return {
          success: false,
          error: 'Text not inserted correctly',
          expected: message,
          actual: insertedText
        };
      }

      // Находим кнопку отправки
      var sendButton = document.querySelector(buttonSelector);
      if (!sendButton) {
        return { success: false, error: 'Send button not found' };
      }

      // Убираем disabled если есть
      sendButton.classList.remove('button-input-disabled');
      sendButton.disabled = false;

      // Прокручиваем кнопку в видимую область
      sendButton.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Кликаем
      sendButton.click();

      return {
        success: true,
        insertedText: insertedText
      };
    }, messageText);

    logger.info('Send result:', sendResult);

    if (!sendResult.success) {
      logger.error('Failed to send:', sendResult.error);
      if (sendResult.expected && sendResult.actual) {
        logger.error('Expected text:', sendResult.expected);
        logger.error('Actual text:', sendResult.actual);
      }
      await this.takeScreenshot(`error_send_failed_${Date.now()}.png`);
      throw new Error(`Failed to send message: ${sendResult.error}`);
    }

    logger.info('Message inserted successfully, waiting for send...');

    // Ждем отправки
    await this.page.waitForTimeout(2000);

    // Проверяем что поле очистилось (признак успешной отправки)
    const cleared = await this.page.$eval(
      SELECTORS.messageInput,
      (el: any) => !el.textContent?.trim()
    ).catch(() => false);

    if (cleared) {
      logger.info('✅ Message sent successfully');
    } else {
      logger.warn('⚠️ Message may not have been sent - input not cleared');
      await this.takeScreenshot(`warning_not_cleared_${Date.now()}.png`);

      // Дополнительная диагностика
      const inputContent = await this.page.$eval(
        SELECTORS.messageInput,
        (el: any) => el.textContent || ''
      ).catch(() => '');

      logger.warn('Input content after send:', inputContent);
    }

  } catch (error: any) {
    logger.error('Failed to send message:', error);
    await this.takeScreenshot(`error_send_message_${Date.now()}.png`);
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

  /**
   * Добавление примечания
   */
  async addNote(noteText: string): Promise<void> {
    logger.info('Adding note...');

    try {
      // Разворачиваем окно если свернуто
      await this.expandChatIfMinimized();

      // Переключаемся на примечания
      await this.page.hover(SELECTORS.composeSwitcher);
      await this.page.waitForTimeout(1000);

      await this.page.evaluate((selector) => {
        const el = document.querySelector(selector) as HTMLElement;
        if (el) el.click();
      }, SELECTORS.noteOption);

      await this.page.waitForTimeout(500);

      // Вводим текст
      await this.page.type(SELECTORS.messageInput, noteText);
      await this.page.click(SELECTORS.sendButton);
      await this.page.waitForTimeout(1000);

      logger.info('Note added successfully');
    } catch (error) {
      logger.error('Failed to add note:', error);
      await this.takeScreenshot(`error_note_${Date.now()}.png`);
      throw error;
    }
  }

  /**
   * Создание задачи
   */
  async createTask(taskText: string): Promise<void> {
    logger.info('Creating task...');

    try {
      // Разворачиваем окно если свернуто
      await this.expandChatIfMinimized();

      // Переключаемся на задачи
      await this.page.hover(SELECTORS.composeSwitcher);
      await this.page.waitForTimeout(1000);

      await this.page.evaluate((selector) => {
        const el = document.querySelector(selector) as HTMLElement;
        if (el) el.click();
      }, SELECTORS.taskOption);

      await this.page.waitForTimeout(500);

      // Вводим текст задачи
      await this.page.type(SELECTORS.taskInput, taskText);
      await this.page.click(SELECTORS.taskButton);
      await this.page.waitForTimeout(1000);

      logger.info('Task created successfully');
    } catch (error) {
      logger.error('Failed to create task:', error);
      await this.takeScreenshot(`error_task_${Date.now()}.png`);
      throw error;
    }
  }

  /**
   * Создание скриншота
   */
  async takeScreenshot(filename: string): Promise<string> {
    try {
      const screenshotPath = `logs/screenshots/${filename}`;
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      logger.info(`Screenshot saved: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      logger.error('Failed to take screenshot:', error);
      return '';
    }
  }
}