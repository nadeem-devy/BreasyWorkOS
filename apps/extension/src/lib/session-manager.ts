import { getSupabase, getUserId } from './supabase-client';
import type { TrackedApp } from '../types/events';

const SESSION_KEY = 'currentSession';

interface SessionState {
  sessionId: string | null;
  startedAt: string | null;
  currentApp: TrackedApp | null;
  appSwitchedAt: number;
  timers: Record<TrackedApp, number>;
  idleSeconds: number;
  idleStartedAt: number | null;
  totalEvents: number;
  totalTabSwitches: number;
}

const EMPTY_SESSION: SessionState = {
  sessionId: null,
  startedAt: null,
  currentApp: null,
  appSwitchedAt: Date.now(),
  timers: { bubble: 0, gmail: 0, dialpad: 0, melio: 0, other: 0 },
  idleSeconds: 0,
  idleStartedAt: null,
  totalEvents: 0,
  totalTabSwitches: 0,
};

async function getSession(): Promise<SessionState> {
  const result = await chrome.storage.local.get(SESSION_KEY);
  return result[SESSION_KEY] ?? { ...EMPTY_SESSION, appSwitchedAt: Date.now() };
}

async function saveSession(session: SessionState) {
  await chrome.storage.local.set({ [SESSION_KEY]: session });
}

/** Flush current elapsed time into the correct timer bucket */
function accumulateTime(session: SessionState): SessionState {
  const now = Date.now();
  const elapsed = Math.floor((now - session.appSwitchedAt) / 1000);

  if (session.idleStartedAt) {
    // Currently idle — accumulate into idleSeconds
    session.idleSeconds += elapsed;
  } else if (session.currentApp) {
    // Active on an app — accumulate into that app's timer
    session.timers[session.currentApp] = (session.timers[session.currentApp] ?? 0) + elapsed;
  }

  session.appSwitchedAt = now;
  return session;
}

export async function startSession(): Promise<string | null> {
  const userId = await getUserId();
  const supabase = await getSupabase();
  if (!userId || !supabase) return null;

  // Get stored chrome profile (auto-detected on login)
  const stored = await chrome.storage.local.get('chromeProfile');
  const chromeProfile = stored.chromeProfile ?? null;

  const { data, error } = await supabase
    .from('OS_sessions')
    .insert({
      user_id: userId,
      chrome_profile: chromeProfile,
      extension_version: '1.0.0',
    })
    .select('id')
    .single();

  if (error || !data) return null;

  const session: SessionState = {
    ...EMPTY_SESSION,
    sessionId: data.id,
    startedAt: new Date().toISOString(),
    appSwitchedAt: Date.now(),
  };

  await saveSession(session);
  return data.id;
}

export async function switchApp(newApp: TrackedApp) {
  const session = await getSession();
  if (!session.sessionId) return;

  accumulateTime(session);
  session.currentApp = newApp;
  session.totalTabSwitches += 1;
  await saveSession(session);
}

export async function incrementEventCount() {
  const session = await getSession();
  if (!session.sessionId) return;
  session.totalEvents += 1;
  await saveSession(session);
}

export async function markIdle() {
  const session = await getSession();
  if (!session.sessionId) return;

  accumulateTime(session);
  session.idleStartedAt = Date.now();
  await saveSession(session);
}

export async function markActive() {
  const session = await getSession();
  if (!session.sessionId || !session.idleStartedAt) return;

  accumulateTime(session);
  session.idleStartedAt = null;
  await saveSession(session);
}

/** Push current session timers to Supabase — called on heartbeat */
export async function syncSessionToDb() {
  const session = await getSession();
  if (!session.sessionId || !session.startedAt) return;

  const supabase = await getSupabase();
  if (!supabase) return;

  // Accumulate elapsed time before syncing
  accumulateTime(session);
  await saveSession(session);

  const totalSeconds = Math.floor(
    (Date.now() - new Date(session.startedAt).getTime()) / 1000
  );

  await supabase
    .from('OS_sessions')
    .update({
      duration_seconds: totalSeconds,
      time_bubble: session.timers.bubble ?? 0,
      time_gmail: session.timers.gmail ?? 0,
      time_dialpad: session.timers.dialpad ?? 0,
      time_melio: session.timers.melio ?? 0,
      time_other: session.timers.other ?? 0,
      time_idle: session.idleSeconds,
      total_events: session.totalEvents,
      total_tab_switches: session.totalTabSwitches,
    })
    .eq('id', session.sessionId);
}

export async function endSession() {
  const session = await getSession();
  if (!session.sessionId) return;

  // Final sync to DB
  await syncSessionToDb();

  const supabase = await getSupabase();
  if (!supabase) return;

  await supabase
    .from('OS_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', session.sessionId);

  await saveSession({ ...EMPTY_SESSION, appSwitchedAt: Date.now() });
}

export async function getSessionId(): Promise<string | null> {
  const session = await getSession();
  return session.sessionId;
}

export async function getSessionState(): Promise<SessionState> {
  return getSession();
}
