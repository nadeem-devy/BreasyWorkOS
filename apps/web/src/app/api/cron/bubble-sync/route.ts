import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  fetchModifiedSince,
  detectChanges,
  insertEventIfNotDuplicate,
  getTableConfig,
  type BubbleDataType,
  type BubbleRecord,
  type BubbleWorkload,
} from '@/lib/integrations/bubble';

// Vercel Cron: runs every 5 minutes to incrementally sync Bubble data.
// Fetches records modified since last sync, upserts mirror tables,
// and generates change events into bubble_events / bubble_financial_events.

export const maxDuration = 60;

const ALL_DATA_TYPES: BubbleDataType[] = ['work_orders', 'invoices', 'vendor_bills'];

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
    const results: Record<string, { fetched: number; upserted: number; events: number; errors: string[]; records: Record<string, unknown>[] }> = {};

    // Support optional data_type filter for single-type sync
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('data_type') as BubbleDataType | null;
    const dataTypes = filterType && ALL_DATA_TYPES.includes(filterType)
      ? [filterType]
      : ALL_DATA_TYPES;

    for (const dataType of dataTypes) {
      results[dataType] = await syncDataType(supabase, dataType);
    }

    return NextResponse.json({ message: 'Bubble incremental sync complete', results });
  } catch (error) {
    console.error('Bubble sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

async function syncDataType(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  dataType: BubbleDataType,
) {
  let fetched = 0;
  let upserted = 0;
  let events = 0;
  const errors: string[] = [];
  const syncedRecords: Record<string, unknown>[] = [];

  // 1. Read last sync timestamp
  const { data: syncState, error: stateError } = await supabase
    .from('OS_bubble_sync_state')
    .select('last_incremental_sync_at')
    .eq('data_type', dataType)
    .single();

  if (stateError) {
    errors.push(`[sync_state] ${stateError.message} (code: ${stateError.code})`);
    if (stateError.code === 'PGRST205' || stateError.message?.includes('schema cache')) {
      errors.push('Table bubble_sync_state does not exist. Run the migration SQL in Supabase Dashboard > SQL Editor.');
      return { fetched, upserted, events, errors, records: syncedRecords, workload: { api_calls: 0, total_wu: 0, total_time_ms: 0 } };
    }
  }

  // Default to 24 hours ago on first run
  const since = syncState?.last_incremental_sync_at
    ? new Date(syncState.last_incremental_sync_at)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

  errors.push(`[info] Fetching ${dataType} modified since ${since.toISOString()}`);

  // 2. Fetch modified records from Bubble
  const { records, workload } = await fetchModifiedSince<BubbleRecord>(dataType, since);
  fetched = records.length;
  errors.push(`[info] Fetched ${records.length} records from Bubble API (${workload.api_calls} calls, ${workload.total_wu.toFixed(3)} WU)`);

  if (records.length === 0) {
    await supabase
      .from('OS_bubble_sync_state')
      .update({ last_incremental_sync_at: new Date().toISOString() })
      .eq('data_type', dataType);
    return { fetched, upserted, events, errors, records: syncedRecords, workload };
  }

  // 3. Build email→userId lookup for event attribution
  const { data: profiles } = await supabase.from('OS_profiles').select('id, email');
  const emailToUserId = new Map<string, string>();
  for (const p of profiles ?? []) {
    emailToUserId.set(p.email, p.id);
  }

  // 4. Get table config and mapper
  const { tableName, mapper } = getTableConfig(dataType);
  const thingIds = records.map((r) => r._id);

  // 5. Fetch existing mirror rows for change detection
  const { data: existingRows, error: selectError } = await supabase
    .from(tableName)
    .select('*')
    .in('bubble_thing_id', thingIds);

  if (selectError) {
    errors.push(`[${tableName}] SELECT error: ${selectError.message} (code: ${selectError.code})`);
    if (selectError.code === 'PGRST205' || selectError.message?.includes('schema cache')) {
      errors.push(`Table ${tableName} does not exist. Run the migration SQL in Supabase Dashboard > SQL Editor.`);
      return { fetched, upserted, events, errors, records: syncedRecords, workload };
    }
  }

  const existingByThingId = new Map<string, Record<string, unknown>>();
  for (const row of (existingRows ?? []) as Record<string, unknown>[]) {
    existingByThingId.set(row.bubble_thing_id as string, row);
  }

  // 6. Process each record
  let maxModifiedDate = since;
  let upsertErrors = 0;

  for (const record of records) {
    const mapped = mapper(record);
    const existing = existingByThingId.get(record._id) ?? null;

    // Detect changes before upserting
    const changes = detectChanges(dataType, existing, mapped);

    // UPSERT into mirror table
    const { error } = await supabase
      .from(tableName)
      .upsert(mapped, { onConflict: 'bubble_thing_id' });

    if (error) {
      upsertErrors++;
      if (upsertErrors <= 3) {
        errors.push(`[upsert] ${record._id}: ${error.message} (code: ${error.code})`);
      }
      // Still capture the record so the dashboard can show what was fetched
      const m = mapped as Record<string, unknown>;
      syncedRecords.push({
        bubble_thing_id: record._id,
        wo_id: (m.wo_number ?? m.wo_id ?? '') as string,
        status: (m.status ?? '') as string,
        data_type: dataType,
        error: error.message,
        ...pickDisplayFields(dataType, mapped),
      });
      continue;
    }
    upserted++;

    // Build field-level change summary for the dashboard
    const fieldChanges: { field: string; old_value: string; new_value: string }[] = [];
    const isNew = !existing;

    if (!isNew) {
      for (const change of changes) {
        const meta = change.event.metadata as Record<string, unknown> | undefined;
        if (meta?.field_name) {
          fieldChanges.push({
            field: meta.field_name as string,
            old_value: String(meta.old_value ?? ''),
            new_value: String(meta.new_value ?? ''),
          });
        } else if (change.event.field_name) {
          fieldChanges.push({
            field: change.event.field_name as string,
            old_value: String(change.event.old_value ?? ''),
            new_value: String(change.event.new_value ?? ''),
          });
        }
      }
    }

    const m2 = mapped as Record<string, unknown>;
    syncedRecords.push({
      bubble_thing_id: record._id,
      wo_id: (m2.wo_number ?? m2.wo_id ?? '') as string,
      status: (m2.status ?? '') as string,
      data_type: dataType,
      synced: true,
      is_new: isNew,
      field_changes: fieldChanges,
      ...pickDisplayFields(dataType, mapped),
    });

    // Insert change events with deduplication
    for (const change of changes) {
      const userEmail = (mapped as Record<string, unknown>).assigned_user_email as
        | string
        | undefined;
      const userId = userEmail ? emailToUserId.get(userEmail) : undefined;

      if (change.table === 'OS_bubble_events' && !userId) continue;
      if (change.table === 'OS_bubble_financial_events' && !userId) continue;

      const eventWithUser = { ...change.event, user_id: userId };
      const inserted = await insertEventIfNotDuplicate(supabase, change.table, eventWithUser);
      if (inserted) events++;
    }

    // Track the latest Modified Date for cursor update
    const modDate = new Date(record['Modified Date']);
    if (modDate > maxModifiedDate) maxModifiedDate = modDate;
  }

  if (upsertErrors > 3) {
    errors.push(`[upsert] ... and ${upsertErrors - 3} more errors`);
  }
  if (upsertErrors > 0) {
    errors.push(`[upsert] Total: ${upsertErrors} failed out of ${fetched}`);
  }

  errors.push(`[done] ${upserted} upserted, ${events} events created`);

  // 7. Update sync state cursor
  await supabase
    .from('OS_bubble_sync_state')
    .update({ last_incremental_sync_at: maxModifiedDate.toISOString() })
    .eq('data_type', dataType);

  return { fetched, upserted, events, errors, records: syncedRecords, workload };
}

/** Pick human-readable fields per data type for the dashboard log */
function pickDisplayFields(dataType: BubbleDataType, mapped: Record<string, unknown>) {
  if (dataType === 'work_orders') {
    return {
      stage: mapped.stage ?? '',
      market: mapped.market ?? '',
      vendor: mapped.assigned_vendor_name ?? '',
      address: mapped.property_address ?? '',
      amount: mapped.quote_amount ?? null,
    };
  }
  if (dataType === 'invoices') {
    return {
      invoice_number: mapped.invoice_number ?? '',
      vendor_name: mapped.vendor_name ?? '',
      amount: mapped.amount ?? null,
    };
  }
  return {
    bill_number: mapped.bill_number ?? '',
    vendor_name: mapped.vendor_name ?? '',
    amount: mapped.amount ?? null,
  };
}
