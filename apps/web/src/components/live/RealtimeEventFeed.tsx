'use client';

import AppBadge from '@/components/shared/AppBadge';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import type { RealtimeEvent } from '@/lib/hooks/useRealtimeEvents';

function EventRow({ event, isNew }: { event: RealtimeEvent; isNew: boolean }) {
  const [visible, setVisible] = useState(!isNew);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNew) {
      // Trigger animation on next frame
      requestAnimationFrame(() => setVisible(true));
    }
  }, [isNew]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-3 border-b border-gray-50 px-3 py-2 text-sm last:border-0 transition-all duration-500 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-40px)',
      }}
    >
      <span className="w-16 shrink-0 text-xs text-gray-400">
        {format(new Date(event.created_at), 'HH:mm:ss')}
      </span>
      <AppBadge app={event.source} />
      {event.user_name && (
        <span className="shrink-0 text-xs font-medium text-gray-500">
          {event.user_name}
        </span>
      )}
      <span className="truncate text-gray-700">{event.description}</span>
      {event.wo_id && (
        <span className="shrink-0 text-xs font-medium text-blue-600">
          {event.wo_id}
        </span>
      )}
    </div>
  );
}

export default function RealtimeEventFeed({ events }: { events: RealtimeEvent[] }) {
  const seenIds = useRef(new Set<string>());
  const initialLoad = useRef(true);

  // On first render, mark all current events as "seen" so they don't animate
  useEffect(() => {
    if (initialLoad.current) {
      for (const e of events) seenIds.current.add(e.id);
      initialLoad.current = false;
    }
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-400">
        Waiting for events...
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event) => {
        const isNew = !seenIds.current.has(event.id);
        if (isNew) seenIds.current.add(event.id);
        return <EventRow key={event.id} event={event} isNew={isNew} />;
      })}
    </div>
  );
}
