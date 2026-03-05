import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Gmail Push Notification receiver (from Google Pub/Sub)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Decode Pub/Sub message
    const messageData = body.message?.data;
    if (!messageData) {
      return NextResponse.json({ error: 'No message data' }, { status: 400 });
    }

    const decoded = JSON.parse(Buffer.from(messageData, 'base64').toString());
    const emailAddress = decoded.emailAddress;
    const historyId = decoded.historyId;

    if (!emailAddress) {
      return NextResponse.json({ error: 'No email address in notification' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Look up user by email
    const { data: profile } = await supabase
      .from('OS_profiles')
      .select('id')
      .eq('email', emailAddress)
      .single();

    if (!profile) {
      // User not tracked, acknowledge the notification
      return NextResponse.json({ success: true });
    }

    // Store the historyId for later processing by the cron job
    // The cron job will use the Gmail API to fetch actual message details
    await supabase.from('OS_gmail_events').insert({
      user_id: profile.id,
      event_type: 'notification_received',
      gmail_message_id: `notification-${historyId}`,
      gmail_thread_id: `history-${historyId}`,
      direction: 'inbound',
      metadata: { historyId, emailAddress, raw_notification: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gmail webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
