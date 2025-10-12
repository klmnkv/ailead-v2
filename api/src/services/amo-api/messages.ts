import { AmoApiClient } from './client.js';
import { logger } from '../../utils/logger.js';

export class MessageService {
  constructor(private client: AmoApiClient) {}

  /**
   * Send message to lead (tries chat first, falls back to note)
   */
  async sendToLead(
    leadId: number,
    message: string,
    options?: {
      preferNote?: boolean;
      attachments?: any[];
    }
  ): Promise<any> {
    const { preferNote = false } = options || {};

    if (preferNote) {
      return this.client.addNote(leadId, message);
    }

    try {
      // Try chat first
      return await this.client.sendChatMessage(leadId, message);
    } catch (error: any) {
      // Fallback to note if chat is not available
      if (error.statusCode === 404 || error.statusCode === 403) {
        logger.info(`Chat not available for lead ${leadId}, using note instead`);
        return this.client.addNote(leadId, message);
      }
      throw error;
    }
  }

  /**
   * Send bulk messages
   */
  async sendBulk(
    messages: Array<{ leadId: number; text: string }>
  ): Promise<any[]> {
    const results = [];

    for (const msg of messages) {
      try {
        const result = await this.sendToLead(msg.leadId, msg.text);
        results.push({ success: true, leadId: msg.leadId, result });
      } catch (error: any) {
        logger.error(`Failed to send message to lead ${msg.leadId}:`, error);
        results.push({ success: false, leadId: msg.leadId, error: error.message });
      }

      // Small delay between messages for rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    return results;
  }
}