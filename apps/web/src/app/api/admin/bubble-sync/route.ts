import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Admin API for Bubble sync: fetch status/logs, trigger manual sync.
// Used by the dashboard UI.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') ?? 'status';

  try {
    const supabase = await createServiceClient();

    if (view === 'status') {
      // Check if tables exist by querying bubble_sync_state
      const { data: syncState, error: stateError } = await supabase
        .from('OS_bubble_sync_state')
        .select('*')
        .order('data_type');

      const tablesExist = !stateError || stateError.code !== 'PGRST205';

      if (!tablesExist) {
        return NextResponse.json({
          sync_state: [],
          counts: { work_orders: 0, invoices: 0, vendor_bills: 0 },
          tables_missing: true,
          setup_message: 'Mirror tables not found. Run the migration SQL in Supabase Dashboard > SQL Editor.',
        });
      }

      // Get mirror table counts
      const [woCount, invCount, billCount] = await Promise.all([
        supabase.from('OS_bubble_work_orders').select('id', { count: 'exact', head: true }),
        supabase.from('OS_bubble_invoices').select('id', { count: 'exact', head: true }),
        supabase.from('OS_bubble_vendor_bills').select('id', { count: 'exact', head: true }),
      ]);

      return NextResponse.json({
        sync_state: syncState ?? [],
        counts: {
          work_orders: woCount.count ?? 0,
          invoices: invCount.count ?? 0,
          vendor_bills: billCount.count ?? 0,
        },
        tables_missing: false,
      });
    }

    if (view === 'logs') {
      const limit = parseInt(searchParams.get('limit') ?? '100', 10);
      const dataType = searchParams.get('data_type'); // optional filter

      // Query mirror tables directly for recently synced records
      const queries: Promise<{ data: Record<string, unknown>[] | null }>[] = [];

      if (!dataType || dataType === 'work_orders') {
        queries.push(
          supabase
            .from('OS_bubble_work_orders')
            .select('id, bubble_thing_id, wo_number, company, market, status, stage, assigned_vendor_name, quote_amount, synced_at, bubble_created_at')
            .order('synced_at', { ascending: false })
            .limit(limit) as unknown as Promise<{ data: Record<string, unknown>[] | null }>,
        );
      }
      if (!dataType || dataType === 'invoices') {
        queries.push(
          supabase
            .from('OS_bubble_invoices')
            .select('id, bubble_thing_id, invoice_number, wo_id, company, market, status, amount, vendor_name, synced_at, bubble_created_at')
            .order('synced_at', { ascending: false })
            .limit(limit) as unknown as Promise<{ data: Record<string, unknown>[] | null }>,
        );
      }
      if (!dataType || dataType === 'vendor_bills') {
        queries.push(
          supabase
            .from('OS_bubble_vendor_bills')
            .select('id, bubble_thing_id, bill_number, wo_id, company, market, status, amount, vendor_name, synced_at, bubble_created_at')
            .order('synced_at', { ascending: false })
            .limit(limit) as unknown as Promise<{ data: Record<string, unknown>[] | null }>,
        );
      }

      const results = await Promise.all(queries);

      // Convert mirror records to log-like format
      let allLogs: Record<string, unknown>[] = [];
      let queryIdx = 0;

      if (!dataType || dataType === 'work_orders') {
        const rows = results[queryIdx]?.data ?? [];
        queryIdx++;
        for (const r of rows) {
          const isNew = r.synced_at && r.bubble_created_at &&
            Math.abs(new Date(r.synced_at as string).getTime() - new Date(r.bubble_created_at as string).getTime()) < 60000;
          allLogs.push({
            id: r.id,
            table: 'bubble_work_orders',
            wo_id: r.wo_number ?? '',
            company: r.company,
            market: r.market,
            event_type: isNew ? 'wo_created' : 'wo_synced',
            bubble_thing_id: r.bubble_thing_id,
            created_at: r.synced_at,
            field_name: 'status',
            new_value: r.status ?? r.stage ?? '',
          });
        }
      }
      if (!dataType || dataType === 'invoices') {
        const rows = results[queryIdx]?.data ?? [];
        queryIdx++;
        for (const r of rows) {
          allLogs.push({
            id: r.id,
            table: 'bubble_invoices',
            wo_id: r.wo_id ?? '',
            company: r.company,
            market: r.market,
            event_type: 'invoice_synced',
            invoice_number: r.invoice_number,
            amount: r.amount,
            vendor_name: r.vendor_name,
            bubble_thing_id: r.bubble_thing_id,
            created_at: r.synced_at,
          });
        }
      }
      if (!dataType || dataType === 'vendor_bills') {
        const rows = results[queryIdx]?.data ?? [];
        for (const r of rows) {
          allLogs.push({
            id: r.id,
            table: 'bubble_vendor_bills',
            wo_id: r.wo_id ?? '',
            company: r.company,
            market: r.market,
            event_type: 'bill_synced',
            bill_number: r.bill_number,
            amount: r.amount,
            vendor_name: r.vendor_name,
            bubble_thing_id: r.bubble_thing_id,
            created_at: r.synced_at,
          });
        }
      }

      // Sort by synced_at descending
      allLogs.sort((a, b) =>
        new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime(),
      );

      return NextResponse.json({ logs: allLogs.slice(0, limit) });
    }

    return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
  } catch (error) {
    console.error('Bubble sync admin error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST: trigger manual sync or reconciliation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;
    const dataType = body.data_type as string | undefined; // optional: sync only this type

    if (action !== 'sync' && action !== 'reconcile') {
      return NextResponse.json({ error: 'Invalid action. Use "sync" or "reconcile"' }, { status: 400 });
    }

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    // Call the cron endpoint internally
    const basePath = action === 'sync' ? '/api/cron/bubble-sync' : '/api/cron/bubble-reconcile';
    const queryParams = dataType ? `?data_type=${dataType}` : '';
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? request.url.split('/api/')[0]
      : 'http://localhost:3000';

    const res = await fetch(`${baseUrl}${basePath}${queryParams}`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });

    const result = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: result.error ?? 'Sync failed' }, { status: res.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Manual sync trigger error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
