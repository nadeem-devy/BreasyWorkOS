import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createServiceClient();
  const dateParam = request.nextUrl.searchParams.get('date');
  let since: string;
  let until: string | null = null;
  if (dateParam) {
    since = `${dateParam}T00:00:00Z`;
    until = `${dateParam}T23:59:59Z`;
  } else {
    since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  }

  let dQ = supabase.from('OS_dialpad_events').select('id, event_type, user_id, direction, duration_seconds, contact_name, created_at').gte('created_at', since);
  let bQ = supabase.from('OS_bubble_events').select('id, event_type, user_id, wo_id, new_value, vendor_name, created_at').gte('created_at', since);
  let gQ = supabase.from('OS_gmail_events').select('id, event_type, user_id, direction, created_at').gte('created_at', since);
  if (until) {
    dQ = dQ.lte('created_at', until);
    bQ = bQ.lte('created_at', until);
    gQ = gQ.lte('created_at', until);
  }
  const [dialpad, bubble, gmail] = await Promise.all([
    dQ.order('created_at', { ascending: false }).limit(50),
    bQ.order('created_at', { ascending: false }).limit(50),
    gQ.order('created_at', { ascending: false }).limit(50),
  ]);

  // Get profile names
  const { data: profiles } = await supabase.from('OS_profiles').select('id, full_name');
  const nameMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    nameMap[p.id] = p.full_name;
  }

  const events: Array<{
    id: string;
    source: string;
    event_type: string;
    user_id: string;
    user_name: string;
    description: string;
    wo_id?: string;
    created_at: string;
  }> = [];

  for (const row of dialpad.data ?? []) {
    const dur = row.duration_seconds
      ? ` (${Math.floor(row.duration_seconds / 60)}m ${row.duration_seconds % 60}s)`
      : '';
    const contact = row.contact_name ? ` - ${row.contact_name}` : '';
    events.push({
      id: `dialpad-${row.id}`,
      source: 'dialpad',
      event_type: row.event_type,
      user_id: row.user_id,
      user_name: nameMap[row.user_id] ?? 'Unknown',
      description: `Call ${row.event_type === 'call_ended' ? 'ended' : row.event_type === 'call_missed' ? 'missed' : 'started'}${dur}${contact}`,
      created_at: row.created_at,
    });
  }

  for (const row of bubble.data ?? []) {
    const type = row.event_type;
    const wo = row.wo_id ?? '';
    let desc = `${type.replace(/_/g, ' ')} on ${wo}`;
    if (type === 'wo_status_changed') desc = `WO Status Changed ${wo} → ${row.new_value}`;
    else if (type === 'wo_created') desc = `WO Created ${wo}`;
    else if (type === 'vendor_assigned') desc = `Vendor Assigned: ${row.vendor_name} on ${wo}`;
    events.push({
      id: `bubble-${row.id}`,
      source: 'bubble',
      event_type: row.event_type,
      user_id: row.user_id,
      user_name: nameMap[row.user_id] ?? 'Unknown',
      description: desc,
      wo_id: row.wo_id,
      created_at: row.created_at,
    });
  }

  for (const row of gmail.data ?? []) {
    events.push({
      id: `gmail-${row.id}`,
      source: 'gmail',
      event_type: row.event_type,
      user_id: row.user_id,
      user_name: nameMap[row.user_id] ?? 'Unknown',
      description: `Email ${row.direction === 'outbound' ? 'sent' : 'received'}`,
      created_at: row.created_at,
    });
  }

  events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json(events.slice(0, 50));
}
