export type TrackedApp = 'bubble' | 'gmail' | 'dialpad' | 'melio' | 'other';

export interface ActivityEvent {
  user_id: string;
  app: TrackedApp;
  event_type: string;
  url_path?: string;
  url_host?: string;
  tab_title?: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
  created_at?: string;
}

export interface ExtensionConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  userId: string;
  accessToken: string;
}
