#!/usr/bin/env node
/**
 * Registers a Dialpad webhook + call event subscription for Breasy WorkOS.
 *
 * Usage:
 *   node scripts/register-dialpad-webhook.mjs https://your-domain.vercel.app
 *
 * This creates:
 *   1. A webhook endpoint pointing to /api/webhooks/dialpad
 *   2. A call event subscription for ALL call states
 *
 * The old Bubble/Make.com webhooks are NOT removed — events go to both.
 */

const DIALPAD_BASE = 'https://dialpad.com/api/v2';
const API_KEY = process.env.DIALPAD_API_KEY;
if (!API_KEY) {
  console.error('Set DIALPAD_API_KEY environment variable');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

async function main() {
  const baseUrl = process.argv[2];
  if (!baseUrl) {
    console.error('Usage: node scripts/register-dialpad-webhook.mjs <BASE_URL>');
    console.error('Example: node scripts/register-dialpad-webhook.mjs https://breasy.vercel.app');
    process.exit(1);
  }

  const hookUrl = `${baseUrl.replace(/\/$/, '')}/api/webhooks/dialpad`;
  console.log(`\n=== Registering Dialpad webhook ===`);
  console.log(`URL: ${hookUrl}\n`);

  // Step 1: Check if webhook already exists for this URL
  const existingRes = await fetch(`${DIALPAD_BASE}/webhooks`, { headers });
  const existing = await existingRes.json();
  const alreadyExists = existing.items?.find(w => w.hook_url === hookUrl);

  let webhookId;

  if (alreadyExists) {
    webhookId = alreadyExists.id;
    console.log(`Webhook already exists: id=${webhookId}`);
  } else {
    // Step 2: Create webhook
    const createRes = await fetch(`${DIALPAD_BASE}/webhooks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ hook_url: hookUrl }),
    });

    if (!createRes.ok) {
      console.error('Failed to create webhook:', await createRes.text());
      process.exit(1);
    }

    const webhook = await createRes.json();
    webhookId = webhook.id;
    console.log(`Webhook created: id=${webhookId}`);
  }

  // Step 3: Check if call subscription already exists for this webhook
  const subsRes = await fetch(`${DIALPAD_BASE}/subscriptions/call`, { headers });
  const subs = await subsRes.json();
  const existingSub = subs.items?.find(s => s.webhook?.id === webhookId);

  if (existingSub) {
    console.log(`Call subscription already exists: id=${existingSub.id}`);
    console.log(`States: ${existingSub.call_states.join(', ')}`);
    console.log(`Enabled: ${existingSub.enabled}`);
  } else {
    // Step 4: Create call event subscription
    const subRes = await fetch(`${DIALPAD_BASE}/subscriptions/call`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        webhook_id: webhookId,
        call_states: ['ringing', 'calling', 'connected', 'hangup', 'voicemail', 'missed', 'hold', 'queued'],
        enabled: true,
      }),
    });

    if (!subRes.ok) {
      console.error('Failed to create subscription:', await subRes.text());
      process.exit(1);
    }

    const sub = await subRes.json();
    console.log(`Call subscription created: id=${sub.id}`);
    console.log(`States: ${sub.call_states?.join(', ')}`);
  }

  // Step 5: Also create SMS subscription
  const smsSubsRes = await fetch(`${DIALPAD_BASE}/subscriptions/sms`, { headers });
  const smsSubs = await smsSubsRes.json();
  const existingSmsSub = smsSubs.items?.find(s => s.webhook?.id === webhookId);

  if (existingSmsSub) {
    console.log(`\nSMS subscription already exists: id=${existingSmsSub.id}`);
  } else {
    const smsRes = await fetch(`${DIALPAD_BASE}/subscriptions/sms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        webhook_id: webhookId,
        direction: 'inbound',
        include_internal: true,
        enabled: true,
      }),
    });
    if (smsRes.ok) {
      const smsSub = await smsRes.json();
      console.log(`\nSMS subscription created: id=${smsSub.id}`);
    }
  }

  console.log('\n=== Done ===');
  console.log('Call events will now be sent to:', hookUrl);
  console.log('\nNote: Old Bubble/Make.com webhooks are still active (events go to both).');
}

main().catch(console.error);
