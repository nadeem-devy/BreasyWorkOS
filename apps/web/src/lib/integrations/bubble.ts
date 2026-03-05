import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Bubble Data API Client
// Handles fetching, mapping, change detection, and deduplication
// for syncing Bubble.io data into Supabase mirror tables.
// ============================================================

// --- Types ---

export interface BubbleRecord {
  _id: string;
  'Created Date': string;
  'Modified Date': string;
  [key: string]: unknown;
}

// Actual Bubble "Job" type (= Work Order)
export interface BubbleWorkOrder extends BubbleRecord {
  jobWorkOrder?: string;
  statusJobStage?: string;
  statusJobCompletion?: string;
  jobMarket?: string;
  jobDescription?: string;
  jobServicesList?: string[];
  addressGeo?: { address?: string; lat?: number; lng?: number };
  amountCustPrice?: number;
  dateWorkScheduled?: string;
  dateWorkCompleted?: string;
  dateClosed?: string;
  dateCustQuoteSent?: string;
  dateCustInvoiceSent?: string;
  dateCustInvoiceDue?: string;
  jobInvoiceNo?: string;
  statusCustQuote?: string;
  statusSmbQuote?: string;
  assignedFulfillmentUser?: string;
  assignedSmbUser?: string;
  assignedCustUser?: string;
  assignedCustOrg?: string;
  lastActivity?: string;
}

// Actual Bubble "Invoice" type
export interface BubbleInvoice extends BubbleRecord {
  invoiceType?: string;
  invoiceStatus?: string;
  jobWorkOrder?: string;
  invoiceJob?: string;
  smbName?: string;
  smbPhone?: string;
  associatedCustOrg?: string;
  dateJobCompleted?: string;
  dateJobCompletionConfirmed?: string;
}

// Actual Bubble "Payment" type (= Vendor Bill)
export interface BubbleVendorBill extends BubbleRecord {
  jobWorkOrder?: string;
  amountSmbPrice?: number;
  paymentStatus?: string;
  associatedJob?: string;
  associatedSmbUser?: string;
  associatedSmbOrg?: string;
  dateSentToQuickbooks?: string;
  jobWorkComplete?: string;
  jobAddress?: { address?: string; lat?: number; lng?: number };
  smbAddress?: { address?: string; lat?: number; lng?: number };
  zapTriggerSuccess?: boolean;
}

interface BubbleApiResponse<T> {
  response: {
    cursor: number;
    results: T[];
    count: number;
    remaining: number;
  };
}

// Actual Bubble API type names (discovered from the app)
export const BUBBLE_TYPE_MAP = {
  work_orders: 'Job',
  invoices: 'Invoice',
  vendor_bills: 'Payment',
} as const;

export type BubbleDataType = keyof typeof BUBBLE_TYPE_MAP;

// --- Workload Tracking ---

export interface BubbleWorkload {
  api_calls: number;
  total_wu: number;       // unit-seconds from x-bubble-capacity-used
  total_time_ms: number;  // total Bubble server time from x-bubble-perf
}

function parseCapacityUsed(header: string | null): number {
  if (!header) return 0;
  const match = header.match(/([\d.]+)\s*unit-seconds/);
  return match ? parseFloat(match[1]) : 0;
}

function parsePerfTime(header: string | null): number {
  if (!header) return 0;
  try {
    const perf = JSON.parse(header);
    return typeof perf.total === 'number' ? perf.total : 0;
  } catch {
    return 0;
  }
}

// --- API Client ---

const BUBBLE_PAGE_LIMIT = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function getBaseUrl(): string {
  const appName = process.env.BUBBLE_APP_NAME;
  if (!appName) throw new Error('BUBBLE_APP_NAME not configured');
  return `https://${appName}.bubbleapps.io/api/1.1/obj`;
}

function getHeaders(): HeadersInit {
  const apiKey = process.env.BUBBLE_API_KEY;
  if (!apiKey) throw new Error('BUBBLE_API_KEY not configured');
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
  };
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, init);
    if (res.ok) return res;

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '2', 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (res.status >= 500 && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, attempt)));
      continue;
    }

    throw new Error(`Bubble API error: ${res.status} ${await res.text()}`);
  }
  throw new Error('Bubble API: max retries exceeded');
}

/** Fetch ALL records of a given type (paginated). Used by full reconciliation. */
export async function fetchAllRecords<T extends BubbleRecord>(
  dataType: BubbleDataType,
): Promise<{ records: T[]; workload: BubbleWorkload }> {
  const typeName = BUBBLE_TYPE_MAP[dataType];
  const baseUrl = getBaseUrl();
  const allRecords: T[] = [];
  const workload: BubbleWorkload = { api_calls: 0, total_wu: 0, total_time_ms: 0 };
  let cursor = 0;

  while (true) {
    const url = new URL(`${baseUrl}/${typeName}`);
    url.searchParams.set('cursor', String(cursor));
    url.searchParams.set('limit', String(BUBBLE_PAGE_LIMIT));
    url.searchParams.set('sort_field', 'Modified Date');
    url.searchParams.set('descending', 'false');

    const res = await fetchWithRetry(url.toString(), { headers: getHeaders() });
    workload.api_calls++;
    workload.total_wu += parseCapacityUsed(res.headers.get('x-bubble-capacity-used'));
    workload.total_time_ms += parsePerfTime(res.headers.get('x-bubble-perf'));

    const data: BubbleApiResponse<T> = await res.json();
    allRecords.push(...data.response.results);

    if (data.response.remaining === 0) break;
    cursor += data.response.results.length;
  }

  return { records: allRecords, workload };
}

/** Fetch records modified since a given timestamp. Used by incremental sync. */
export async function fetchModifiedSince<T extends BubbleRecord>(
  dataType: BubbleDataType,
  since: Date,
): Promise<{ records: T[]; workload: BubbleWorkload }> {
  const typeName = BUBBLE_TYPE_MAP[dataType];
  const baseUrl = getBaseUrl();
  const allRecords: T[] = [];
  const workload: BubbleWorkload = { api_calls: 0, total_wu: 0, total_time_ms: 0 };
  let cursor = 0;

  const constraints = JSON.stringify([
    { key: 'Modified Date', constraint_type: 'greater than', value: since.toISOString() },
  ]);

  while (true) {
    const url = new URL(`${baseUrl}/${typeName}`);
    url.searchParams.set('cursor', String(cursor));
    url.searchParams.set('limit', String(BUBBLE_PAGE_LIMIT));
    url.searchParams.set('constraints', constraints);
    url.searchParams.set('sort_field', 'Modified Date');
    url.searchParams.set('descending', 'false');

    const res = await fetchWithRetry(url.toString(), { headers: getHeaders() });
    workload.api_calls++;
    workload.total_wu += parseCapacityUsed(res.headers.get('x-bubble-capacity-used'));
    workload.total_time_ms += parsePerfTime(res.headers.get('x-bubble-perf'));

    const data: BubbleApiResponse<T> = await res.json();
    allRecords.push(...data.response.results);

    if (data.response.remaining === 0) break;
    cursor += data.response.results.length;
  }

  return { records: allRecords, workload };
}

// --- Record Mappers ---

export function mapWorkOrder(record: BubbleWorkOrder) {
  return {
    bubble_thing_id: record._id,
    wo_number: record.jobWorkOrder ?? null,
    status: record.statusJobCompletion ?? null,
    stage: record.statusJobStage ?? null,
    company: null, // not a direct field — resolved via assignedCustOrg
    market: record.jobMarket ?? null,
    property_address: record.addressGeo?.address ?? null,
    description: record.jobDescription ?? null,
    category: record.jobServicesList?.join(', ') ?? null,
    priority: null,
    assigned_vendor_name: record.assignedSmbUser ?? null,
    assigned_vendor_id: null,
    assigned_user_email: record.assignedFulfillmentUser ?? null,
    scheduled_date: record.dateWorkScheduled ?? null,
    completed_date: record.dateWorkCompleted ?? null,
    customer_name: record.assignedCustUser ?? null,
    customer_email: null,
    customer_phone: null,
    quote_amount: record.amountCustPrice ?? null,
    approved_amount: null,
    bubble_created_at: record['Created Date'],
    bubble_modified_at: record['Modified Date'],
    raw_data: record,
    synced_at: new Date().toISOString(),
  };
}

export function mapInvoice(record: BubbleInvoice) {
  return {
    bubble_thing_id: record._id,
    invoice_number: null, // not a direct field on Invoice type
    wo_id: record.jobWorkOrder ?? null,
    company: null,
    market: null,
    status: record.invoiceStatus ?? null,
    amount: null,
    currency: 'USD',
    customer_name: null,
    customer_email: null,
    due_date: null,
    sent_at: null,
    paid_at: record.invoiceStatus === 'Paid' ? record.dateJobCompletionConfirmed ?? null : null,
    paid_amount: null,
    payment_method: null,
    vendor_name: record.smbName ?? null,
    notes: null,
    bubble_created_at: record['Created Date'],
    bubble_modified_at: record['Modified Date'],
    raw_data: record,
    synced_at: new Date().toISOString(),
  };
}

export function mapVendorBill(record: BubbleVendorBill) {
  return {
    bubble_thing_id: record._id,
    bill_number: null,
    wo_id: record.jobWorkOrder ?? null,
    company: null,
    market: null,
    status: record.paymentStatus ?? null,
    amount: record.amountSmbPrice ?? null,
    currency: 'USD',
    vendor_name: record.associatedSmbOrg ?? null,
    vendor_id: record.associatedSmbUser ?? null,
    due_date: null,
    approved_at: null,
    paid_at: record.dateSentToQuickbooks ?? null,
    rejected_at: null,
    payment_method: null,
    notes: null,
    bubble_created_at: record['Created Date'],
    bubble_modified_at: record['Modified Date'],
    raw_data: record,
    synced_at: new Date().toISOString(),
  };
}

// --- Change Detection ---

export interface DetectedChange {
  table: 'OS_bubble_events' | 'OS_bubble_financial_events';
  event: Record<string, unknown>;
}

interface TrackedField {
  mirrorColumn: string;
  eventFieldName: string;
  isFinancial?: boolean;
}

const WORK_ORDER_TRACKED_FIELDS: TrackedField[] = [
  { mirrorColumn: 'status', eventFieldName: 'status' },
  { mirrorColumn: 'stage', eventFieldName: 'stage' },
  { mirrorColumn: 'assigned_vendor_name', eventFieldName: 'assigned_vendor' },
  { mirrorColumn: 'scheduled_date', eventFieldName: 'scheduled_date' },
  { mirrorColumn: 'completed_date', eventFieldName: 'completed_date' },
  { mirrorColumn: 'priority', eventFieldName: 'priority' },
  { mirrorColumn: 'quote_amount', eventFieldName: 'quote_amount' },
  { mirrorColumn: 'approved_amount', eventFieldName: 'approved_amount' },
];

const INVOICE_TRACKED_FIELDS: TrackedField[] = [
  { mirrorColumn: 'status', eventFieldName: 'status', isFinancial: true },
  { mirrorColumn: 'amount', eventFieldName: 'amount', isFinancial: true },
  { mirrorColumn: 'paid_amount', eventFieldName: 'paid_amount', isFinancial: true },
  { mirrorColumn: 'sent_at', eventFieldName: 'sent_at', isFinancial: true },
  { mirrorColumn: 'paid_at', eventFieldName: 'paid_at', isFinancial: true },
  { mirrorColumn: 'due_date', eventFieldName: 'due_date', isFinancial: true },
];

const VENDOR_BILL_TRACKED_FIELDS: TrackedField[] = [
  { mirrorColumn: 'status', eventFieldName: 'payment_status', isFinancial: true },
  { mirrorColumn: 'amount', eventFieldName: 'amount', isFinancial: true },
  { mirrorColumn: 'paid_at', eventFieldName: 'paid_at', isFinancial: true },
];

/** Compare existing mirror row with new mapped record. Returns events to insert. */
export function detectChanges(
  dataType: BubbleDataType,
  existingRow: Record<string, unknown> | null,
  newMapped: Record<string, unknown>,
): DetectedChange[] {
  const changes: DetectedChange[] = [];
  const bubbleThingId = newMapped.bubble_thing_id as string;
  const woId = (newMapped.wo_id ?? newMapped.wo_number ?? '') as string;
  const company = (newMapped.company ?? '') as string;
  const market = (newMapped.market ?? '') as string;

  // New record — generate creation event
  if (!existingRow) {
    if (dataType === 'work_orders') {
      changes.push({
        table: 'OS_bubble_events',
        event: {
          wo_id: woId,
          company,
          market,
          event_type: 'wo_created',
          event_category: 'operational',
          source: 'sync',
          bubble_thing_id: bubbleThingId,
          metadata: { sync_source: 'incremental' },
        },
      });
    } else if (dataType === 'invoices') {
      changes.push({
        table: 'OS_bubble_financial_events',
        event: {
          wo_id: woId,
          company,
          market,
          event_type: 'invoice_created',
          invoice_number: newMapped.invoice_number ?? null,
          amount: newMapped.amount ?? null,
          vendor_name: newMapped.vendor_name ?? null,
          source: 'sync',
          bubble_thing_id: bubbleThingId,
        },
      });
    } else if (dataType === 'vendor_bills') {
      changes.push({
        table: 'OS_bubble_financial_events',
        event: {
          wo_id: woId,
          company,
          market,
          event_type: 'vendor_bill_created',
          bill_number: newMapped.bill_number ?? null,
          amount: newMapped.amount ?? null,
          vendor_name: newMapped.vendor_name ?? null,
          source: 'sync',
          bubble_thing_id: bubbleThingId,
        },
      });
    }
    return changes;
  }

  // Existing record — detect field-level changes
  const trackedFields =
    dataType === 'work_orders'
      ? WORK_ORDER_TRACKED_FIELDS
      : dataType === 'invoices'
        ? INVOICE_TRACKED_FIELDS
        : VENDOR_BILL_TRACKED_FIELDS;

  for (const tf of trackedFields) {
    const oldVal = existingRow[tf.mirrorColumn];
    const newVal = newMapped[tf.mirrorColumn];

    if (String(oldVal ?? '') === String(newVal ?? '')) continue;

    if (tf.isFinancial) {
      const eventType = mapFinancialFieldChange(dataType, tf.mirrorColumn, newVal);
      changes.push({
        table: 'OS_bubble_financial_events',
        event: {
          wo_id: woId,
          company,
          market,
          event_type: eventType,
          invoice_number: newMapped.invoice_number ?? null,
          bill_number: newMapped.bill_number ?? null,
          amount: newMapped.amount ?? null,
          vendor_name: newMapped.vendor_name ?? null,
          source: 'sync',
          bubble_thing_id: bubbleThingId,
          metadata: { field_name: tf.eventFieldName, old_value: oldVal, new_value: newVal },
        },
      });
    } else {
      const eventType = mapWoFieldChange(tf.mirrorColumn, newVal);
      changes.push({
        table: 'OS_bubble_events',
        event: {
          wo_id: woId,
          company,
          market,
          event_type: eventType,
          event_category: 'operational',
          field_name: tf.eventFieldName,
          old_value: String(oldVal ?? ''),
          new_value: String(newVal ?? ''),
          source: 'sync',
          bubble_thing_id: bubbleThingId,
        },
      });
    }
  }

  return changes;
}

function mapWoFieldChange(column: string, newVal: unknown): string {
  if (column === 'status') return 'wo_status_changed';
  if (column === 'stage') return 'wo_stage_changed';
  if (column === 'assigned_vendor_name') return newVal ? 'vendor_assigned' : 'vendor_reassigned';
  if (column === 'scheduled_date') return 'scheduled';
  if (column === 'completed_date' && newVal) return 'completed';
  return 'field_changed';
}

function mapFinancialFieldChange(dataType: string, column: string, newVal: unknown): string {
  if (dataType === 'invoices') {
    if (column === 'sent_at' && newVal) return 'invoice_sent';
    if (column === 'paid_at' && newVal) return 'payment_received';
    return 'invoice_updated';
  }
  // vendor_bills
  if (column === 'approved_at' && newVal) return 'vendor_bill_approved';
  if (column === 'paid_at' && newVal) return 'vendor_bill_paid';
  if (column === 'rejected_at' && newVal) return 'vendor_bill_rejected';
  return 'vendor_bill_updated';
}

// --- Event Deduplication ---

const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/** Insert an event only if no duplicate exists within the dedup window. */
export async function insertEventIfNotDuplicate(
  supabase: SupabaseClient,
  table: 'OS_bubble_events' | 'OS_bubble_financial_events',
  event: Record<string, unknown>,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();

  const { data: existing } = await supabase
    .from(table)
    .select('id')
    .eq('bubble_thing_id', event.bubble_thing_id as string)
    .eq('event_type', event.event_type as string)
    .eq('source', 'sync')
    .gte('created_at', windowStart)
    .limit(1);

  if (existing && existing.length > 0) return false;

  const { error } = await supabase.from(table).insert(event);
  if (error) {
    console.error(`Failed to insert ${table} event:`, error);
    return false;
  }
  return true;
}

// --- Helper: get table config for a data type ---

export function getTableConfig(dataType: BubbleDataType) {
  switch (dataType) {
    case 'work_orders':
      return {
        tableName: 'bubble_work_orders' as const,
        mapper: mapWorkOrder as (r: BubbleRecord) => ReturnType<typeof mapWorkOrder>,
      };
    case 'invoices':
      return {
        tableName: 'bubble_invoices' as const,
        mapper: mapInvoice as (r: BubbleRecord) => ReturnType<typeof mapInvoice>,
      };
    case 'vendor_bills':
      return {
        tableName: 'bubble_vendor_bills' as const,
        mapper: mapVendorBill as (r: BubbleRecord) => ReturnType<typeof mapVendorBill>,
      };
  }
}
