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

export interface Bot {
  id: number;
  account_id: number;
  name: string;
  description?: string;
  prompt: string;
  ai_provider?: string;
  api_key?: string;
  model: string;
  temperature: number;
  max_tokens: number;
  pipeline_id?: number;
  stage_id?: number;
  deactivation_conditions?: string;
  deactivation_message?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Stage {
  id: number;
  name: string;
  color?: string;
}

export interface Pipeline {
  id: number;
  name: string;
  stages: Stage[];
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
  // БОТЫ - Bot Management
  // ============================================

  // Получить список ботов
  getBots: async (accountId: number): Promise<Bot[]> => {
    const response = await apiClient.get('/api/bots', {
      params: { account_id: accountId },
    });
    return response.data;
  },

  // Создать бота
  createBot: async (data: Partial<Bot>): Promise<Bot> => {
    const response = await apiClient.post('/api/bots', data);
    return response.data;
  },

  // Обновить бота
  updateBot: async (id: number, data: Partial<Bot>): Promise<Bot> => {
    const response = await apiClient.put(`/api/bots/${id}`, data);
    return response.data;
  },

  // Удалить бота
  deleteBot: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/bots/${id}`);
  },

  // Переключить статус бота (активен/неактивен)
  toggleBot: async (id: number): Promise<Bot> => {
    const response = await apiClient.patch(`/api/bots/${id}/toggle`);
    return response.data;
  },

  // Дублировать бота
  duplicateBot: async (id: number): Promise<Bot> => {
    const response = await apiClient.post(`/api/bots/${id}/duplicate`);
    return response.data;
  },

  // ============================================
  // ВОРОНКИ - Pipelines
  // ============================================

  // Получить воронки из amoCRM
  getPipelines: async (accountId: number): Promise<Pipeline[]> => {
    const response = await apiClient.get('/api/integrations/pipelines', {
      params: { account_id: accountId },
    });
    return response.data;
  },
};