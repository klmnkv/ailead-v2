import { apiClient } from './client';

export interface Integration {
  id: number;
  account_id: number;
  amocrm_account_id: number;
  base_url: string;
  status: 'active' | 'expired' | 'revoked';
  last_sync_at: string | null;
  created_at: string;
}

export interface AmoCRMAuthResponse {
  authorization_url: string;
}

export const integrationsApi = {
  list: async (): Promise<Integration[]> => {
    const response = await apiClient.get('/integrations');
    return response.data;
  },

  initiateAuth: async (subdomain: string): Promise<AmoCRMAuthResponse> => {
    const response = await apiClient.post('/integrations/amocrm/auth', {
      subdomain
    });
    return response.data;
  },

  handleCallback: async (code: string, state: string): Promise<Integration> => {
    const response = await apiClient.post('/integrations/amocrm/callback', {
      code,
      state
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/integrations/${id}`);
  }
};