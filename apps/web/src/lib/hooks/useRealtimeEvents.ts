'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';

export interface RealtimeEvent {
  id: string;
  source: string;
  event_type: string;
  user_id: string;
  user_name?: string;
  description: string;
  wo_id?: string;
  created_at: string;
}

export function useRealtimeEvents(limit = 50) {
  const supabase = useSupabase();
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  const addEvent = useCallback((event: RealtimeEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, limit));
  }, [limit]);

  useEffect(() => {
    // Subscribe to bubble events
    const bubbleSub = supabase
      .channel('bubble_events_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'OS_bubble_events' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          addEvent({
            id: `bubble-${row.id}`,
            source: 'bubble',
            event_type: row.event_type as string,
            user_id: row.user_id as string,
            description: formatBubbleEvent(row),
            wo_id: row.wo_id as string,
            created_at: row.created_at as string,
          });
        }
      )
      .subscribe();

    // Subscribe to gmail events
    const gmailSub = supabase
      .channel('gmail_events_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'OS_gmail_events' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          addEvent({
            id: `gmail-${row.id}`,
            source: 'gmail',
            event_type: row.event_type as string,
            user_id: row.user_id as string,
            description: `Email ${row.direction === 'outbound' ? 'sent' : 'received'}`,
            created_at: row.created_at as string,
          });
        }
      )
      .subscribe();

    // Subscribe to dialpad events
    const dialpadSub = supabase
      .channel('dialpad_events_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'OS_dialpad_events' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const duration = row.duration_seconds
            ? ` (${Math.floor(Number(row.duration_seconds) / 60)}m ${Number(row.duration_seconds) % 60}s)`
            : '';
          addEvent({
            id: `dialpad-${row.id}`,
            source: 'dialpad',
            event_type: row.event_type as string,
            user_id: row.user_id as string,
            description: `Call ${row.event_type === 'call_ended' ? 'ended' : row.event_type === 'call_missed' ? 'missed' : 'started'}${duration}`,
            created_at: row.created_at as string,
          });
        }
      )
      .subscribe();

    // Subscribe to melio events
    const melioSub = supabase
      .channel('melio_events_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'OS_melio_events' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          addEvent({
            id: `melio-${row.id}`,
            source: 'melio',
            event_type: row.event_type as string,
            user_id: row.user_id as string,
            description: `Payment ${row.payment_status} - $${row.amount} to ${row.vendor_name}`,
            created_at: row.created_at as string,
          });
        }
      )
      .subscribe();

    // Subscribe to activity events (tab switches)
    const activitySub = supabase
      .channel('activity_events_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'OS_activity_events' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.event_type === 'tab_activated' || row.event_type === 'idle_start' || row.event_type === 'idle_end') {
            addEvent({
              id: `activity-${row.id}`,
              source: row.app as string,
              event_type: row.event_type as string,
              user_id: row.user_id as string,
              description: formatActivityEvent(row),
              created_at: row.created_at as string,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bubbleSub);
      supabase.removeChannel(gmailSub);
      supabase.removeChannel(dialpadSub);
      supabase.removeChannel(melioSub);
      supabase.removeChannel(activitySub);
    };
  }, [supabase, addEvent]);

  return events;
}

function formatBubbleEvent(row: Record<string, unknown>): string {
  const type = row.event_type as string;
  const wo = row.wo_id as string;
  switch (type) {
    case 'wo_status_changed':
      return `WO Status Changed ${wo} -> ${row.new_value}`;
    case 'wo_created':
      return `WO Created ${wo}`;
    case 'wo_opened':
      return `WO Opened ${wo}`;
    case 'vendor_assigned':
      return `Vendor Assigned: ${row.vendor_name} on ${wo}`;
    case 'note_added':
      return `Note Added on ${wo}`;
    case 'photo_uploaded':
      return `Photo Uploaded on ${wo}`;
    case 'quote_sent':
      return `Quote Sent on ${wo}`;
    case 'invoice_sent':
      return `Invoice Sent on ${wo}`;
    default:
      return `${type.replace(/_/g, ' ')} on ${wo}`;
  }
}

function formatActivityEvent(row: Record<string, unknown>): string {
  const type = row.event_type as string;
  if (type === 'idle_start') return 'Went idle';
  if (type === 'idle_end') return 'Back to active';
  const app = (row.app as string) ?? 'unknown';
  return `Switched to ${app.charAt(0).toUpperCase() + app.slice(1)}`;
}
