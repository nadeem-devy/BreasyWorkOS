/**
 * Domain-level time tracker.
 * Tracks how long each domain is active per day, stored locally
 * and synced to Supabase on heartbeat.
 */

import { getSupabase, getUserId } from './supabase-client';

const DOMAIN_KEY = 'domainTimers';

interface DomainEntry {
  domain: string;
  seconds: number;
  lastSeen: number; // timestamp
}

interface DomainState {
  date: string; // YYYY-MM-DD
  activeDomain: string | null;
  activeSince: number; // timestamp
  domains: Record<string, DomainEntry>;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getState(): Promise<DomainState> {
  const result = await chrome.storage.local.get(DOMAIN_KEY);
  const state: DomainState = result[DOMAIN_KEY] ?? {
    date: todayStr(),
    activeDomain: null,
    activeSince: Date.now(),
    domains: {},
  };

  // Reset on new day
  if (state.date !== todayStr()) {
    // Sync before resetting
    await syncDomainsToDB(state);
    return {
      date: todayStr(),
      activeDomain: null,
      activeSince: Date.now(),
      domains: {},
    };
  }

  return state;
}

async function saveState(state: DomainState) {
  await chrome.storage.local.set({ [DOMAIN_KEY]: state });
}

/** Called when the active tab changes to a new URL */
export async function trackDomain(url: string) {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;
    if (!domain || domain === 'newtab' || parsed.protocol === 'chrome:') return;

    const state = await getState();
    const now = Date.now();

    // Accumulate time on previous domain
    if (state.activeDomain && state.activeDomain !== domain) {
      const elapsed = Math.floor((now - state.activeSince) / 1000);
      if (state.domains[state.activeDomain]) {
        state.domains[state.activeDomain].seconds += elapsed;
        state.domains[state.activeDomain].lastSeen = now;
      }
    }

    // Initialize new domain if needed
    if (!state.domains[domain]) {
      state.domains[domain] = { domain, seconds: 0, lastSeen: now };
    }

    state.activeDomain = domain;
    state.activeSince = now;
    await saveState(state);
  } catch {
    // Invalid URL
  }
}

/** Called when user goes idle — stop accumulating */
export async function pauseDomainTracking() {
  const state = await getState();
  if (state.activeDomain) {
    const elapsed = Math.floor((Date.now() - state.activeSince) / 1000);
    if (state.domains[state.activeDomain]) {
      state.domains[state.activeDomain].seconds += elapsed;
    }
    state.activeDomain = null;
  }
  await saveState(state);
}

/** Called when user becomes active again */
export async function resumeDomainTracking(url: string) {
  await trackDomain(url);
}

/** Sync domain data to DB — called on heartbeat */
export async function syncDomainsToDB(stateOverride?: DomainState) {
  const userId = await getUserId();
  const supabase = await getSupabase();
  if (!userId || !supabase) return;

  const state = stateOverride ?? await getState();

  // Accumulate current domain time before sync
  if (state.activeDomain && state.domains[state.activeDomain]) {
    const now = Date.now();
    const elapsed = Math.floor((now - state.activeSince) / 1000);
    state.domains[state.activeDomain].seconds += elapsed;
    state.activeSince = now;
    if (!stateOverride) await saveState(state);
  }

  const entries = Object.values(state.domains).filter((d) => d.seconds > 0);
  if (entries.length === 0) return;

  // Upsert domain time entries for today
  const rows = entries.map((d) => ({
    user_id: userId,
    date: state.date,
    domain: d.domain,
    seconds: d.seconds,
  }));

  await supabase.from('OS_domain_time').upsert(rows, {
    onConflict: 'user_id,date,domain',
  });
}
