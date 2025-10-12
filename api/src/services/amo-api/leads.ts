import { AmoApiClient } from './client.js';
import { AmoLead } from './types.js';

export class LeadsService {
  constructor(private client: AmoApiClient) {}

  /**
   * Get lead by ID
   */
  async getById(leadId: number, withContacts = true): Promise<AmoLead> {
    const params = withContacts ? { with: 'contacts' } : {};
    const response = await this.client.httpClient.get(`/leads/${leadId}`, { params });
    return response.data;
  }

  /**
   * Get multiple leads
   */
  async getMultiple(leadIds: number[]): Promise<AmoLead[]> {
    const filter = { id: leadIds };
    const response = await this.client.httpClient.get('/leads', {
      params: { filter, limit: 250 }
    });
    return response.data._embedded?.leads || [];
  }

  /**
   * Update lead
   */
  async update(leadId: number, data: Partial<AmoLead>): Promise<any> {
    const response = await this.client.httpClient.patch(`/leads/${leadId}`, data);
    return response.data;
  }

  /**
   * Update lead status
   */
  async updateStatus(leadId: number, statusId: number): Promise<any> {
    return this.update(leadId, { status_id: statusId });
  }

  /**
   * Add tags to lead
   */
  async addTags(leadId: number, tags: string[]): Promise<any> {
    const lead = await this.getById(leadId, false);
    const existingTags = lead._embedded?.tags || [];
    const newTags = [...existingTags, ...tags.map(name => ({ name }))];

    return this.update(leadId, {
      _embedded: { tags: newTags }
    });
  }

  /**
   * Search leads
   */
  async search(query: string, limit = 50): Promise<AmoLead[]> {
    const response = await this.client.httpClient.get('/leads', {
      params: { query, limit }
    });
    return response.data._embedded?.leads || [];
  }
}