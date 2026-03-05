/**
 * Content script that monitors real user interactions.
 * Captures mouse moves, clicks, keypresses, and scrolls
 * and sends them to the service worker for fake-activity analysis.
 */

let lastMoveReport = 0;
const MOVE_THROTTLE_MS = 2000; // Report mouse position every 2 seconds max

document.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastMoveReport < MOVE_THROTTLE_MS) return;
  lastMoveReport = now;

  chrome.runtime.sendMessage({
    type: 'ACTIVITY_INPUT',
    data: { type: 'mouse_move', timestamp: now, x: e.clientX, y: e.clientY },
  }).catch(() => { /* extension context invalidated */ });
}, { passive: true });

document.addEventListener('click', () => {
  chrome.runtime.sendMessage({
    type: 'ACTIVITY_INPUT',
    data: { type: 'click', timestamp: Date.now() },
  }).catch(() => {});
}, { passive: true });

document.addEventListener('keydown', () => {
  chrome.runtime.sendMessage({
    type: 'ACTIVITY_INPUT',
    data: { type: 'keypress', timestamp: Date.now() },
  }).catch(() => {});
}, { passive: true });

document.addEventListener('scroll', () => {
  chrome.runtime.sendMessage({
    type: 'ACTIVITY_INPUT',
    data: { type: 'scroll', timestamp: Date.now() },
  }).catch(() => {});
}, { passive: true });
