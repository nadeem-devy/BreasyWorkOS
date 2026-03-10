'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';

export interface ActiveUser {
  userId: string;
  fullName: string;
  role: string;
  market: string | null;
  avatarUrl: string | null;
  status: string;
  currentApp: string | null;
  currentUrl: string | null;
  lastActivityAt: string | null;
  sessionStarted: string | null;
  timeBubble: number;
  timeGmail: number;
  timeDialpad: number;
  timeMelio: number;
  sessionCount: number;
}

export function useActiveUsers() {
  const supabase = useSupabase();
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [{ data, error }, { data: profiles }, { data: sessionCounts }] = await Promise.all([
      supabase.from('v_user_current_status').select('*'),
      supabase.from('OS_profiles').select('id, avatar_url'),
      supabase.from('OS_sessions').select('user_id').gte('started_at', `${today}T00:00:00`),
    ]);

    if (!error && data) {
      // Build avatar map
      const avatarMap: Record<string, string | null> = {};
      for (const p of profiles ?? []) avatarMap[p.id] = p.avatar_url;

      // Build session count map for today
      const sessionCountMap: Record<string, number> = {};
      for (const s of sessionCounts ?? []) {
        sessionCountMap[s.user_id] = (sessionCountMap[s.user_id] ?? 0) + 1;
      }

      // Deduplicate by user_id (view can return duplicates)
      const seen = new Set<string>();
      const unique = data.filter((row: Record<string, unknown>) => {
        const id = row.user_id as string;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setUsers(
        unique.map((row: Record<string, unknown>) => ({
          userId: row.user_id as string,
          fullName: row.full_name as string,
          role: row.role as string,
          market: row.market as string | null,
          avatarUrl: avatarMap[row.user_id as string] ?? null,
          status: row.status as string,
          currentApp: row.current_app as string | null,
          currentUrl: row.current_url as string | null,
          lastActivityAt: row.last_activity_at as string | null,
          sessionStarted: row.session_started as string | null,
          timeBubble: (row.time_bubble as number) ?? 0,
          timeGmail: (row.time_gmail as number) ?? 0,
          timeDialpad: (row.time_dialpad as number) ?? 0,
          timeMelio: (row.time_melio as number) ?? 0,
          sessionCount: sessionCountMap[row.user_id as string] ?? 0,
        }))
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUsers, 30_000);

    // Also subscribe to activity events for immediate updates
    const channel = supabase
      .channel('active_users_refresh')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'OS_activity_events' },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchUsers]);

  const activeCount = users.filter((u) => u.status === 'active').length;
  const idleCount = users.filter((u) => u.status === 'idle').length;
  const offlineCount = users.filter((u) => u.status === 'offline').length;

  return { users, loading, activeCount, idleCount, offlineCount };
}
