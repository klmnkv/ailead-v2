import { AmoApiClient } from './client.js';
import { AmoNote } from './types.js';

export class NotesService {
  constructor(private client: AmoApiClient) {}

  /**
   * Add note to entity
   */
  async add(
    entityId: number,
    text: string,
    entityType: 'leads' | 'contacts' | 'companies' | 'tasks' = 'leads',
    noteType: 'common' | 'call_in' | 'call_out' | 'service_message' = 'common'
  ): Promise<any> {
    const noteData: AmoNote = {
      entity_id: entityId,
      entity_type: entityType,
      note_type: noteType,
      params: {
        text,
        service: 'AI.LEAD Bot'
      }
    };

    const response = await this.client.httpClient.post('/notes', [noteData]);
    return response.data._embedded?.notes?.[0];
  }

  /**
   * Add note to lead (shorthand)
   */
  async addToLead(leadId: number, text: string): Promise<any> {
    return this.add(leadId, text, 'leads', 'service_message');
  }

  /**
   * Add call note
   */
  async addCallNote(
    leadId: number,
    text: string,
    direction: 'in' | 'out',
    duration?: number,
    phone?: string
  ): Promise<any> {
    const noteType = direction === 'in' ? 'call_in' : 'call_out';
    const noteText = duration
      ? `${text}\nДлительность: ${duration} сек.\nТелефон: ${phone || 'Не указан'}`
      : text;

    return this.add(leadId, noteText, 'leads', noteType);
  }

  /**
   * Get notes for entity
   */
  async getForEntity(
    entityId: number,
    entityType: 'leads' | 'contacts' | 'companies' = 'leads',
    limit = 50
  ): Promise<any[]> {
    const response = await this.client.httpClient.get('/notes', {
      params: {
        filter: {
          entity_id: [entityId],
          entity_type: entityType
        },
        limit
      }
    });
    return response.data._embedded?.notes || [];
  }
}