import { classifyUrl, isTrackedApp } from '../lib/app-classifier';
import { sanitizeUrl, sanitizeTitle } from '../lib/url-sanitizer';
import { initBuffer, addEvent, flushBuffer } from '../lib/event-buffer';
import { initIdleDetector, getIdleState } from '../lib/idle-detector';
import { startSession, switchApp, markIdle, markActive, getSessionId, endSession, syncSessionToDb, incrementEventCount } from '../lib/session-manager';
import { getUserId, getSupabase } from '../lib/supabase-client';
import { trackDomain, pauseDomainTracking, resumeDomainTracking, syncDomainsToDB } from '../lib/domain-tracker';
import { logInteraction, analyzeActivity, getAndClearFlags } from '../lib/fake-activity-detector';
import type { TrackedApp } from '../types/events';

let lastTrackedApp: TrackedApp | null = null;

// Initialize on install/startup
chrome.runtime.onInstalled.addListener(async () => {
  await initBuffer();
  initIdleDetector();
  chrome.alarms.create('heartbeat', { periodInMinutes: 2 });
  await emitSignOn();
});

chrome.runtime.onStartup.addListener(async () => {
  await initBuffer();
  initIdleDetector();
  chrome.alarms.create('heartbeat', { periodInMinutes: 2 });
  await emitSignOn();
});

/** Emit sign-on event when extension starts */
async function emitSignOn() {
  const userId = await getUserId();
  if (!userId) return;

  let sessionId = await getSessionId();
  if (!sessionId) {
    sessionId = await startSession();
  }

  await addEvent({
    user_id: userId,
    app: 'other',
    event_type: 'sign_on',
    metadata: { extension_version: '1.1.0' },
    session_id: sessionId ?? undefined,
  });
  await incrementEventCount();
}

// Tab activated (user switches tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const userId = await getUserId();
  if (!userId) return;

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url) return;

    await handleTabChange(userId, tab.url, tab.title ?? '');
  } catch {
    // Tab might have been closed
  }
});

// Tab URL updated (navigation within same tab)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.active || !tab.url) return;

  const userId = await getUserId();
  if (!userId) return;

  await handleTabChange(userId, tab.url, tab.title ?? '');
});

async function handleTabChange(userId: string, url: string, title: string) {
  const app = classifyUrl(url);
  const { host, path } = sanitizeUrl(url);
  const sanitizedTitle = sanitizeTitle(title);

  // Track domain-level time
  await trackDomain(url);

  // Ensure session exists
  let sessionId = await getSessionId();
  if (!sessionId) {
    sessionId = await startSession();
  }

  // Track app switch
  if (app !== lastTrackedApp) {
    if (lastTrackedApp) {
      await addEvent({
        user_id: userId,
        app: lastTrackedApp,
        event_type: 'tab_deactivated',
        session_id: sessionId ?? undefined,
      });
      await incrementEventCount();
    }

    await addEvent({
      user_id: userId,
      app,
      event_type: 'tab_activated',
      url_path: path,
      url_host: host,
      tab_title: sanitizedTitle,
      session_id: sessionId ?? undefined,
    });
    await incrementEventCount();

    await switchApp(app);
    lastTrackedApp = app;
  } else {
    // Same app but URL changed (navigation within app)
    await addEvent({
      user_id: userId,
      app,
      event_type: 'url_changed',
      url_path: path,
      url_host: host,
      tab_title: sanitizedTitle,
      session_id: sessionId ?? undefined,
    });
    await incrementEventCount();
  }
}

// Heartbeat: send periodic event, sync session timers + domain data to DB
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'heartbeat') return;

  const userId = await getUserId();
  if (!userId) return;

  // Always sync session timers and domain data to DB
  await syncSessionToDb();
  await syncDomainsToDB();

  // Analyze activity patterns for fake behavior
  await analyzeAndSyncFlags(userId);

  const idleState = getIdleState();
  if (idleState !== 'active') return;

  let sessionId = await getSessionId();
  if (!sessionId) {
    sessionId = await startSession();
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tabs[0]?.url ?? '';
  const app = classifyUrl(url);

  await addEvent({
    user_id: userId,
    app,
    event_type: 'heartbeat',
    session_id: sessionId ?? undefined,
  });
  await incrementEventCount();
});

/** Analyze fake activity and sync flags to DB */
async function analyzeAndSyncFlags(userId: string) {
  await analyzeActivity();
  const flags = await getAndClearFlags();
  if (flags.length === 0) return;

  const supabase = await getSupabase();
  if (!supabase) return;

  const rows = flags.map((f) => ({
    user_id: userId,
    flag_type: f.reason,
    confidence: f.confidence,
    details: f.details,
    flagged_at: f.timestamp,
  }));

  await supabase.from('OS_activity_flags').insert(rows);
}

// Idle detection events
chrome.idle.onStateChanged.addListener(async (newState) => {
  if (newState === 'idle' || newState === 'locked') {
    await markIdle();
    await pauseDomainTracking();
    await syncSessionToDb();
    await syncDomainsToDB();
    await flushBuffer();
  } else if (newState === 'active') {
    await markActive();
    // Resume domain tracking with current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url) {
      await resumeDomainTracking(tabs[0].url);
    }
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    (async () => {
      const userId = await getUserId();
      const sessionId = await getSessionId();
      const idleState = getIdleState();
      const tab = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab[0]?.url ?? '';
      const currentApp = classifyUrl(currentUrl);

      sendResponse({
        loggedIn: !!userId,
        sessionActive: !!sessionId,
        idleState,
        currentApp,
      });
    })();
    return true; // Async response
  }

  // Content script sends user interaction data for fake activity detection
  if (message.type === 'ACTIVITY_INPUT') {
    logInteraction(message.data);
    return false;
  }

  if (message.type === 'FORCE_FLUSH') {
    syncSessionToDb()
      .then(() => syncDomainsToDB())
      .then(() => flushBuffer())
      .then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === 'END_SESSION') {
    (async () => {
      const userId = await getUserId();
      if (userId) {
        const sessionId = await getSessionId();
        await addEvent({
          user_id: userId,
          app: 'other',
          event_type: 'sign_off',
          session_id: sessionId ?? undefined,
        });
      }
      await syncDomainsToDB();
      await endSession();
      await flushBuffer();
      sendResponse({ success: true });
    })();
    return true;
  }
});
