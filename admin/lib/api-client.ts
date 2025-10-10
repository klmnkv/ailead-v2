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
};