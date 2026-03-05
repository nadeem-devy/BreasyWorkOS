import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createServiceClient();
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get('userId');
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const endDate = searchParams.get('endDate');

  let query = supabase
    .from('OS_domain_time')
    .select('user_id, domain, seconds')
    .order('seconds', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (endDate && endDate !== date) {
    query = query.gte('date', date).lte('date', endDate);
  } else {
    query = query.eq('date', date);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate by domain if date range spans multiple days
  if (endDate && endDate !== date && data) {
    const agg: Record<string, number> = {};
    for (const row of data) {
      agg[row.domain] = (agg[row.domain] ?? 0) + row.seconds;
    }
    const result = Object.entries(agg)
      .map(([domain, seconds]) => ({ domain, seconds }))
      .sort((a, b) => b.seconds - a.seconds);
    return NextResponse.json(result);
  }

  return NextResponse.json(data);
}
