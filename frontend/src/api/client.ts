import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Типы
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
  status: string;
  message_id: number;
  position_in_queue: number;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  performance: {
    avg_processing_time: number;
    jobs_per_minute: number;
    success_rate: number;
  };
}

export interface Message {
  id: number;
  account_id: number;
  lead_id: number;
  message_text: string;
  status: string;
  processing_time?: number;
  error_message?: string;
  job_id?: string;
  created_at: string;
  sent_at?: string;
}

export interface MessageHistoryResponse {
  messages: Message[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// API Methods
export const api = {
  // Health check
  healthCheck: () =>
    axios.get(`${API_URL}/health`),

  // Отправка сообщения
  sendMessage: (data: SendMessageRequest) =>
    apiClient.post<SendMessageResponse>('/messages/send', data),

  // Получение статистики очереди
  getQueueStats: () =>
    apiClient.get<QueueStats>('/queue/stats'),

  // Получение истории сообщений
  getMessageHistory: (params: {
    account_id: number;
    lead_id: number;
    limit?: number;
    page?: number;
  }) =>
    apiClient.get<MessageHistoryResponse>('/messages/history', { params }),

  // Получение информации о задаче
  getJob: (jobId: string) =>
    apiClient.get(`/queue/job/${jobId}`)
};

// Обработка ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Сервер ответил с ошибкой
      console.error('API Error:', error.response.data);
      throw new Error(error.response.data.error || 'API Error');
    } else if (error.request) {
      // Запрос был отправлен, но ответа нет
      console.error('Network Error:', error.message);
      throw new Error('Ошибка сети. Проверьте подключение к API.');
    } else {
      console.error('Error:', error.message);
      throw error;
    }
  }
);