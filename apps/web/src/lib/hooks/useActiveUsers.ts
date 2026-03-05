'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';

export interface ActiveUser {
  userId: string;
  fullName: string;
  role: string;
  market: string | null;
  status: string;
  currentApp: string | null;
  currentUrl: string | null;
  lastActivityAt: string | null;
  sessionStarted: string | null;
  timeBubble: number;
  timeGmail: number;
  timeDialpad: number;
  timeMelio: number;
}

export function useActiveUsers() {
  const supabase = useSupabase();
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('v_user_current_status')
      .select('*');

    if (!error && data) {
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
          status: row.status as string,
          currentApp: row.current_app as string | null,
          currentUrl: row.current_url as string | null,
          lastActivityAt: row.last_activity_at as string | null,
          sessionStarted: row.session_started as string | null,
          timeBubble: (row.time_bubble as number) ?? 0,
          timeGmail: (row.time_gmail as number) ?? 0,
          timeDialpad: (row.time_dialpad as number) ?? 0,
          timeMelio: (row.time_melio as number) ?? 0,
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
