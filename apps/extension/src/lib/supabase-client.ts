import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export async function getSupabase(): Promise<SupabaseClient | null> {
  const config = await chrome.storage.local.get(['supabaseUrl', 'supabaseAnonKey', 'accessToken', 'refreshToken']);

  if (!config.supabaseUrl || !config.supabaseAnonKey || !config.accessToken) return null;

  // Recreate client if not yet initialized (service worker may have restarted)
  if (!supabaseInstance) {
    supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        storage: {
          getItem: async (key) => {
            const result = await chrome.storage.local.get(key);
            return result[key] ?? null;
          },
          setItem: async (key, value) => {
            await chrome.storage.local.set({ [key]: value });
          },
          removeItem: async (key) => {
            await chrome.storage.local.remove(key);
          },
        },
        autoRefreshToken: true,
        persistSession: true,
      },
    });
  }

  // Always restore session with latest tokens
  if (config.accessToken && config.refreshToken) {
    await supabaseInstance.auth.setSession({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });
  }

  return supabaseInstance;
}

export async function getUserId(): Promise<string | null> {
  const result = await chrome.storage.local.get('userId');
  return result.userId ?? null;
}

export async function saveAuthTokens(accessToken: string, refreshToken: string, userId: string) {
  await chrome.storage.local.set({ accessToken, refreshToken, userId });
}

export async function clearAuth() {
  supabaseInstance = null;
  await chrome.storage.local.remove(['accessToken', 'refreshToken', 'userId']);
}
