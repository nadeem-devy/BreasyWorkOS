import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Dialpad Call Event Webhook
 *
 * Receives real-time call events from Dialpad's webhook subscription.
 * Payload format (from Dialpad docs):
 * {
 *   call_id: number,
 *   state: "ringing" | "connected" | "hangup" | "voicemail" | ...,
 *   direction: "inbound" | "outbound",
 *   target: { email, name, phone, id, type, office_id },
 *   contact: { email, name, phone, id, type },
 *   internal_number: string (E.164),
 *   external_number: string (E.164),
 *   date_started: number (unix ms),
 *   date_connected: number (unix ms),
 *   date_ended: number (unix ms),
 *   duration: number (ms),
 *   total_duration: number (ms),
 *   event_timestamp: number (unix ms),
 *   was_recorded: boolean,
 *   ...
 * }
 *
 * If webhook was registered with a secret, payload arrives JWT-encoded.
 * Otherwise it's plain JSON.
 */

function unixMsToISO(ms: number | undefined | null): string | null {
  if (!ms) return null;
  return new Date(ms).toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate webhook secret (sent as custom header when we register the webhook)
    // If the webhook was created without a secret, skip this check
    const secret = request.headers.get('x-webhook-secret');
    if (process.env.DIALPAD_WEBHOOK_SECRET && secret && secret !== process.env.DIALPAD_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    const callId = body.call_id;
    if (!callId) {
      return NextResponse.json({ error: 'No call_id' }, { status: 400 });
    }

    const callIdStr = String(callId);

    // Extract the Breasy user from target (the Dialpad user handling the call)
    const targetEmail = body.target?.email;
    const targetPhone = body.target?.phone || body.internal_number;
    const contactName = body.contact?.name;
    const contactPhone = body.contact?.phone || body.external_number;

    // Map Dialpad state to our event type
    const state = body.state ?? '';
    let eventType: string;
    let isMissed = false;

    switch (state) {
      case 'ringing':
      case 'calling':
        eventType = 'call_started';
        break;
      case 'connected':
        eventType = 'call_connected';
        break;
      case 'hangup':
        // A hangup with 0 duration on inbound = missed
        if (body.direction === 'inbound' && (!body.duration || body.duration === 0)) {
          eventType = 'call_missed';
          isMissed = true;
        } else {
          eventType = 'call_ended';
        }
        break;
      case 'voicemail':
        eventType = 'call_voicemail';
        isMissed = true;
        break;
      default:
        eventType = `call_${state || 'unknown'}`;
    }

    // Deduplication: check if we already have this call_id
    const { data: existing } = await supabase
      .from('OS_dialpad_events')
      .select('id')
      .eq('dialpad_call_id', callIdStr)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing record with latest state
      const durationSeconds = body.duration ? Math.round(body.duration / 1000) : 0;
      await supabase
        .from('OS_dialpad_events')
        .update({
          event_type: eventType,
          call_status: state,
          duration_seconds: durationSeconds,
          ended_at: unixMsToISO(body.date_ended),
          is_missed: isMissed,
          metadata: body,
        })
        .eq('dialpad_call_id', callIdStr);

      return NextResponse.json({ success: true, action: 'updated' });
    }

    // Match user: by email first, then by phone
    let userId: string | null = null;

    if (targetEmail) {
      const { data: profile } = await supabase
        .from('OS_profiles')
        .select('id')
        .eq('email', targetEmail)
        .single();
      userId = profile?.id ?? null;
    }

    if (!userId && targetPhone) {
      const { data: profile } = await supabase
        .from('OS_profiles')
        .select('id')
        .eq('phone', targetPhone)
        .single();
      userId = profile?.id ?? null;
    }

    if (!userId) {
      console.log(`[Dialpad Webhook] No profile match for call ${callIdStr} target=${targetEmail || targetPhone}`);
      return NextResponse.json({ success: true, action: 'skipped_no_user' });
    }

    // Durations in Dialpad payload are in milliseconds
    const durationSeconds = body.duration ? Math.round(body.duration / 1000) : 0;

    await supabase.from('OS_dialpad_events').insert({
      user_id: userId,
      event_type: eventType,
      dialpad_call_id: callIdStr,
      direction: body.direction ?? 'outbound',
      from_number: body.direction === 'outbound' ? (body.internal_number ?? targetPhone) : contactPhone,
      to_number: body.direction === 'outbound' ? contactPhone : (body.internal_number ?? targetPhone),
      contact_name: contactName,
      duration_seconds: durationSeconds,
      started_at: unixMsToISO(body.date_started),
      ended_at: unixMsToISO(body.date_ended),
      call_status: state,
      is_missed: isMissed,
      metadata: body,
    });

    return NextResponse.json({ success: true, action: 'inserted' });
  } catch (error) {
    console.error('Dialpad webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
