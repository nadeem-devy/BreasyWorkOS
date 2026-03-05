import type { TrackedApp } from './types';

// App URL patterns for classification
export const APP_URL_PATTERNS: Record<TrackedApp, RegExp> = {
  bubble: /^https?:\/\/(app\.joinbreasy\.com|.*\.bubbleapps\.io|.*\.bubble\.io)/,
  gmail: /^https?:\/\/mail\.google\.com/,
  dialpad: /^https?:\/\/(app\.)?dialpad\.com/,
  melio: /^https?:\/\/app\.melio\.com/,
  other: /.*/,
};

// Idle detection threshold (seconds)
export const IDLE_THRESHOLD_SECONDS = 300; // 5 minutes

// Event buffer flush interval (milliseconds)
export const EVENT_FLUSH_INTERVAL_MS = 10_000; // 10 seconds

// Max events in buffer before force flush
export const EVENT_BUFFER_MAX_SIZE = 500;

// Session timeout (minutes of idle before session ends)
export const SESSION_TIMEOUT_MINUTES = 30;

// URL query params safe to keep when sanitizing
export const SAFE_URL_PARAMS = ['tab', 'view', 'page', 'status', 'filter', 'stage'];

// Status thresholds
export const ACTIVE_THRESHOLD_MINUTES = 5;
export const IDLE_THRESHOLD_MINUTES = 15;

// App display config
export const APP_CONFIG: Record<TrackedApp, { label: string; color: string; bgColor: string }> = {
  bubble: { label: 'Bubble', color: '#3B82F6', bgColor: '#EFF6FF' },
  gmail: { label: 'Gmail', color: '#EF4444', bgColor: '#FEF2F2' },
  dialpad: { label: 'Dialpad', color: '#8B5CF6', bgColor: '#F5F3FF' },
  melio: { label: 'Melio', color: '#10B981', bgColor: '#ECFDF5' },
  other: { label: 'Other', color: '#6B7280', bgColor: '#F9FAFB' },
};

// Aging bucket labels
export const AGING_BUCKETS = ['current', '1-30', '31-60', '61-90', '90+'] as const;

// Follow-up gap threshold (days)
export const FOLLOWUP_GAP_DAYS = 3;
