import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createServiceClient();
  const dateParam = request.nextUrl.searchParams.get('date');
  const days = Number(request.nextUrl.searchParams.get('days') ?? '7');
  let since: string;
  let until: string | null = null;
  if (dateParam) {
    since = `${dateParam}T00:00:00Z`;
    until = `${dateParam}T23:59:59Z`;
  } else {
    since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }

  // Get all calls in the period
  let query = supabase
    .from('OS_dialpad_events')
    .select('user_id, event_type, direction, duration_seconds, is_missed, started_at')
    .gte('started_at', since);
  if (until) query = query.lte('started_at', until);
  const { data: calls } = await query.order('started_at', { ascending: true });

  // Get profile names
  const { data: profiles } = await supabase.from('OS_profiles').select('id, full_name');
  const nameMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    nameMap[p.id] = p.full_name;
  }

  if (!calls || calls.length === 0) {
    return NextResponse.json({
      perUser: [],
      perDay: [],
      perHour: [],
      summary: { totalCalls: 0, totalTalkTime: 0, avgDuration: 0, missedCalls: 0 },
    });
  }

  // Per-user breakdown
  const userStats: Record<string, { calls: number; talkTime: number; missed: number; inbound: number; outbound: number }> = {};
  for (const c of calls) {
    const uid = c.user_id;
    if (!userStats[uid]) userStats[uid] = { calls: 0, talkTime: 0, missed: 0, inbound: 0, outbound: 0 };
    userStats[uid].calls++;
    userStats[uid].talkTime += c.duration_seconds ?? 0;
    if (c.is_missed) userStats[uid].missed++;
    if (c.direction === 'inbound') userStats[uid].inbound++;
    else userStats[uid].outbound++;
  }

  const perUser = Object.entries(userStats)
    .map(([uid, s]) => ({
      name: nameMap[uid] ?? 'Unknown',
      calls: s.calls,
      talkTime: Math.round(s.talkTime / 60),
      missed: s.missed,
      inbound: s.inbound,
      outbound: s.outbound,
    }))
    .sort((a, b) => b.calls - a.calls);

  // Per-day breakdown
  const dayStats: Record<string, { calls: number; talkTime: number; missed: number }> = {};
  for (const c of calls) {
    const day = c.started_at.slice(0, 10);
    if (!dayStats[day]) dayStats[day] = { calls: 0, talkTime: 0, missed: 0 };
    dayStats[day].calls++;
    dayStats[day].talkTime += c.duration_seconds ?? 0;
    if (c.is_missed) dayStats[day].missed++;
  }

  const perDay = Object.entries(dayStats)
    .map(([date, s]) => ({
      date,
      label: new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      calls: s.calls,
      talkTime: Math.round(s.talkTime / 60),
      missed: s.missed,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Per-hour breakdown (for selected date or today)
  const todayStr = dateParam ?? new Date().toISOString().slice(0, 10);
  const hourStats: Record<number, { calls: number; talkTime: number }> = {};
  for (const c of calls) {
    if (!c.started_at.startsWith(todayStr)) continue;
    const hour = new Date(c.started_at).getUTCHours();
    if (!hourStats[hour]) hourStats[hour] = { calls: 0, talkTime: 0 };
    hourStats[hour].calls++;
    hourStats[hour].talkTime += c.duration_seconds ?? 0;
  }

  const perHour = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    calls: hourStats[i]?.calls ?? 0,
    talkTime: Math.round((hourStats[i]?.talkTime ?? 0) / 60),
  }));

  // Summary
  const totalCalls = calls.length;
  const totalTalkTime = calls.reduce((s, c) => s + (c.duration_seconds ?? 0), 0);
  const missedCalls = calls.filter((c) => c.is_missed).length;

  return NextResponse.json({
    perUser,
    perDay,
    perHour,
    summary: {
      totalCalls,
      totalTalkTime: Math.round(totalTalkTime / 60),
      avgDuration: totalCalls > 0 ? Math.round(totalTalkTime / totalCalls) : 0,
      missedCalls,
    },
  });
}
