import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createServiceClient();
  const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const period = request.nextUrl.searchParams.get('period') ?? 'day';

  // Support explicit startDate/endDate override (date range filter)
  const defaultStart = period === 'day'
    ? date
    : period === 'week'
      ? new Date(new Date(date).getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : new Date(new Date(date).getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const startDate = request.nextUrl.searchParams.get('startDate') ?? defaultStart;
  const endDate = request.nextUrl.searchParams.get('endDate') ?? date;

  const { data: profiles } = await supabase
    .from('OS_profiles')
    .select('id, full_name')
    .eq('is_active', true);

  if (!profiles) {
    return NextResponse.json({ rows: [], users: [] });
  }

  interface AllocationRow {
    user_id: string;
    full_name: string;
    bubble: number;
    gmail: number;
    dialpad: number;
    melio: number;
    other: number;
    idle: number;
    total: number;
    session_count: number;
    first_start: string | null;
    last_end: string | null;
  }

  // Fetch Dialpad API call durations per user for the date range
  const { data: dialpadCalls } = await supabase
    .from('OS_dialpad_events')
    .select('user_id, duration_seconds')
    .gte('started_at', `${startDate}T00:00:00`)
    .lte('started_at', `${endDate}T23:59:59`);

  const dialpadApiSeconds: Record<string, number> = {};
  for (const c of dialpadCalls ?? []) {
    dialpadApiSeconds[c.user_id] = (dialpadApiSeconds[c.user_id] ?? 0) + (c.duration_seconds ?? 0);
  }

  const rows: AllocationRow[] = [];
  for (const profile of profiles) {
    const { data: sessions } = await supabase
      .from('OS_sessions')
      .select('started_at, ended_at, time_bubble, time_gmail, time_dialpad, time_melio, time_other, time_idle, duration_seconds')
      .order('started_at', { ascending: true })
      .eq('user_id', profile.id)
      .gte('started_at', `${startDate}T00:00:00`)
      .lte('started_at', `${endDate}T23:59:59`);

    if (sessions && sessions.length > 0) {
      const totals = sessions.reduce(
        (acc, s) => ({
          bubble: acc.bubble + (s.time_bubble ?? 0),
          gmail: acc.gmail + (s.time_gmail ?? 0),
          dialpad: acc.dialpad + (s.time_dialpad ?? 0),
          melio: acc.melio + (s.time_melio ?? 0),
          other: acc.other + (s.time_other ?? 0),
          idle: acc.idle + (s.time_idle ?? 0),
          total: acc.total + (s.duration_seconds ?? 0),
        }),
        { bubble: 0, gmail: 0, dialpad: 0, melio: 0, other: 0, idle: 0, total: 0 }
      );

      // Use the higher of extension-tracked vs Dialpad API call duration
      const apiDialpad = dialpadApiSeconds[profile.id] ?? 0;
      if (apiDialpad > totals.dialpad) {
        totals.dialpad = apiDialpad;
      }

      const firstStart = sessions[0]?.started_at ?? null;
      const lastEnd = sessions[sessions.length - 1]?.ended_at ?? null;
      rows.push({ user_id: profile.id, full_name: profile.full_name, ...totals, session_count: sessions.length, first_start: firstStart, last_end: lastEnd });
    }
  }

  rows.sort((a, b) => b.total - a.total);

  return NextResponse.json({ rows, users: profiles });
}
