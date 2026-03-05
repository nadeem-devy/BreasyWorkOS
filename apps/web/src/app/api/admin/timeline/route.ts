import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
  const supabase = await createServiceClient();
  const userId = request.nextUrl.searchParams.get('userId');
  const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const filterUser = userId && userId !== 'all';

  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  // Get profile names
  const { data: profiles } = await supabase.from('OS_profiles').select('id, full_name').eq('is_active', true);
  const nameMap: Record<string, string> = {};
  for (const p of profiles ?? []) nameMap[p.id] = p.full_name;

  // Build queries
  let bubbleQ = supabase.from('OS_bubble_events').select('*').gte('created_at', startOfDay).lte('created_at', endOfDay);
  let financialQ = supabase.from('OS_bubble_financial_events').select('*').gte('created_at', startOfDay).lte('created_at', endOfDay);
  let gmailQ = supabase.from('OS_gmail_events').select('*').gte('created_at', startOfDay).lte('created_at', endOfDay);
  let dialpadQ = supabase.from('OS_dialpad_events').select('*').gte('started_at', startOfDay).lte('started_at', endOfDay);
  let melioQ = supabase.from('OS_melio_events').select('*').gte('created_at', startOfDay).lte('created_at', endOfDay);
  let activityQ = supabase.from('OS_activity_events').select('*').gte('created_at', startOfDay).lte('created_at', endOfDay).in('event_type', ['tab_activated', 'idle_start', 'idle_end']);
  let sessionsQ = supabase.from('OS_sessions').select('time_bubble, time_gmail, time_dialpad, time_melio, time_idle, time_other, duration_seconds, user_id').gte('started_at', startOfDay).lte('started_at', endOfDay);

  if (filterUser) {
    bubbleQ = bubbleQ.eq('user_id', userId);
    financialQ = financialQ.eq('user_id', userId);
    gmailQ = gmailQ.eq('user_id', userId);
    dialpadQ = dialpadQ.eq('user_id', userId);
    melioQ = melioQ.eq('user_id', userId);
    activityQ = activityQ.eq('user_id', userId);
    sessionsQ = sessionsQ.eq('user_id', userId);
  }

  const [bubble, financial, gmail, dialpad, melio, activity, sessions] = await Promise.all([
    bubbleQ.order('created_at'),
    financialQ.order('created_at'),
    gmailQ.order('created_at'),
    dialpadQ.order('started_at'),
    melioQ.order('created_at'),
    activityQ.order('created_at'),
    sessionsQ,
  ]);

  const sessionTimes = { bubble: 0, gmail: 0, dialpad: 0, melio: 0, idle: 0 };
  for (const s of (sessions.data ?? []) as any[]) {
    sessionTimes.bubble += s.time_bubble ?? 0;
    sessionTimes.gmail += s.time_gmail ?? 0;
    sessionTimes.dialpad += s.time_dialpad ?? 0;
    sessionTimes.melio += s.time_melio ?? 0;
    sessionTimes.idle += s.time_idle ?? 0;
  }

  const entries: any[] = [];

  for (const r of (bubble.data ?? []) as any[]) {
    entries.push({
      id: `b-${r.id}`, source: 'bubble', event_type: r.event_type,
      description: `${r.event_type.replace(/_/g, ' ')} on ${r.wo_id}`,
      user_name: nameMap[r.user_id] ?? 'Unknown',
      wo_id: r.wo_id, created_at: r.created_at, raw: r,
    });
  }
  for (const r of (financial.data ?? []) as any[]) {
    entries.push({
      id: `bf-${r.id}`, source: 'bubble', event_type: r.event_type,
      description: `${r.event_type.replace(/_/g, ' ')}${r.amount ? ` $${r.amount}` : ''} on ${r.wo_id}`,
      user_name: nameMap[r.user_id] ?? 'Unknown',
      wo_id: r.wo_id, created_at: r.created_at, amount: r.amount, raw: r,
    });
  }
  for (const r of (gmail.data ?? []) as any[]) {
    entries.push({
      id: `g-${r.id}`, source: 'gmail', event_type: r.event_type,
      description: `Email ${r.direction === 'outbound' ? 'sent' : 'received'}${r.subject_snippet ? `: ${r.subject_snippet}` : ''}`,
      user_name: nameMap[r.user_id] ?? 'Unknown',
      created_at: r.created_at, direction: r.direction, subject_snippet: r.subject_snippet, raw: r,
    });
  }
  for (const r of (dialpad.data ?? []) as any[]) {
    entries.push({
      id: `d-${r.id}`, source: 'dialpad', event_type: r.event_type,
      description: `Call ${r.event_type === 'call_ended' ? 'ended' : r.event_type === 'call_missed' ? 'missed' : r.event_type?.replace('call_', '')}${r.duration_seconds ? ` (${Math.floor(r.duration_seconds / 60)}m ${r.duration_seconds % 60}s)` : ''}${r.contact_name ? ` - ${r.contact_name}` : ''}`,
      user_name: nameMap[r.user_id] ?? 'Unknown',
      created_at: r.started_at || r.created_at, duration_seconds: r.duration_seconds,
      direction: r.direction, contact_name: r.contact_name, raw: r,
    });
  }
  for (const r of (melio.data ?? []) as any[]) {
    entries.push({
      id: `m-${r.id}`, source: 'melio', event_type: r.event_type,
      description: `Payment ${r.payment_status} - $${r.amount} to ${r.vendor_name}`,
      user_name: nameMap[r.user_id] ?? 'Unknown',
      created_at: r.created_at, amount: r.amount, raw: r,
    });
  }
  for (const r of (activity.data ?? []) as any[]) {
    entries.push({
      id: `a-${r.id}`, source: r.app ?? 'other', event_type: r.event_type,
      description: r.event_type === 'idle_start' ? 'Went idle' : r.event_type === 'idle_end' ? 'Back to active' : `Switched to ${r.app}`,
      user_name: nameMap[r.user_id] ?? 'Unknown',
      created_at: r.created_at, raw: r,
    });
  }

  entries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return NextResponse.json({ entries, sessionTimes, users: profiles ?? [] });
}
