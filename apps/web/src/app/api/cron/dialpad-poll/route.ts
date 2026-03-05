import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  requestCallStats,
  pollStatsRequest,
  downloadCallStats,
} from '@/lib/integrations/dialpad';

// Vercel Cron: runs every 5 minutes to poll Dialpad for recent call logs
// Dialpad stats API is async: POST request → poll → download CSV

export const maxDuration = 60; // Allow up to 60s for async stats export

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.DIALPAD_API_KEY) {
    return NextResponse.json({ error: 'Dialpad API key not configured' }, { status: 500 });
  }

  try {
    const supabase = await createServiceClient();

    // Request last 1 day of call stats (handles overlap via deduplication)
    const requestId = await requestCallStats(1);
    const downloadUrl = await pollStatsRequest(requestId, 45000);
    const calls = await downloadCallStats(downloadUrl);

    if (calls.length === 0) {
      return NextResponse.json({ message: 'No calls found' });
    }

    // Build email→profile and phone→profile lookups
    const emails = [...new Set(calls.map((c) => c.email).filter(Boolean))];
    const phones = [...new Set(calls.map((c) => c.internalNumber).filter(Boolean))];

    const { data: allProfiles } = await supabase
      .from('OS_profiles')
      .select('id, email, phone');

    const emailToProfileId = new Map<string, string>();
    const phoneToProfileId = new Map<string, string>();
    for (const p of allProfiles ?? []) {
      emailToProfileId.set(p.email, p.id);
      if (p.phone) phoneToProfileId.set(p.phone, p.id);
    }

    // Get existing call IDs for deduplication
    const callIds = calls.map((c) => c.callId);
    const { data: existingEvents } = await supabase
      .from('OS_dialpad_events')
      .select('dialpad_call_id')
      .in('dialpad_call_id', callIds);

    const existingCallIds = new Set((existingEvents ?? []).map((e) => e.dialpad_call_id));

    let inserted = 0;
    let skippedNoUser = 0;

    for (const call of calls) {
      if (existingCallIds.has(call.callId)) continue;

      // Match by email first, then by phone (handles mismatched emails like David)
      const userId = emailToProfileId.get(call.email) ?? phoneToProfileId.get(call.internalNumber);
      if (!userId) {
        skippedNoUser++;
        continue;
      }

      const eventType = call.isMissed
        ? 'call_missed'
        : call.voicemail
          ? 'call_voicemail'
          : call.durationSeconds > 0
            ? 'call_ended'
            : 'call_started';

      const fromNumber = call.direction === 'outbound' ? call.internalNumber : call.externalNumber;
      const toNumber = call.direction === 'outbound' ? call.externalNumber : call.internalNumber;

      await supabase.from('OS_dialpad_events').insert({
        user_id: userId,
        event_type: eventType,
        dialpad_call_id: call.callId,
        direction: call.direction,
        from_number: fromNumber,
        to_number: toNumber,
        contact_name: call.metadata.external_name ?? null,
        duration_seconds: call.durationSeconds,
        started_at: call.dateStarted,
        ended_at: call.dateEnded,
        call_status: call.categories.join(','),
        is_missed: call.isMissed,
        metadata: call.metadata,
      });

      inserted++;
    }

    return NextResponse.json({
      message: 'Dialpad poll complete',
      total_calls: calls.length,
      inserted,
      skipped_no_user: skippedNoUser,
      skipped_duplicate: calls.length - inserted - skippedNoUser,
    });
  } catch (error) {
    console.error('Dialpad poll error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
