import { addEvent } from './event-buffer';
import { getUserId } from './supabase-client';

const IDLE_THRESHOLD_SECONDS = 300; // 5 minutes
let currentIdleState: chrome.idle.IdleState = 'active';

export function initIdleDetector() {
  chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);

  chrome.idle.onStateChanged.addListener(async (newState) => {
    const userId = await getUserId();
    if (!userId) return;

    const previousState = currentIdleState;
    currentIdleState = newState;

    if (newState === 'idle' || newState === 'locked') {
      if (previousState === 'active') {
        await addEvent({
          user_id: userId,
          app: 'other',
          event_type: 'idle_start',
          metadata: { idle_state: newState },
        });
      }
    } else if (newState === 'active') {
      if (previousState === 'idle' || previousState === 'locked') {
        await addEvent({
          user_id: userId,
          app: 'other',
          event_type: 'idle_end',
          metadata: { previous_state: previousState },
        });
      }
    }
  });
}

export function getIdleState(): chrome.idle.IdleState {
  return currentIdleState;
}
