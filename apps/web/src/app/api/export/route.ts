import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stringify } from 'csv-stringify/sync';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');
  const format = searchParams.get('format') ?? 'csv';
  const userId = searchParams.get('user_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  if (!view) {
    return NextResponse.json({ error: 'Missing view parameter' }, { status: 400 });
  }

  const supabase = await createClient();

  let rows: Record<string, unknown>[] = [];
  let columns: string[] = [];

  switch (view) {
    case 'timeline': {
      if (!userId || !startDate) {
        return NextResponse.json({ error: 'Missing user_id or start_date' }, { status: 400 });
      }
      const end = endDate ?? startDate;
      const [bubble, gmail, dialpad] = await Promise.all([
        supabase.from('OS_bubble_events').select('wo_id, event_type, company, created_at').eq('user_id', userId).gte('created_at', `${startDate}T00:00:00`).lte('created_at', `${end}T23:59:59`),
        supabase.from('OS_gmail_events').select('event_type, direction, subject_snippet, created_at').eq('user_id', userId).gte('created_at', `${startDate}T00:00:00`).lte('created_at', `${end}T23:59:59`),
        supabase.from('OS_dialpad_events').select('event_type, direction, duration_seconds, contact_name, created_at').eq('user_id', userId).gte('created_at', `${startDate}T00:00:00`).lte('created_at', `${end}T23:59:59`),
      ]);

      rows = [
        ...(bubble.data ?? []).map((r) => ({ ...r, source: 'bubble' })),
        ...(gmail.data ?? []).map((r) => ({ ...r, source: 'gmail' })),
        ...(dialpad.data ?? []).map((r) => ({ ...r, source: 'dialpad' })),
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      columns = ['created_at', 'source', 'event_type', 'wo_id', 'company', 'direction', 'subject_snippet', 'contact_name', 'duration_seconds'];
      break;
    }

    case 'ar': {
      const { data } = await supabase.from('v_ar_aging').select('*');
      rows = data ?? [];
      columns = ['wo_id', 'company', 'invoice_number', 'amount', 'due_date', 'aging_bucket', 'days_overdue', 'invoice_sent_at', 'payment_received_at'];
      break;
    }

    case 'ap': {
      const { data } = await supabase
        .from('OS_bubble_financial_events')
        .select('*')
        .in('event_type', ['vendor_bill_created', 'vendor_bill_approved', 'vendor_bill_paid'])
        .order('created_at', { ascending: false })
        .limit(500);
      rows = data ?? [];
      columns = ['wo_id', 'company', 'vendor_name', 'amount', 'event_type', 'bill_number', 'created_at'];
      break;
    }

    case 'time-allocation': {
      const { data } = await supabase
        .from('OS_sessions')
        .select('user_id, started_at, duration_seconds, time_bubble, time_gmail, time_dialpad, time_melio, time_idle, profiles!inner(full_name)')
        .order('started_at', { ascending: false })
        .limit(500);
      rows = (data ?? []).map((r) => {
        const profile = r.profiles as unknown as { full_name: string };
        return { ...r, full_name: profile.full_name, profiles: undefined };
      });
      columns = ['full_name', 'started_at', 'duration_seconds', 'time_bubble', 'time_gmail', 'time_dialpad', 'time_melio', 'time_idle'];
      break;
    }

    case 'work-orders': {
      const { data } = await supabase
        .from('OS_bubble_events')
        .select('wo_id, company, event_type, market, created_at, profiles!inner(full_name)')
        .order('created_at', { ascending: false })
        .limit(1000);
      rows = (data ?? []).map((r) => {
        const profile = r.profiles as unknown as { full_name: string };
        return { ...r, full_name: profile.full_name, profiles: undefined };
      });
      columns = ['wo_id', 'company', 'full_name', 'event_type', 'market', 'created_at'];
      break;
    }

    default:
      return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
  }

  if (format === 'csv') {
    const csvData = rows.map((row) => {
      const obj: Record<string, string> = {};
      for (const col of columns) {
        obj[col] = String(row[col] ?? '');
      }
      return obj;
    });

    const csv = stringify(csvData, { header: true, columns });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${view}-export.csv"`,
      },
    });
  }

  // For XLSX, return JSON (client can use a library to generate XLSX)
  return NextResponse.json({ columns, data: rows });
}
