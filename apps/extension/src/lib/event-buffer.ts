import { getSupabase } from './supabase-client';
import type { ActivityEvent } from '../types/events';

const BUFFER_KEY = 'eventBuffer';
const MAX_BUFFER_SIZE = 500;
const FLUSH_ALARM_NAME = 'flushEvents';
const FLUSH_INTERVAL_MINUTES = 0.5; // 30 seconds (Chrome MV3 minimum)

export async function initBuffer() {
  // Set up periodic flush alarm
  await chrome.alarms.create(FLUSH_ALARM_NAME, {
    periodInMinutes: FLUSH_INTERVAL_MINUTES,
  });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === FLUSH_ALARM_NAME) {
      await flushBuffer();
    }
  });
}

export async function addEvent(event: ActivityEvent) {
  const result = await chrome.storage.local.get(BUFFER_KEY);
  const buffer: ActivityEvent[] = result[BUFFER_KEY] ?? [];

  event.created_at = new Date().toISOString();
  buffer.push(event);

  // Drop oldest events if buffer exceeds max
  if (buffer.length > MAX_BUFFER_SIZE) {
    buffer.splice(0, buffer.length - MAX_BUFFER_SIZE);
  }

  await chrome.storage.local.set({ [BUFFER_KEY]: buffer });

  // Auto-flush if buffer is large
  if (buffer.length >= 50) {
    await flushBuffer();
  }
}

export async function flushBuffer() {
  const result = await chrome.storage.local.get(BUFFER_KEY);
  const buffer: ActivityEvent[] = result[BUFFER_KEY] ?? [];

  if (buffer.length === 0) return;

  const supabase = await getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('OS_activity_events').insert(buffer);

    if (!error) {
      // Clear buffer on success
      await chrome.storage.local.set({ [BUFFER_KEY]: [] });
    }
    // On error, keep events in buffer for retry
  } catch {
    // Network error — events stay in buffer for next flush
  }
}

export async function getBufferSize(): Promise<number> {
  const result = await chrome.storage.local.get(BUFFER_KEY);
  return (result[BUFFER_KEY] ?? []).length;
}
