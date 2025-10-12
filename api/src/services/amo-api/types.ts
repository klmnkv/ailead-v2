export interface AmoApiResponse<T = any> {
  data: T;
  _links?: {
    self: {
      href: string;
    };
  };
  _embedded?: any;
}

export class AmoApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'AmoApiError';
  }
}

export interface AmoLead {
  id: number;
  name: string;
  price: number;
  status_id: number;
  pipeline_id: number;
  created_at: number;
  updated_at: number;
  closed_at?: number;
  responsible_user_id: number;
  account_id: number;
  custom_fields_values?: any[];
  _embedded?: {
    contacts?: AmoContact[];
    companies?: any[];
    tags?: any[];
  };
}

export interface AmoContact {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  responsible_user_id: number;
  created_at: number;
  updated_at: number;
  custom_fields_values?: any[];
}

export interface AmoNote {
  id?: number;
  entity_id: number;
  entity_type: string;
  note_type: string;
  params: {
    text: string;
    service?: string;
  };
}

export interface AmoTask {
  id?: number;
  task_type_id: number;
  text: string;
  complete_till: number;
  entity_id: number;
  entity_type: string;
  responsible_user_id?: number;
}

export interface AmoChatMessage {
  chat_id: string;
  message: {
    text: string;
    type?: 'text' | 'file' | 'image';
    media?: string;
  };
}

export interface AmoWebhook {
  leads?: {
    add?: AmoLead[];
    update?: AmoLead[];
    status?: AmoLead[];
    delete?: AmoLead[];
  };
  contacts?: {
    add?: AmoContact[];
    update?: AmoContact[];
    delete?: AmoContact[];
  };
  account: {
    subdomain: string;
    id: string;
    _links: {
      self: string;
    };
  };
}