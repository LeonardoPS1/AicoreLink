export interface ChatwootInbox {
  id: number;
  name?: string;
  channel_type?: string;
  avatar_url?: string;
  account_id?: number;
  [key: string]: unknown;
}

export interface ChatwootConversation {
  id: number;
  inbox_id?: number;
  status?: string;
  account_id?: number;
  additional_attributes?: Record<string, unknown>;
  meta?: {
    sender?: ChatwootSender;
    assignee?: unknown;
    [key: string]: unknown;
  };
  messages_count?: number;
  last_activity_at?: number | string;
  created_at?: number | string;
  updated_at?: number | string;
  [key: string]: unknown;
}

export interface ChatwootSender {
  id?: number;
  name?: string;
  avatar?: string;
  type?: string;
  email?: string | null;
  phone_number?: string | null;
  [key: string]: unknown;
}

export interface ChatwootAccount {
  id: number;
  name?: string;
  [key: string]: unknown;
}

export interface ChatwootMessage {
  id?: number;
  content?: string | null;
  created_at?: number | string;
  updated_at?: number | string;
  message_type?: string;
  private?: boolean;
  content_type?: string;
  source_id?: string | null;
  sender?: ChatwootSender;
  conversation_id?: number;
  inbox_id?: number;
  [key: string]: unknown;
}

export interface ChatwootWebhookPayload {
  event: string;
  id?: number;
  content?: string | null;
  created_at?: number | string;
  updated_at?: number | string;
  message_type?: string;
  private?: boolean;
  content_type?: string;
  source_id?: string | null;
  sender?: ChatwootSender;
  conversation?: ChatwootConversation;
  inbox?: ChatwootInbox;
  account?: ChatwootAccount;
  contact?: ChatwootSender;
  message?: ChatwootMessage;
  [key: string]: unknown;
}