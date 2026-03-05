import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  fetchAllRecords,
  getTableConfig,
  type BubbleDataType,
  type BubbleRecord,
} from '@/lib/integrations/bubble';

// Vercel Cron: runs every hour for full reconciliation.
// Compares all Bubble records against Supabase mirror tables,
// inserts missing records, updates stale ones, and detects deletions.
// Does NOT generate events — that's the incremental sync's job.

export const maxDuration = 300; // 5 min — requires Vercel Pro plan

const DATA_TYPES: BubbleDataType[] = ['work_orders', 'invoices', 'vendor_bills'];

interface ReconcileStats {
  bubble_count: number;
  supabase_count: number;
  inserted: number;
  updated: number;
  deleted_detected: number;
  errors: number;
  workload: { api_calls: number; total_wu: number; total_time_ms: number };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.BUBBLE_API_KEY || !process.env.BUBBLE_APP_NAME) {
    return NextResponse.json({ error: 'Bubble API not configured' }, { status: 500 });
  }

  try {
    const supabase = await createServiceClient();
    const results: Record<string, ReconcileStats> = {};

    for (const dataType of DATA_TYPES) {
      results[dataType] = await reconcileDataType(supabase, dataType);
    }

    return NextResponse.json({ message: 'Bubble full reconciliation complete', results });
  } catch (error) {
    console.error('Bubble reconcile error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

async function reconcileDataType(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  dataType: BubbleDataType,
): Promise<ReconcileStats> {
  const stats: ReconcileStats = {
    bubble_count: 0,
    supabase_count: 0,
    inserted: 0,
    updated: 0,
    deleted_detected: 0,
    errors: 0,
    workload: { api_calls: 0, total_wu: 0, total_time_ms: 0 },
  };

  const { tableName, mapper } = getTableConfig(dataType);

  // 1. Fetch ALL records from Bubble
  const { records: bubbleRecords, workload } = await fetchAllRecords<BubbleRecord>(dataType);
  stats.bubble_count = bubbleRecords.length;
  stats.workload = workload;

  // 2. Fetch all existing mirror rows (just IDs and modified dates for comparison)
  const { data: supabaseRows } = await supabase
    .from(tableName)
    .select('bubble_thing_id, bubble_modified_at');

  stats.supabase_count = supabaseRows?.length ?? 0;

  const supabaseMap = new Map<string, string>();
  for (const row of (supabaseRows ?? []) as { bubble_thing_id: string; bubble_modified_at: string }[]) {
    supabaseMap.set(row.bubble_thing_id, row.bubble_modified_at);
  }

  // 3. Build set of Bubble IDs for deletion detection
  const bubbleIdSet = new Set(bubbleRecords.map((r) => r._id));

  // 4. Insert missing and update stale records
  for (const record of bubbleRecords) {
    const mapped = mapper(record);
    const existingModified = supabaseMap.get(record._id);

    if (!existingModified) {
      // Missing from Supabase — insert
      const { error } = await supabase
        .from(tableName)
        .upsert(mapped, { onConflict: 'bubble_thing_id' });

      if (error) {
        stats.errors++;
        console.error(`Reconcile insert ${dataType}/${record._id}:`, error);
      } else {
        stats.inserted++;
      }
    } else if (new Date(record['Modified Date']) > new Date(existingModified)) {
      // Stale — update
      const { error } = await supabase
        .from(tableName)
        .upsert(mapped, { onConflict: 'bubble_thing_id' });

      if (error) {
        stats.errors++;
        console.error(`Reconcile update ${dataType}/${record._id}:`, error);
      } else {
        stats.updated++;
      }
    }
    // Up to date — skip
  }

  // 5. Detect records in Supabase that no longer exist in Bubble
  // Tag them in raw_data rather than hard-deleting for safety
  for (const [thingId] of supabaseMap) {
    if (!bubbleIdSet.has(thingId)) {
      console.warn(`Record ${thingId} in ${tableName} not found in Bubble (possibly deleted)`);

      const { error } = await supabase
        .from(tableName)
        .update({
          raw_data: { _deleted_detected_at: new Date().toISOString() },
          synced_at: new Date().toISOString(),
        })
        .eq('bubble_thing_id', thingId);

      if (error) {
        stats.errors++;
      } else {
        stats.deleted_detected++;
      }
    }
  }

  // 6. Update sync state
  await supabase
    .from('OS_bubble_sync_state')
    .update({
      last_full_reconcile_at: new Date().toISOString(),
      last_record_count: stats.bubble_count,
    })
    .eq('data_type', dataType);

  return stats;
}
