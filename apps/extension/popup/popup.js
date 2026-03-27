const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const statusBanner = document.getElementById('status-banner');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const statusSub = document.getElementById('status-sub');
const currentAppEl = document.getElementById('current-app');
const sessionTimeEl = document.getElementById('session-time');
const bufferCountEl = document.getElementById('buffer-count');
const appBarsEl = document.getElementById('app-bars');
const refreshBtn = document.getElementById('refresh-btn');
const headerRefreshBtn = document.getElementById('header-refresh-btn');
const footer = document.getElementById('footer');

const APP_COLORS = { bubble: '#3B82F6', gmail: '#EF4444', dialpad: '#8B5CF6', melio: '#10B981' };
const APP_NAMES = { bubble: 'Bubble', gmail: 'Gmail', dialpad: 'Dialpad', melio: 'Melio', other: 'Other' };

const STATUS_LABELS = {
  active: { label: 'Online', sub: 'Tracking your activity' },
  idle: { label: 'Idle', sub: 'No input detected' },
  offline: { label: 'Offline', sub: 'Session not active' },
};

// Store original button content for restore after sync
const refreshBtnOriginalContent = refreshBtn ? refreshBtn.cloneNode(true).childNodes : null;

async function init() {
  const { userId } = await chrome.storage.local.get('userId');

  if (userId) {
    const { accessToken } = await chrome.storage.local.get('accessToken');
    if (!accessToken) {
      await chrome.storage.local.clear();
      showLogin();
      return;
    }
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginView.style.display = 'block';
  dashboardView.style.display = 'none';
  logoutBtn.style.display = 'none';
  refreshBtn.style.display = 'none';
  footer.style.display = 'none';
}

function createAppBar(app, seconds, maxTime) {
  const mins = Math.floor(seconds / 60);
  const pct = Math.round((seconds / maxTime) * 100);

  const row = document.createElement('div');
  row.className = 'app-bar';

  const label = document.createElement('span');
  label.className = 'app-bar-label';
  label.textContent = APP_NAMES[app] || app;

  const track = document.createElement('div');
  track.className = 'app-bar-track';

  const fill = document.createElement('div');
  fill.className = 'app-bar-fill';
  fill.style.width = pct + '%';
  fill.style.background = APP_COLORS[app] || '#d1d5db';
  track.appendChild(fill);

  const time = document.createElement('span');
  time.className = 'app-bar-time';
  time.textContent = mins + 'm';

  row.appendChild(label);
  row.appendChild(track);
  row.appendChild(time);
  return row;
}

function updateStatus(state, sessionActive) {
  const key = !sessionActive ? 'offline' : state;
  const info = STATUS_LABELS[key] || STATUS_LABELS.offline;

  statusBanner.className = 'status-banner ' + key;
  statusDot.className = 'status-dot ' + key;
  statusText.textContent = info.label;
  statusSub.textContent = info.sub;
}

function restoreRefreshBtn() {
  // Clear and rebuild the refresh button content using DOM methods
  while (refreshBtn.firstChild) refreshBtn.removeChild(refreshBtn.firstChild);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.style.width = '12px';
  svg.style.height = '12px';
  svg.style.fill = '#6b7280';
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z');
  svg.appendChild(path);
  refreshBtn.appendChild(svg);
  refreshBtn.appendChild(document.createTextNode(' Sync Now'));
}

async function showDashboard() {
  loginView.style.display = 'none';
  dashboardView.style.display = 'block';
  logoutBtn.style.display = 'block';
  refreshBtn.style.display = 'flex';
  footer.style.display = 'flex';

  // Get status from service worker
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (!response) {
      updateStatus('offline', false);
      return;
    }

    const state = response.idleState === 'active' ? 'active' : response.idleState === 'idle' ? 'idle' : 'offline';
    updateStatus(state, response.sessionActive);
    currentAppEl.textContent = APP_NAMES[response.currentApp] || '\u2014';
  });

  // Get session info
  const { currentSession } = await chrome.storage.local.get('currentSession');
  if (currentSession && currentSession.startedAt) {
    const elapsed = Math.floor((Date.now() - new Date(currentSession.startedAt).getTime()) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    sessionTimeEl.textContent = h > 0 ? h + 'h ' + m + 'm' : m + 'm';

    // App time bars
    const timers = currentSession.timers || {};
    const maxTime = Math.max(1, ...Object.values(timers));

    appBarsEl.replaceChildren();
    for (const [app, seconds] of Object.entries(timers)) {
      if (app === 'other') continue;
      appBarsEl.appendChild(createAppBar(app, seconds, maxTime));
    }
  } else {
    sessionTimeEl.textContent = 'No active session';
  }

  // Get buffer size
  const { eventBuffer } = await chrome.storage.local.get('eventBuffer');
  bufferCountEl.textContent = String((eventBuffer || []).length);
}

// Refresh / Sync button handler
async function handleRefresh() {
  headerRefreshBtn.classList.add('spinning');
  refreshBtn.disabled = true;
  refreshBtn.textContent = 'Syncing...';

  try {
    await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'FORCE_FLUSH' }, () => resolve());
    });
    // Refresh the dashboard display
    await showDashboard();
  } finally {
    headerRefreshBtn.classList.remove('spinning');
    refreshBtn.disabled = false;
    restoreRefreshBtn();
  }
}

refreshBtn.addEventListener('click', handleRefresh);
headerRefreshBtn.addEventListener('click', handleRefresh);

// Breasy WorkOS Supabase config (public anon key - safe to embed)
const SUPABASE_URL = 'https://caursmdeoghqixudiscb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdXJzbWRlb2docWl4dWRpc2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjMxNjMsImV4cCI6MjA4NjkzOTE2M30.wtMGhqZ4LbIZKMHXrAnI1AiI7qK2jCf_Ol88Xw7nKeU';

// Detect the Chrome profile (Google account signed into this Chrome profile)
async function getChromeProfileEmail() {
  try {
    if (chrome.identity?.getProfileUserInfo) {
      const info = await chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' });
      if (info?.email) return info.email;
    }
  } catch (_) {
    // API not available or failed
  }
  return null;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';

  const supabaseUrl = SUPABASE_URL;
  const supabaseKey = SUPABASE_ANON_KEY;
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    // Store config first
    await chrome.storage.local.set({ supabaseUrl, supabaseAnonKey: supabaseKey });

    // Call Supabase auth REST API directly
    const res = await fetch(supabaseUrl + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error_description || data.msg || 'Login failed');
    }

    await chrome.storage.local.set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      userId: data.user.id,
    });

    // Auto-detect Chrome profile and save it
    try {
      const chromeEmail = await getChromeProfileEmail();
      const profileName = chromeEmail || email;
      await chrome.storage.local.set({
        chromeProfile: profileName,
        chromeProfileEmail: profileName,
      });
      // Save actual Chrome profile name/email to DB
      await fetch(supabaseUrl + '/rest/v1/OS_profiles?id=eq.' + data.user.id, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + data.access_token,
        },
        body: JSON.stringify({ chrome_profile: profileName }),
      });
    } catch (_) {
      // Non-critical — don't block login
    }

    // Tell service worker to start a new session
    chrome.runtime.sendMessage({ type: 'START_SESSION' }, () => {
      showDashboard();
    });
  } catch (err) {
    loginError.textContent = err.message;
    loginError.style.display = 'block';
  }
});

logoutBtn.addEventListener('click', async () => {
  // Wait for session to end (syncs to DB) BEFORE clearing storage
  await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'END_SESSION' }, () => resolve());
  });
  await chrome.storage.local.clear();
  showLogin();
});

init();
