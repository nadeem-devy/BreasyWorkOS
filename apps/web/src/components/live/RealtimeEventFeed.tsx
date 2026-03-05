'use client';

import AppBadge from '@/components/shared/AppBadge';
import { format } from 'date-fns';
import type { RealtimeEvent } from '@/lib/hooks/useRealtimeEvents';

export default function RealtimeEventFeed({ events }: { events: RealtimeEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-400">
        Waiting for events...
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-center gap-3 border-b border-gray-50 px-3 py-2 text-sm last:border-0"
        >
          <span className="w-16 shrink-0 text-xs text-gray-400">
            {format(new Date(event.created_at), 'HH:mm:ss')}
          </span>
          <AppBadge app={event.source} />
          <span className="truncate text-gray-700">{event.description}</span>
          {event.wo_id && (
            <span className="shrink-0 text-xs font-medium text-blue-600">
              {event.wo_id}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
