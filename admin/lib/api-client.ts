import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================
// ТИПЫ
// ============================================

export interface SendMessageRequest {
  account_id: number;
  lead_id: number;
  message_text: string;
  note_text?: string;
  task_text?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface SendMessageResponse {
  job_id: string;
  status: 'queued' | 'scheduled';
  position_in_queue?: number;
  estimated_time?: number;
}

export interface Message {
  id: number;
  account_id: number;
  lead_id: number;
  message_text: string;
  note_text?: string;
  task_text?: string;
  status: string;
  processing_time?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface MessageHistoryResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  performance: {
    avg_processing_time: number;
    jobs_per_minute: number;
    success_rate: number;
  };
}

// 👇 НОВЫЕ ТИПЫ
export interface DailyStats {
  processed_leads: number;
  processed_leads_change: number;
  messages_sent: number;
  messages_sent_change: number;
  successful_dialogs: number;
  successful_dialogs_change: number;
}

export interface BotConfig {
  auto_process: boolean;
  prompt: string;
  updated_at?: string;
}

// 👇 ТИПЫ ДЛЯ COMPANY ADMIN
export interface IntegrationWithStats {
  id: number;
  account_id: number;
  amocrm_account_id: number;
  domain: string;
  base_url: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  error_count: number;
  account?: {
    id: number;
    email: string;
    company_name: string;
  };
}

export interface IntegrationDetails {
  integration: {
    id: number;
    account_id: number;
    amocrm_account_id: number;
    domain: string;
    base_url: string;
    status: string;
    created_at: string;
    updated_at: string;
    account?: any;
  };
  stats: {
    total_messages: number;
    completed: number;
    failed: number;
    pending: number;
  };
}

export interface IntegrationBotConfig {
  bot_enabled: boolean;
  gpt_model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  updated_at?: Date;
}

// ============================================
// API МЕТОДЫ
// ============================================

export const api = {
  // Отправка сообщения
  sendMessage: async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    const response = await apiClient.post('/api/messages/send', data);
    return response.data;
  },

  // История сообщений
  getMessageHistory: async (
    accountId: number,
    leadId: number,
    page = 1,
    limit = 20
  ): Promise<MessageHistoryResponse> => {
    const response = await apiClient.get('/api/messages/history', {
      params: { account_id: accountId, lead_id: leadId, page, limit },
    });
    return response.data;
  },

  // Статистика очередей
  getQueueStats: async (): Promise<QueueStats> => {
    const response = await apiClient.get('/api/queue/stats');
    return response.data;
  },

  // 👇 НОВЫЕ МЕТОДЫ

  // Статистика за сегодня
  getDailyStats: async (): Promise<DailyStats> => {
    const response = await apiClient.get('/api/stats/today');
    return response.data;
  },

  // Получить настройки бота
  getBotConfig: async (): Promise<BotConfig> => {
    const response = await apiClient.get('/api/bot/config');
    return response.data;
  },

  // Сохранить настройки бота
  saveBotConfig: async (config: Partial<BotConfig>): Promise<BotConfig> => {
    const response = await apiClient.put('/api/bot/config', config);
    return response.data;
  },

  // Тестировать промпт
  testBotPrompt: async (data: { prompt: string }): Promise<{ success: boolean }> => {
    const response = await apiClient.post('/api/bot/test', data);
    return response.data;
  },

  // Аналитика (заглушка)
  getAnalytics: async () => {
    const response = await apiClient.get('/api/analytics');
    return response.data;
  },

  // Сценарии (заглушка)
  getScenarios: async () => {
    const response = await apiClient.get('/api/scenarios');
    return response.data;
  },

  // ============================================
  // COMPANY ADMIN МЕТОДЫ
  // ============================================

  // Получить все интеграции
  companyAdmin: {
    getAllIntegrations: async (params?: {
      search?: string;
      status?: string;
    }): Promise<{ integrations: IntegrationWithStats[] }> => {
      const response = await apiClient.get('/api/company-admin/integrations', { params });
      return response.data;
    },

    getIntegrationDetails: async (id: number): Promise<IntegrationDetails> => {
      const response = await apiClient.get(`/api/company-admin/integrations/${id}`);
      return response.data;
    },

    getIntegrationMessages: async (
      id: number,
      page = 1,
      limit = 20,
      status?: string
    ): Promise<MessageHistoryResponse> => {
      const response = await apiClient.get(`/api/company-admin/integrations/${id}/messages`, {
        params: { page, limit, status },
      });
      return response.data;
    },

    getIntegrationErrors: async (id: number): Promise<{ errors: Message[] }> => {
      const response = await apiClient.get(`/api/company-admin/integrations/${id}/errors`);
      return response.data;
    },

    getBotConfig: async (id: number): Promise<IntegrationBotConfig> => {
      const response = await apiClient.get(`/api/company-admin/integrations/${id}/bot-config`);
      return response.data;
    },

    updateBotConfig: async (
      id: number,
      config: Partial<IntegrationBotConfig>
    ): Promise<{ success: boolean; message: string }> => {
      const response = await apiClient.put(`/api/company-admin/integrations/${id}/bot-config`, config);
      return response.data;
    },
  },
};