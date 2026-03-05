const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const currentAppEl = document.getElementById('current-app');
const sessionTimeEl = document.getElementById('session-time');
const bufferCountEl = document.getElementById('buffer-count');
const appBarsEl = document.getElementById('app-bars');

const APP_COLORS = { bubble: '#3B82F6', gmail: '#EF4444', dialpad: '#8B5CF6', melio: '#10B981' };
const APP_NAMES = { bubble: 'Bubble', gmail: 'Gmail', dialpad: 'Dialpad', melio: 'Melio', other: 'Other' };

async function init() {
  const { userId } = await chrome.storage.local.get('userId');

  if (userId) {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginView.style.display = 'block';
  dashboardView.style.display = 'none';
  logoutBtn.style.display = 'none';
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

async function showDashboard() {
  loginView.style.display = 'none';
  dashboardView.style.display = 'block';
  logoutBtn.style.display = 'block';

  // Get status from service worker
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (!response) return;

    const state = response.idleState === 'active' ? 'active' : response.idleState === 'idle' ? 'idle' : 'offline';
    statusDot.className = 'status-dot ' + state;
    statusText.textContent = state.charAt(0).toUpperCase() + state.slice(1);
    currentAppEl.textContent = APP_NAMES[response.currentApp] || '\u2014';
  });

  // Get session info
  const { currentSession } = await chrome.storage.local.get('currentSession');
  if (currentSession && currentSession.startedAt) {
    const elapsed = Math.floor((Date.now() - new Date(currentSession.startedAt).getTime()) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    sessionTimeEl.textContent = h > 0 ? h + 'h ' + m + 'm' : m + 'm';

    // App time bars (using safe DOM methods)
    const timers = currentSession.timers || {};
    const maxTime = Math.max(1, ...Object.values(timers));

    appBarsEl.replaceChildren(); // Clear safely
    for (const [app, seconds] of Object.entries(timers)) {
      if (app === 'other') continue;
      appBarsEl.appendChild(createAppBar(app, seconds, maxTime));
    }
  }

  // Get buffer size
  const { eventBuffer } = await chrome.storage.local.get('eventBuffer');
  bufferCountEl.textContent = String((eventBuffer || []).length);
}

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

    showDashboard();
  } catch (err) {
    loginError.textContent = err.message;
    loginError.style.display = 'block';
  }
});

logoutBtn.addEventListener('click', async () => {
  chrome.runtime.sendMessage({ type: 'END_SESSION' });
  await chrome.storage.local.clear();
  showLogin();
});

init();
