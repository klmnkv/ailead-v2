// api/src/services/amo-api/client.ts

import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../../utils/logger.js';
import { TokenManager } from './auth.js';
import { AmoApiError, AmoApiResponse } from './types.js';

export class AmoApiClient {
  private httpClient: AxiosInstance;
  private tokenManager: TokenManager;
  private accountId: number;
  private baseUrl: string;
  private requestsCount = 0;
  private lastRequestTime = Date.now();

  constructor(
    accountId: number,
    baseUrl: string,
    accessToken: string,
    refreshToken: string,
    tokenExpiry: number
  ) {
    this.accountId = accountId;
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash

    // Initialize token manager
    this.tokenManager = new TokenManager(
      accountId,
      accessToken,
      refreshToken,
      tokenExpiry
    );

    // Create axios instance
    this.httpClient = axios.create({
      baseURL: `${this.baseUrl}/api/v4`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI.LEAD/2.0'
      }
    });

    // Add retry logic
    axiosRetry(this.httpClient, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               error.response?.status === 429 || // Rate limit
               error.response?.status === 502 || // Bad gateway
               error.response?.status === 503;   // Service unavailable
      }
    });

    // Request interceptor for auth
    this.httpClient.interceptors.request.use(
      async (config) => {
        // Rate limiting (7 requests per second for AmoCRM)
        await this.rateLimit();

        // Get fresh token
        const token = await this.tokenManager.getValidToken();
        config.headers.Authorization = `Bearer ${token}`;

        logger.debug('AMO API Request:', {
          method: config.method,
          url: config.url,
          account: this.accountId
        });

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        logger.debug('AMO API Response:', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      async (error: AxiosError) => {
        if (error.response) {
          const { status, data } = error.response;

          // Handle token expiration
          if (status === 401) {
            logger.info('Token expired, refreshing...');
            await this.tokenManager.forceRefresh();

            // Retry original request
            const config = error.config!;
            const token = await this.tokenManager.getValidToken();
            config.headers.Authorization = `Bearer ${token}`;
            return this.httpClient.request(config);
          }

          // Log API errors
          logger.error('AMO API Error:', {
            status,
            data,
            url: error.config?.url,
            account: this.accountId
          });

          throw new AmoApiError(
            `AMO API Error: ${status}`,
            status,
            data as any
          );
        }

        throw error;
      }
    );
  }

  /**
   * Rate limiting - AmoCRM allows 7 requests per second
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Reset counter every second
    if (timeSinceLastRequest >= 1000) {
      this.requestsCount = 0;
      this.lastRequestTime = now;
    }

    // If we've made 7 requests in this second, wait
    if (this.requestsCount >= 7) {
      const waitTime = 1000 - timeSinceLastRequest;
      if (waitTime > 0) {
        logger.debug(`Rate limit: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestsCount = 0;
        this.lastRequestTime = Date.now();
      }
    }

    this.requestsCount++;
  }

  /**
   * Get lead details
   */
  async getLead(leadId: number): Promise<any> {
    const response = await this.httpClient.get(`/leads/${leadId}`, {
      params: { with: 'contacts' }
    });
    return response.data;
  }

  /**
   * Add note to lead
   */
  async addNote(leadId: number, text: string): Promise<any> {
    const response = await this.httpClient.post('/notes', {
      note_type: 'common',
      params: {
        text,
        entity_id: leadId,
        note_type: 4 // Service message type
      }
    });
    return response.data;
  }

  /**
   * Create task
   */
  async createTask(
    leadId: number,
    text: string,
    responsibleUserId?: number,
    completeTill?: number
  ): Promise<any> {
    const taskData = {
      text,
      entity_id: leadId,
      entity_type: 'leads',
      task_type_id: 1,
      complete_till: completeTill || Math.floor(Date.now() / 1000) + 86400, // +1 day
      responsible_user_id: responsibleUserId
    };

    const response = await this.httpClient.post('/tasks', [taskData]);
    return response.data;
  }

  /**
   * Send chat message (if chat is enabled)
   */
  async sendChatMessage(
    leadId: number,
    message: string,
    chatId?: string
  ): Promise<any> {
    try {
      // First, try to get chat ID from lead
      if (!chatId) {
        const lead = await this.getLead(leadId);
        // Extract chat_id from lead custom fields or embedded data
        chatId = this.extractChatId(lead);
      }

      if (!chatId) {
        logger.warn('No chat ID found for lead, falling back to note');
        return await this.addNote(leadId, message);
      }

      // Send message to chat
      const response = await this.httpClient.post('/chats/message', {
        chat_id: chatId,
        message: {
          text: message
        }
      });

      return response.data;
    } catch (error: any) {
      // If chat API is not available, fall back to notes
      if (error.status === 404 || error.status === 403) {
        logger.info('Chat API not available, using notes instead');
        return await this.addNote(leadId, message);
      }
      throw error;
    }
  }

  /**
   * Extract chat ID from lead data
   */
  private extractChatId(lead: any): string | null {
    // Check in custom fields
    if (lead._embedded?.custom_fields) {
      for (const field of lead._embedded.custom_fields) {
        if (field.code === 'CHAT_ID' || field.name === 'Chat ID') {
          return field.values?.[0]?.value || null;
        }
      }
    }

    // Check in embedded chats
    if (lead._embedded?.chats?.length > 0) {
      return lead._embedded.chats[0].id;
    }

    return null;
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(leadId: number, statusId: number): Promise<any> {
    const response = await this.httpClient.patch(`/leads/${leadId}`, {
      status_id: statusId
    });
    return response.data;
  }

  /**
   * Get contacts for lead
   */
  async getLeadContacts(leadId: number): Promise<any> {
    const lead = await this.getLead(leadId);
    if (lead._embedded?.contacts) {
      return lead._embedded.contacts;
    }
    return [];
  }

  /**
   * Bulk operations for better performance
   */
  async bulkAddNotes(notes: Array<{ leadId: number; text: string }>): Promise<any> {
    const notesData = notes.map(note => ({
      note_type: 'common',
      params: {
        text: note.text,
        entity_id: note.leadId,
        note_type: 4
      }
    }));

    const response = await this.httpClient.post('/notes', notesData);
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.httpClient.get('/account');
      return true;
    } catch (error) {
      logger.error('AMO API health check failed:', error);
      return false;
    }
  }

  /**
   * Get account info
   */
  async getAccountInfo(): Promise<any> {
    const response = await this.httpClient.get('/account', {
      params: { with: 'users,pipelines,groups' }
    });
    return response.data;
  }
}