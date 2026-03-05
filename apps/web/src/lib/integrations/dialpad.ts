const DIALPAD_BASE = 'https://dialpad.com/api/v2';

function getHeaders() {
  const apiKey = process.env.DIALPAD_API_KEY;
  if (!apiKey) throw new Error('DIALPAD_API_KEY not configured');
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}

/** List all Dialpad users (for matching to profiles) */
export async function listUsers(): Promise<DialpadUser[]> {
  const res = await fetch(`${DIALPAD_BASE}/users`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Dialpad users API: ${res.status}`);
  const data = await res.json();
  return data.items ?? [];
}

/**
 * Request call stats export (async).
 * Returns a request_id that must be polled.
 */
export async function requestCallStats(daysAgoStart: number): Promise<string> {
  // Get office ID first
  const companyRes = await fetch(`${DIALPAD_BASE}/company`, { headers: getHeaders() });
  if (!companyRes.ok) throw new Error(`Dialpad company API: ${companyRes.status}`);
  const company = await companyRes.json();

  // Get the first office
  const officesRes = await fetch(`${DIALPAD_BASE}/offices`, { headers: getHeaders() });
  if (!officesRes.ok) throw new Error(`Dialpad offices API: ${officesRes.status}`);
  const offices = await officesRes.json();
  const officeId = offices.items?.[0]?.id ?? company.id;

  const res = await fetch(`${DIALPAD_BASE}/stats`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      stat_type: 'calls',
      days_ago_start: daysAgoStart,
      export_type: 'records',
      target_type: 'office',
      target_id: String(officeId),
    }),
  });

  if (!res.ok) throw new Error(`Dialpad stats API: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.request_id;
}

/** Poll a stats request until complete. Returns the CSV download URL. */
export async function pollStatsRequest(requestId: string, maxWaitMs = 30000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${DIALPAD_BASE}/stats/${requestId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Dialpad stats poll: ${res.status}`);
    const data = await res.json();

    if (data.status === 'complete' && data.download_url) {
      return data.download_url;
    }
    if (data.status === 'failed') {
      throw new Error('Dialpad stats export failed');
    }
    // Wait 2 seconds before retry
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Dialpad stats poll timeout');
}

/** Download and parse CSV from a stats export URL */
export async function downloadCallStats(downloadUrl: string): Promise<DialpadCallRecord[]> {
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Dialpad download: ${res.status}`);
  const csv = await res.text();
  return parseCallCsv(csv);
}

/** Parse Dialpad call stats CSV into structured records */
function parseCallCsv(csv: string): DialpadCallRecord[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const records: DialpadCallRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });

    // Only include user-level records (skip office/department duplicates)
    if (row.target_type !== 'user') continue;
    // Skip internal calls
    if (row.is_internal === 'true') continue;

    const talkMinutes = parseFloat(row.talk_duration) || 0;
    const durationSeconds = Math.round(talkMinutes * 60);
    const categories = row.categories?.split(',') ?? [];
    const isMissed = categories.includes('missed') || categories.includes('voicemail') ||
      (row.voicemail === 'true') || (durationSeconds === 0 && row.direction === 'inbound');

    records.push({
      callId: row.call_id,
      dateStarted: row.date_started,
      dateConnected: row.date_connected || null,
      dateEnded: row.date_ended || null,
      direction: row.direction as 'inbound' | 'outbound',
      externalNumber: row.external_number,
      internalNumber: row.internal_number,
      name: row.name,
      email: row.email,
      durationSeconds,
      isMissed,
      voicemail: row.voicemail === 'true',
      categories,
      metadata: row,
    });
  }

  return records;
}

/** Parse a single CSV line handling quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

export interface DialpadUser {
  id: string;
  display_name: string;
  emails: string[];
  phone_numbers: string[];
  first_name: string;
  last_name: string;
  is_online: boolean;
}

export interface DialpadCallRecord {
  callId: string;
  dateStarted: string;
  dateConnected: string | null;
  dateEnded: string | null;
  direction: 'inbound' | 'outbound';
  externalNumber: string;
  internalNumber: string;
  name: string;
  email: string;
  durationSeconds: number;
  isMissed: boolean;
  voicemail: boolean;
  categories: string[];
  metadata: Record<string, string>;
}
