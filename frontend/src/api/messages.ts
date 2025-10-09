import { apiClient } from './client';

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
  message_id: number;
  position_in_queue: number;
}

export interface MessageHistory {
  messages: Array<{
    id: number;
    lead_id: number;
    message_text: string;
    status: string;
    created_at: string;
    sent_at: string | null;
    processing_time: number | null;
  }>;
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const messagesApi = {
  send: async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    const response = await apiClient.post('/messages/send', data);
    return response.data;
  },

  getHistory: async (
    account_id: number,
    lead_id: number,
    page = 1,
    limit = 50
  ): Promise<MessageHistory> => {
    const response = await apiClient.get('/messages/history', {
      params: { account_id, lead_id, page, limit }
    });
    return response.data;
  }
};