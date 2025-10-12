import { AmoApiClient } from './client.js';
import { AmoTask } from './types.js';
import { logger } from '../../utils/logger.js';

export class TasksService {
  constructor(private client: AmoApiClient) {}

  /**
   * Create task
   */
  async create(
    entityId: number,
    text: string,
    options?: {
      entityType?: 'leads' | 'contacts' | 'companies';
      responsibleUserId?: number;
      completeTill?: Date | number;
      taskTypeId?: number;
    }
  ): Promise<any> {
    const {
      entityType = 'leads',
      responsibleUserId,
      completeTill = new Date(Date.now() + 86400000), // +1 day
      taskTypeId = 1
    } = options || {};

    const taskData: AmoTask = {
      task_type_id: taskTypeId,
      text,
      complete_till: typeof completeTill === 'number'
        ? completeTill
        : Math.floor(completeTill.getTime() / 1000),
      entity_id: entityId,
      entity_type: entityType,
      responsible_user_id: responsibleUserId
    };

    const response = await this.client.httpClient.post('/tasks', [taskData]);
    return response.data._embedded?.tasks?.[0];
  }

  /**
   * Create task for lead
   */
  async createForLead(
    leadId: number,
    text: string,
    completeTill?: Date,
    responsibleUserId?: number
  ): Promise<any> {
    // If no responsible user, try to get from lead
    if (!responsibleUserId) {
      try {
        const lead = await this.client.getLead(leadId);
        responsibleUserId = lead.responsible_user_id;
      } catch (error) {
        logger.warn(`Could not fetch lead ${leadId} for responsible user`);
      }
    }

    return this.create(leadId, text, {
      entityType: 'leads',
      responsibleUserId,
      completeTill
    });
  }

  /**
   * Complete task
   */
  async complete(taskId: number, resultText?: string): Promise<any> {
    const updateData: any = {
      is_completed: true,
      completed_at: Math.floor(Date.now() / 1000)
    };

    if (resultText) {
      updateData.result = { text: resultText };
    }

    const response = await this.client.httpClient.patch(`/tasks/${taskId}`, updateData);
    return response.data;
  }

  /**
   * Update task
   */
  async update(taskId: number, data: Partial<AmoTask>): Promise<any> {
    const response = await this.client.httpClient.patch(`/tasks/${taskId}`, data);
    return response.data;
  }

  /**
   * Get tasks for entity
   */
  async getForEntity(
    entityId: number,
    entityType: 'leads' | 'contacts' | 'companies' = 'leads',
    options?: {
      isCompleted?: boolean;
      limit?: number;
    }
  ): Promise<any[]> {
    const { isCompleted, limit = 50 } = options || {};

    const filter: any = {
      entity_id: [entityId],
      entity_type: entityType
    };

    if (isCompleted !== undefined) {
      filter.is_completed = isCompleted;
    }

    const response = await this.client.httpClient.get('/tasks', {
      params: { filter, limit }
    });

    return response.data._embedded?.tasks || [];
  }

  /**
   * Create recurring task
   */
  async createRecurring(
    leadId: number,
    text: string,
    intervalDays: number,
    count: number = 1
  ): Promise<any[]> {
    const tasks = [];
    const baseTime = Date.now();

    for (let i = 0; i < count; i++) {
      const completeTill = new Date(baseTime + (intervalDays * 86400000 * (i + 1)));
      const task = await this.createForLead(
        leadId,
        `${text} (${i + 1}/${count})`,
        completeTill
      );
      tasks.push(task);
    }

    return tasks;
  }
}