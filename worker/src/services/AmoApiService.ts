import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';

export class AmoApiService {
  private httpClient: AxiosInstance;
  private accessToken: string;
  private refreshToken: string;
  private tokenExpiry: number;
  private baseUrl: string;
  private accountId: number;

  constructor(config: {
    accountId: number;
    baseUrl: string;
    accessToken: string;
    refreshToken: string;
    tokenExpiry: number;
  }) {
    this.accountId = config.accountId;
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.tokenExpiry = config.tokenExpiry;

    this.httpClient = axios.create({
      baseURL: `${this.baseUrl}/api/v4`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI.LEAD/2.0'
      }
    });

    // Add auth header interceptor
    this.httpClient.interceptors.request.use(
      async (config) => {
        // Check if token needs refresh
        if (this.isTokenExpired()) {
          await this.refreshAccessToken();
        }
        config.headers.Authorization = `Bearer ${this.accessToken}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle 401 responses
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          await this.refreshAccessToken();
          error.config.headers.Authorization = `Bearer ${this.accessToken}`;
          return this.httpClient.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  private isTokenExpired(): boolean {
    const now = Math.floor(Date.now() / 1000);
    const buffer = 5 * 60; // 5 minutes buffer
    return this.tokenExpiry < (now + buffer);
  }

  private async refreshAccessToken(): Promise<void> {
    logger.info(`Refreshing token for account ${this.accountId}`);

    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth2/access_token`,
        {
          client_id: process.env.AMO_CLIENT_ID,
          client_secret: process.env.AMO_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          redirect_uri: process.env.AMO_REDIRECT_URI
        }
      );

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = Math.floor(Date.now() / 1000) + response.data.expires_in;

      logger.info('Token refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh token:', error);
      throw error;
    }
  }

  async sendMessage(leadId: number, message: string): Promise<any> {
    try {
      // Try to send as chat message first
      const response = await this.httpClient.post('/chats/message', {
        entity_id: leadId,
        entity_type: 'leads',
        message: {
          text: message
        }
      });
      return response.data;
    } catch (error: any) {
      // If chat fails, send as note
      if (error.response?.status === 404 || error.response?.status === 403) {
        return this.addNote(leadId, message);
      }
      throw error;
    }
  }

  async addNote(leadId: number, text: string): Promise<any> {
    const response = await this.httpClient.post('/notes', [{
      entity_id: leadId,
      entity_type: 'leads',
      note_type: 'common',
      params: {
        text,
        service: 'AI.LEAD Bot'
      }
    }]);
    return response.data._embedded?.notes?.[0];
  }

  async createTask(leadId: number, text: string, responsibleUserId?: number): Promise<any> {
    const response = await this.httpClient.post('/tasks', [{
      task_type_id: 1,
      text,
      complete_till: Math.floor(Date.now() / 1000) + 86400, // +1 day
      entity_id: leadId,
      entity_type: 'leads',
      responsible_user_id: responsibleUserId
    }]);
    return response.data._embedded?.tasks?.[0];
  }

  async getLead(leadId: number): Promise<any> {
    const response = await this.httpClient.get(`/leads/${leadId}`, {
      params: { with: 'contacts' }
    });
    return response.data;
  }
}