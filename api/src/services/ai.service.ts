import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

export interface AIConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  api_key: string;
  temperature: number;
  max_tokens: number;
  enabled: boolean;
}

export interface GenerateResponseOptions {
  systemPrompt: string;
  userMessage: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

class AIService {
  private openaiClient: OpenAI | null = null;

  /**
   * Инициализирует клиент OpenAI с заданным API ключом
   */
  initializeOpenAI(apiKey: string): void {
    if (!apiKey || apiKey === '') {
      logger.warn('OpenAI API key not provided');
      this.openaiClient = null;
      return;
    }

    try {
      this.openaiClient = new OpenAI({
        apiKey: apiKey,
      });
      logger.info('OpenAI client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OpenAI client:', error);
      this.openaiClient = null;
    }
  }

  /**
   * Проверяет, доступен ли AI сервис
   */
  isAvailable(config: AIConfig): boolean {
    if (!config.enabled) {
      return false;
    }

    if (config.provider === 'openai') {
      return this.openaiClient !== null;
    }

    // TODO: Добавить поддержку Anthropic Claude
    return false;
  }

  /**
   * Генерирует ответ от AI на основе промпта и истории сообщений
   */
  async generateResponse(
    config: AIConfig,
    options: GenerateResponseOptions
  ): Promise<string> {
    if (!this.isAvailable(config)) {
      throw new Error('AI service is not available or not enabled');
    }

    const { systemPrompt, userMessage, conversationHistory = [] } = options;

    try {
      if (config.provider === 'openai') {
        return await this.generateOpenAIResponse(
          config,
          systemPrompt,
          userMessage,
          conversationHistory
        );
      }

      // TODO: Добавить поддержку других провайдеров
      throw new Error(`Unsupported AI provider: ${config.provider}`);
    } catch (error) {
      logger.error('Error generating AI response:', error);
      throw error;
    }
  }

  /**
   * Генерирует ответ используя OpenAI API
   */
  private async generateOpenAIResponse(
    config: AIConfig,
    systemPrompt: string,
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client is not initialized');
    }

    // Формируем массив сообщений для API
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Добавляем историю переписки (если есть)
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Добавляем текущее сообщение пользователя
    messages.push({
      role: 'user',
      content: userMessage,
    });

    const startTime = Date.now();

    // Вызываем OpenAI API
    const completion = await this.openaiClient.chat.completions.create({
      model: config.model,
      messages: messages,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
    });

    const duration = Date.now() - startTime;

    // Логируем результат
    logger.info('OpenAI response generated', {
      model: config.model,
      tokens_used: completion.usage?.total_tokens || 0,
      duration_ms: duration,
    });

    const response = completion.choices[0]?.message?.content || '';

    if (!response) {
      throw new Error('OpenAI returned empty response');
    }

    return response;
  }

  /**
   * Тестирует соединение с AI провайдером
   */
  async testConnection(config: AIConfig): Promise<{
    success: boolean;
    message: string;
    duration?: number;
  }> {
    if (!config.enabled) {
      return {
        success: false,
        message: 'AI integration is disabled',
      };
    }

    try {
      // Инициализируем клиент с указанным ключом
      this.initializeOpenAI(config.api_key);

      if (!this.isAvailable(config)) {
        return {
          success: false,
          message: 'AI service is not available',
        };
      }

      const startTime = Date.now();

      // Пробуем сгенерировать простой тестовый ответ
      const testResponse = await this.generateResponse(config, {
        systemPrompt: 'You are a helpful assistant.',
        userMessage: 'Say "Connection test successful" if you can read this.',
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        message: `Connection successful. Response: "${testResponse}"`,
        duration,
      };
    } catch (error: any) {
      logger.error('AI connection test failed:', error);

      return {
        success: false,
        message: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Получает список доступных моделей OpenAI
   */
  getAvailableModels(provider: string): string[] {
    if (provider === 'openai') {
      return [
        'gpt-4',
        'gpt-4-turbo-preview',
        'gpt-4-1106-preview',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k',
      ];
    }

    if (provider === 'anthropic') {
      return [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
      ];
    }

    return [];
  }
}

export const aiService = new AIService();
