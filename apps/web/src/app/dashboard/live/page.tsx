'use client';

import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import ActiveUsersGrid from '@/components/live/ActiveUsersGrid';
import RealtimeEventFeed from '@/components/live/RealtimeEventFeed';
import { useActiveUsers } from '@/lib/hooks/useActiveUsers';
import { useRealtimeEvents } from '@/lib/hooks/useRealtimeEvents';
import { Radio } from 'lucide-react';
import { useEffect, useState } from 'react';

function LiveViewContent() {
  const { users, loading, activeCount, idleCount, offlineCount } = useActiveUsers();
  const events = useRealtimeEvents(100);
  const [flagCounts, setFlagCounts] = useState<Record<string, number>>({});

  // Fetch today's activity flags
  useEffect(() => {
    fetch('/api/admin/activity-flags?reviewed=false')
      .then((res) => res.json())
      .then((flags) => {
        if (!Array.isArray(flags)) return;
        const counts: Record<string, number> = {};
        for (const f of flags) {
          counts[f.user_id] = (counts[f.user_id] ?? 0) + 1;
        }
        setFlagCounts(counts);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={20} className="text-green-500" />
          <h1 className="text-lg font-semibold text-gray-900">Live View</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Active: {activeCount}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            Idle: {idleCount}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gray-300" />
            Offline: {offlineCount}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">
          Loading users...
        </div>
      ) : (
        <ActiveUsersGrid users={users} flagCounts={flagCounts} />
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-600">Real-Time Event Feed</h2>
        <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white">
          <RealtimeEventFeed events={events} />
        </div>
      </div>
    </div>
  );
}

export default function LiveViewPage() {
  return (
    <SupabaseProvider>
      <LiveViewContent />
    </SupabaseProvider>
  );
}
