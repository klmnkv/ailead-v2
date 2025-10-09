import { apiClient } from './client';

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

export interface JobDetails {
  id: string;
  state: string;
  progress: number;
  data: any;
  attemptsMade: number;
  processedOn: number | null;
  finishedOn: number | null;
  failedReason: string | null;
}

export const queueApi = {
  getStats: async (): Promise<QueueStats> => {
    const response = await apiClient.get('/queue/stats');
    return response.data;
  },

  getJob: async (jobId: string): Promise<JobDetails> => {
    const response = await apiClient.get(`/queue/job/${jobId}`);
    return response.data;
  }
};