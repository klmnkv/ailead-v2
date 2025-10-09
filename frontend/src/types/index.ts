export interface Account {
  id: number;
  email: string;
  company_name: string | null;
  subscription_plan: string;
  token_balance: number;
  created_at: string;
}

export interface Integration {
  id: number;
  account_id: number;
  amocrm_account_id: number;
  base_url: string;
  status: 'active' | 'expired' | 'revoked';
  last_sync_at: string | null;
  created_at: string;
}

export interface Message {
  id: number;
  account_id: number;
  lead_id: number;
  message_text: string;
  status: 'pending' | 'sent' | 'failed';
  processing_time: number | null;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
}

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