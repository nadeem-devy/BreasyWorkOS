import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Vercel Cron: runs every 2 minutes to poll Gmail for new messages
// This requires Google OAuth tokens stored per user in the database

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();

    // Get all active users with Gmail tracking enabled
    const { data: profiles } = await supabase
      .from('OS_profiles')
      .select('id, email')
      .eq('is_active', true);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No users to poll' });
    }

    // TODO: For each user, use their stored OAuth token to:
    // 1. Call Gmail API: messages.list(after: lastSyncTimestamp)
    // 2. For each new message: fetch metadata (no body)
    // 3. Extract: from, to, cc, subject snippet, thread_id, has_attachments
    // 4. Insert into gmail_events
    // 5. Update lastSyncTimestamp
    //
    // Implementation requires:
    // - Google OAuth tokens stored per user (separate auth flow)
    // - google-auth-library and googleapis npm packages
    // - Token refresh handling
    //
    // Example Gmail API call:
    // const gmail = google.gmail({ version: 'v1', auth: oauthClient });
    // const { data } = await gmail.users.messages.list({
    //   userId: 'me',
    //   q: `after:${lastSyncEpoch}`,
    //   maxResults: 50,
    // });

    return NextResponse.json({ message: 'Gmail poll complete', users: profiles.length });
  } catch (error) {
    console.error('Gmail poll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
