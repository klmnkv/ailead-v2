import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const api = {
  // Admin API - Integrations
  getIntegrations: async () => {
    const response = await apiClient.get('/api/admin/integrations');
    return response.data;
  },

  getIntegrationDetails: async (id: number) => {
    const response = await apiClient.get(`/api/admin/integrations/${id}`);
    return response.data;
  },

  getIntegrationErrors: async (id: number, page = 1, limit = 20) => {
    const response = await apiClient.get(`/api/admin/integrations/${id}/errors`, {
      params: { page, limit }
    });
    return response.data;
  },

  getIntegrationResponseTimes: async (id: number) => {
    const response = await apiClient.get(`/api/admin/integrations/${id}/response-times`);
    return response.data;
  },

  updateIntegrationStatus: async (id: number, status: string) => {
    const response = await apiClient.patch(`/api/admin/integrations/${id}/status`, { status });
    return response.data;
  },

  getAdminOverview: async () => {
    const response = await apiClient.get('/api/admin/stats/overview');
    return response.data;
  },
};
