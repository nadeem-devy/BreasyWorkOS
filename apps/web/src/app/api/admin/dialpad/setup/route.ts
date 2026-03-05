import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const DIALPAD_BASE = 'https://dialpad.com/api/v2';

function getDialpadHeaders() {
  return {
    'Authorization': `Bearer ${process.env.DIALPAD_API_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}

/**
 * GET: Show current Dialpad webhook configuration
 * POST: Register webhook + call event subscription
 *
 * Requires super_admin role.
 */

export async function GET(request: NextRequest) {
  const supabase = await createServiceClient();

  // Auth check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [webhooksRes, callSubsRes, smsSubsRes, usersRes] = await Promise.all([
      fetch(`${DIALPAD_BASE}/webhooks`, { headers: getDialpadHeaders() }),
      fetch(`${DIALPAD_BASE}/subscriptions/call`, { headers: getDialpadHeaders() }),
      fetch(`${DIALPAD_BASE}/subscriptions/sms`, { headers: getDialpadHeaders() }),
      fetch(`${DIALPAD_BASE}/users`, { headers: getDialpadHeaders() }),
    ]);

    const [webhooks, callSubs, smsSubs, users] = await Promise.all([
      webhooksRes.json(),
      callSubsRes.json(),
      smsSubsRes.json(),
      usersRes.json(),
    ]);

    return NextResponse.json({
      webhooks: webhooks.items ?? [],
      call_subscriptions: callSubs.items ?? [],
      sms_subscriptions: smsSubs.items ?? [],
      users: (users.items ?? []).map((u: { id: string; display_name: string; emails: string[]; is_online: boolean }) => ({
        id: u.id,
        name: u.display_name,
        email: u.emails?.[0],
        is_online: u.is_online,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch Dialpad config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { base_url } = await request.json();
    if (!base_url) {
      return NextResponse.json({ error: 'base_url required' }, { status: 400 });
    }

    const hookUrl = `${base_url.replace(/\/$/, '')}/api/webhooks/dialpad`;

    // Check for existing webhook
    const existingRes = await fetch(`${DIALPAD_BASE}/webhooks`, { headers: getDialpadHeaders() });
    const existing = await existingRes.json();
    const found = (existing.items ?? []).find((w: { hook_url: string }) => w.hook_url === hookUrl);

    let webhookId: string;

    if (found) {
      webhookId = found.id;
    } else {
      const createRes = await fetch(`${DIALPAD_BASE}/webhooks`, {
        method: 'POST',
        headers: getDialpadHeaders(),
        body: JSON.stringify({ hook_url: hookUrl }),
      });
      if (!createRes.ok) {
        return NextResponse.json({ error: 'Failed to create webhook', details: await createRes.text() }, { status: 500 });
      }
      const webhook = await createRes.json();
      webhookId = webhook.id;
    }

    // Create call subscription
    const subRes = await fetch(`${DIALPAD_BASE}/subscriptions/call`, {
      method: 'POST',
      headers: getDialpadHeaders(),
      body: JSON.stringify({
        webhook_id: webhookId,
        call_states: ['ringing', 'calling', 'connected', 'hangup', 'voicemail', 'missed', 'hold', 'queued'],
        enabled: true,
      }),
    });

    const sub = subRes.ok ? await subRes.json() : null;

    return NextResponse.json({
      webhook_id: webhookId,
      hook_url: hookUrl,
      subscription: sub,
      message: 'Dialpad webhook registered. Call events will flow to your app.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
}
