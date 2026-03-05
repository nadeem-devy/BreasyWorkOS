import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createServiceClient();
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get('userId');
  const reviewed = searchParams.get('reviewed');

  let query = supabase
    .from('OS_activity_flags')
    .select('*')
    .order('flagged_at', { ascending: false })
    .limit(100);

  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (reviewed === 'false') {
    query = query.eq('reviewed', false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
