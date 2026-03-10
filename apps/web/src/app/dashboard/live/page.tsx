'use client';

import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import ActiveUsersGrid from '@/components/live/ActiveUsersGrid';
import RealtimeEventFeed from '@/components/live/RealtimeEventFeed';
import { useActiveUsers } from '@/lib/hooks/useActiveUsers';
import { useRealtimeEvents } from '@/lib/hooks/useRealtimeEvents';
import CallBreakdownCharts from '@/components/live/CallBreakdownCharts';
import { Radio } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState, useCallback } from 'react';
import type { RealtimeEvent } from '@/lib/hooks/useRealtimeEvents';

function LiveViewContent() {
  const { users, loading, activeCount, idleCount, offlineCount } = useActiveUsers();
  const realtimeEvents = useRealtimeEvents(100);
  const [preloadedEvents, setPreloadedEvents] = useState<RealtimeEvent[]>([]);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isToday = selectedDate === todayStr;

  // Pre-load recent events from API (Dialpad, Bubble, Gmail)
  const loadRecentEvents = useCallback(() => {
    const dateParam = isToday ? '' : `?date=${selectedDate}`;
    fetch(`/api/admin/recent-events${dateParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPreloadedEvents(data);
        }
      })
      .catch(() => {});
  }, [selectedDate, isToday]);

  useEffect(() => {
    loadRecentEvents();
    // Refresh every 60 seconds
    const interval = setInterval(loadRecentEvents, 60_000);
    return () => clearInterval(interval);
  }, [loadRecentEvents]);

  // Merge realtime events (from WebSocket) with preloaded events
  // Only include realtime WS events when viewing today
  const allEvents = (() => {
    const ids = new Set<string>();
    const merged: RealtimeEvent[] = [];
    const sources = isToday ? [...realtimeEvents, ...preloadedEvents] : preloadedEvents;
    for (const e of sources) {
      if (ids.has(e.id)) continue;
      ids.add(e.id);
      merged.push(e);
    }
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return merged.slice(0, 100);
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio size={20} className="text-green-500" />
          <h1 className="text-lg font-semibold text-gray-900">Live View</h1>
          <input
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={(e) => setSelectedDate(e.target.value || todayStr)}
            className="rounded-lg border border-gray-300 px-2.5 py-1 text-sm text-gray-700"
          />
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
            >
              Back to Today
            </button>
          )}
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
        <ActiveUsersGrid users={users} />
      )}

      <CallBreakdownCharts date={isToday ? null : selectedDate} />

      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-600">
          {isToday ? 'Real-Time Event Feed' : `Event Feed — ${selectedDate}`}
        </h2>
        <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white">
          <RealtimeEventFeed events={allEvents} />
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
