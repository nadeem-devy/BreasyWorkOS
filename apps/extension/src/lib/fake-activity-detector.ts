/**
 * Fake activity detector.
 * Detects patterns that suggest a user is using a mouse jiggler
 * or fake activity tool to appear active:
 *
 * 1. Mouse movements with suspicious regularity (exact intervals)
 * 2. Minimal tab switches combined with periodic idle resets
 * 3. Activity that resets idle exactly at the threshold
 *
 * This runs in the content script and reports to the service worker.
 */

const ACTIVITY_LOG_KEY = 'activityLog';
const FLAG_KEY = 'activityFlags';

interface ActivityEntry {
  type: 'mouse_move' | 'click' | 'keypress' | 'scroll';
  timestamp: number;
  x?: number;
  y?: number;
}

interface ActivityFlag {
  timestamp: string;
  reason: string;
  confidence: number; // 0-100
  details: Record<string, unknown>;
}

const MAX_LOG_SIZE = 500;

/** Add an interaction event to the log */
export async function logInteraction(entry: ActivityEntry) {
  const result = await chrome.storage.local.get(ACTIVITY_LOG_KEY);
  const log: ActivityEntry[] = result[ACTIVITY_LOG_KEY] ?? [];

  log.push(entry);

  // Keep only recent entries
  if (log.length > MAX_LOG_SIZE) {
    log.splice(0, log.length - MAX_LOG_SIZE);
  }

  await chrome.storage.local.set({ [ACTIVITY_LOG_KEY]: log });
}

/**
 * Analyze recent activity for fake patterns.
 * Called on heartbeat (every 2 minutes).
 */
export async function analyzeActivity(): Promise<ActivityFlag | null> {
  const result = await chrome.storage.local.get(ACTIVITY_LOG_KEY);
  const log: ActivityEntry[] = result[ACTIVITY_LOG_KEY] ?? [];

  if (log.length < 10) return null;

  // Only analyze last 15 minutes of data
  const cutoff = Date.now() - 15 * 60 * 1000;
  const recent = log.filter((e) => e.timestamp > cutoff);

  if (recent.length < 5) return null;

  const flag = detectJiggler(recent) ?? detectPeriodicClicks(recent) ?? detectNoRealInput(recent);

  if (flag) {
    await saveFlag(flag);
  }

  return flag;
}

/** Detect mouse jiggler: tiny moves at very regular intervals */
function detectJiggler(entries: ActivityEntry[]): ActivityFlag | null {
  const moves = entries.filter((e) => e.type === 'mouse_move');
  if (moves.length < 10) return null;

  // Check for regular intervals between moves
  const intervals: number[] = [];
  for (let i = 1; i < moves.length; i++) {
    intervals.push(moves[i].timestamp - moves[i - 1].timestamp);
  }

  // Calculate standard deviation of intervals
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // If std dev is very low relative to mean, intervals are suspiciously regular
  const coeffOfVariation = mean > 0 ? stdDev / mean : 1;

  // Check for tiny movement distances
  let tinyMoves = 0;
  for (let i = 1; i < moves.length; i++) {
    if (moves[i].x !== undefined && moves[i - 1].x !== undefined) {
      const dx = Math.abs((moves[i].x ?? 0) - (moves[i - 1].x ?? 0));
      const dy = Math.abs((moves[i].y ?? 0) - (moves[i - 1].y ?? 0));
      if (dx <= 5 && dy <= 5) tinyMoves++;
    }
  }

  const tinyMoveRatio = tinyMoves / (moves.length - 1);

  // Flag: very regular intervals AND tiny movements
  if (coeffOfVariation < 0.15 && tinyMoveRatio > 0.8) {
    return {
      timestamp: new Date().toISOString(),
      reason: 'mouse_jiggler',
      confidence: Math.round(Math.min(95, (1 - coeffOfVariation) * 100)),
      details: {
        intervalMean: Math.round(mean),
        intervalStdDev: Math.round(stdDev),
        coeffOfVariation: Math.round(coeffOfVariation * 100) / 100,
        tinyMoveRatio: Math.round(tinyMoveRatio * 100) / 100,
        sampleSize: moves.length,
      },
    };
  }

  return null;
}

/** Detect periodic fake clicks at exact intervals */
function detectPeriodicClicks(entries: ActivityEntry[]): ActivityFlag | null {
  const clicks = entries.filter((e) => e.type === 'click');
  if (clicks.length < 5) return null;

  const intervals: number[] = [];
  for (let i = 1; i < clicks.length; i++) {
    intervals.push(clicks[i].timestamp - clicks[i - 1].timestamp);
  }

  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  const coeffOfVariation = mean > 0 ? stdDev / mean : 1;

  // Clicks at very regular intervals (e.g., every 4-5 minutes exactly)
  if (coeffOfVariation < 0.1 && mean > 60000) {
    return {
      timestamp: new Date().toISOString(),
      reason: 'periodic_clicks',
      confidence: Math.round(Math.min(90, (1 - coeffOfVariation) * 100)),
      details: {
        intervalMean: Math.round(mean / 1000),
        intervalStdDev: Math.round(stdDev / 1000),
        clickCount: clicks.length,
      },
    };
  }

  return null;
}

/** Detect sessions with zero real keyboard/scroll input — just mouse */
function detectNoRealInput(entries: ActivityEntry[]): ActivityFlag | null {
  const keypresses = entries.filter((e) => e.type === 'keypress').length;
  const scrolls = entries.filter((e) => e.type === 'scroll').length;
  const moves = entries.filter((e) => e.type === 'mouse_move').length;

  // If there are lots of mouse moves but zero keystrokes and scrolls
  // over 15 minutes, that's suspicious for someone "working"
  if (moves > 20 && keypresses === 0 && scrolls === 0) {
    return {
      timestamp: new Date().toISOString(),
      reason: 'no_real_input',
      confidence: 50,
      details: {
        mouseMoves: moves,
        keypresses,
        scrolls,
        periodMinutes: 15,
      },
    };
  }

  return null;
}

async function saveFlag(flag: ActivityFlag) {
  const result = await chrome.storage.local.get(FLAG_KEY);
  const flags: ActivityFlag[] = result[FLAG_KEY] ?? [];
  flags.push(flag);

  // Keep last 50 flags
  if (flags.length > 50) {
    flags.splice(0, flags.length - 50);
  }

  await chrome.storage.local.set({ [FLAG_KEY]: flags });
}

/** Get pending flags to sync to DB */
export async function getAndClearFlags(): Promise<ActivityFlag[]> {
  const result = await chrome.storage.local.get(FLAG_KEY);
  const flags: ActivityFlag[] = result[FLAG_KEY] ?? [];
  await chrome.storage.local.set({ [FLAG_KEY]: [] });
  return flags;
}
