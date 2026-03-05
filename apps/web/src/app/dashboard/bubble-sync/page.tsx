'use client';

import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { format, formatDistanceToNow } from 'date-fns';
import {
  RefreshCw,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Database,
  FileText,
  Receipt,
  ArrowRightLeft,
  Briefcase,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Trash2,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SyncState {
  data_type: string;
  last_incremental_sync_at: string | null;
  last_full_reconcile_at: string | null;
  last_record_count: number;
  updated_at: string;
}

interface FieldChange {
  field: string;
  old_value: string;
  new_value: string;
}

interface SyncRecord {
  bubble_thing_id: string;
  wo_id: string;
  status: string;
  data_type: string;
  synced?: boolean;
  is_new?: boolean;
  field_changes?: FieldChange[];
  error?: string;
  stage?: string;
  market?: string;
  vendor?: string;
  address?: string;
  amount?: number | null;
  invoice_number?: string;
  bill_number?: string;
  vendor_name?: string;
}

interface BubbleWorkload {
  api_calls: number;
  total_wu: number;
  total_time_ms: number;
}

interface SyncResultDetail {
  fetched: number;
  upserted: number;
  events: number;
  errors: string[];
  records: SyncRecord[];
  workload?: BubbleWorkload;
}

interface SyncRun {
  id: string;
  timestamp: string;
  action: string;
  type: 'success' | 'error';
  message: string;
  results: Record<string, SyncResultDetail>;
}

const STORAGE_KEY = 'bubble-sync-runs';
const MAX_RUNS = 20;

function loadRuns(): SyncRun[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRun(run: SyncRun) {
  const runs = loadRuns();
  runs.unshift(run);
  if (runs.length > MAX_RUNS) runs.length = MAX_RUNS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

function clearRuns() {
  localStorage.removeItem(STORAGE_KEY);
}

const DATA_TYPE_LABELS: Record<string, { label: string; icon: typeof Database }> = {
  work_orders: { label: 'Work Orders', icon: Database },
  invoices: { label: 'Invoices', icon: FileText },
  vendor_bills: { label: 'Vendor Bills', icon: Receipt },
};

function BubbleSyncContent() {
  const [syncStates, setSyncStates] = useState<SyncState[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [tablesMissing, setTablesMissing] = useState(false);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    setRuns(loadRuns());
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bubble-sync?view=status');
      const data = await res.json();
      setSyncStates(data.sync_state ?? []);
      setCounts(data.counts ?? {});
      setTablesMissing(data.tables_missing === true);
    } catch {
      console.error('Failed to fetch sync status');
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await fetchStatus();
      setLoading(false);
    }
    load();
  }, [fetchStatus]);

  async function triggerSync(action: 'sync' | 'reconcile', dataType?: string) {
    const label = dataType === 'work_orders' ? 'jobs_sync' : action;
    setSyncing(label);
    try {
      const body: Record<string, string> = { action };
      if (dataType) body.data_type = dataType;

      const res = await fetch('/api/admin/bubble-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      const actionLabel = dataType === 'work_orders'
        ? 'Sync Jobs'
        : action === 'sync'
          ? 'Quick Sync'
          : 'Full Reconcile';

      const run: SyncRun = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: actionLabel,
        type: res.ok ? 'success' : 'error',
        message: res.ok
          ? `${actionLabel} completed`
          : (data.error ?? 'Sync failed'),
        results: data.results ?? {},
      };

      saveRun(run);
      setRuns(loadRuns());
      setExpandedRun(run.id);
      await fetchStatus();
    } catch {
      const run: SyncRun = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: 'Sync',
        type: 'error',
        message: 'Network error — check if dev server is running',
        results: {},
      };
      saveRun(run);
      setRuns(loadRuns());
      setExpandedRun(run.id);
    } finally {
      setSyncing(null);
    }
  }

  function handleClearRuns() {
    clearRuns();
    setRuns([]);
    setExpandedRun(null);
  }

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-gray-400">
        Loading sync status...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightLeft size={20} className="text-indigo-600" />
          <h1 className="text-lg font-semibold text-gray-900">Bubble Sync</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => triggerSync('sync', 'work_orders')}
            disabled={syncing !== null}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            {syncing === 'jobs_sync' ? <RefreshCw size={14} className="animate-spin" /> : <Briefcase size={14} />}
            <span className="flex flex-col items-start leading-tight">
              <span>{syncing === 'jobs_sync' ? 'Syncing Jobs...' : 'Sync Jobs'}</span>
              <span className="text-[10px] font-normal opacity-75">Instant</span>
            </span>
          </button>
          <button
            onClick={() => triggerSync('sync')}
            disabled={syncing !== null}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {syncing === 'sync' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            <span className="flex flex-col items-start leading-tight">
              <span>{syncing === 'sync' ? 'Syncing...' : 'Quick Sync'}</span>
              <span className="text-[10px] font-normal opacity-75">Every 5 min</span>
            </span>
          </button>
          <button
            onClick={() => triggerSync('reconcile')}
            disabled={syncing !== null}
            className="flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
          >
            {syncing === 'reconcile' ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span className="flex flex-col items-start leading-tight">
              <span>{syncing === 'reconcile' ? 'Reconciling...' : 'Full Reconcile'}</span>
              <span className="text-[10px] font-normal opacity-75">Hourly</span>
            </span>
          </button>
        </div>
      </div>

      {/* Tables missing warning */}
      {tablesMissing && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800">Database Setup Required</h3>
              <p className="mt-1 text-sm text-amber-700">
                Mirror tables don&apos;t exist yet. Run the migration SQL in{' '}
                <a href="https://supabase.com/dashboard/project/caursmdeoghqixudiscb/sql/new" target="_blank" rel="noopener noreferrer" className="font-medium underline">
                  Supabase SQL Editor
                </a>{' '}— paste contents of{' '}
                <code className="rounded bg-amber-100 px-1 py-0.5 text-xs font-mono">supabase/migrations/20260221000001_bubble_mirror_tables.sql</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sync State Cards */}
      {!tablesMissing && syncStates.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {syncStates.map((state) => {
            const config = DATA_TYPE_LABELS[state.data_type] ?? { label: state.data_type, icon: Database };
            const Icon = config.icon;
            const count = counts[state.data_type] ?? 0;
            return (
              <div key={state.data_type} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Icon size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-medium text-gray-900">{config.label}</h3>
                </div>
                <div className="mb-3">
                  <p className="text-2xl font-semibold text-gray-900">{count.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">records in mirror</p>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-gray-500">Last sync:</span>
                    <span className="text-gray-700">
                      {state.last_incremental_sync_at ? formatDistanceToNow(new Date(state.last_incremental_sync_at), { addSuffix: true }) : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RefreshCw size={12} className="text-gray-400" />
                    <span className="text-gray-500">Last reconcile:</span>
                    <span className="text-gray-700">
                      {state.last_full_reconcile_at ? formatDistanceToNow(new Date(state.last_full_reconcile_at), { addSuffix: true }) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sync Run History */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-600">
            Sync Run History {runs.length > 0 && <span className="text-gray-400">({runs.length} runs)</span>}
          </h2>
          {runs.length > 0 && (
            <button onClick={handleClearRuns} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500">
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>

        {runs.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
            Click a sync button above — each run and its data will be saved here
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => {
              const isExpanded = expandedRun === run.id;
              const totalFetched = Object.values(run.results).reduce((s, r) => s + r.fetched, 0);
              const totalUpserted = Object.values(run.results).reduce((s, r) => s + r.upserted, 0);
              const allRecords = Object.values(run.results).flatMap((r) => r.records ?? []);
              const newCount = allRecords.filter((r) => r.is_new).length;
              const updatedCount = allRecords.filter((r) => r.field_changes && r.field_changes.length > 0).length;
              const totalWu = Object.values(run.results).reduce((s, r) => s + (r.workload?.total_wu ?? 0), 0);
              const totalApiCalls = Object.values(run.results).reduce((s, r) => s + (r.workload?.api_calls ?? 0), 0);
              const totalTimeMs = Object.values(run.results).reduce((s, r) => s + (r.workload?.total_time_ms ?? 0), 0);
              const hasErrors = Object.values(run.results).some((r) =>
                r.errors?.some((e) => !e.startsWith('[info]') && !e.startsWith('[done]')),
              );

              return (
                <div key={run.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                  {/* Run header — click to expand */}
                  <button
                    onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      run.type === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {run.type === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {run.action}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(run.timestamp), 'MMM d, h:mm:ss a')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {totalFetched} fetched, {totalUpserted} saved
                      {newCount > 0 && <span className="ml-1 text-emerald-500">({newCount} new)</span>}
                      {updatedCount > 0 && <span className="ml-1 text-amber-500">({updatedCount} updated)</span>}
                    </span>
                    {totalWu > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        <Zap size={10} />
                        {totalWu.toFixed(2)} WU
                      </span>
                    )}
                    {hasErrors && <span className="text-xs text-red-400">has errors</span>}
                    <span className="ml-auto text-xs text-gray-300">
                      {formatDistanceToNow(new Date(run.timestamp), { addSuffix: true })}
                    </span>
                  </button>

                  {/* Expanded: show records table */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {/* Errors if any */}
                      {hasErrors && (
                        <div className="bg-red-50 px-4 py-2 border-b border-red-100">
                          {Object.entries(run.results).map(([type, stats]) =>
                            (stats.errors ?? [])
                              .filter((e) => !e.startsWith('[info]') && !e.startsWith('[done]'))
                              .map((err, i) => (
                                <p key={`${type}-${i}`} className="text-xs text-red-600 font-mono">
                                  [{DATA_TYPE_LABELS[type]?.label ?? type}] {err}
                                </p>
                              )),
                          )}
                        </div>
                      )}

                      {/* Workload summary */}
                      {totalWu > 0 && (
                        <div className="flex items-center gap-4 border-b border-gray-100 bg-amber-50/50 px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            <Zap size={12} className="text-amber-500" />
                            <span className="text-xs font-medium text-amber-800">Bubble Credits</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-amber-700">
                              <span className="font-semibold">{totalWu.toFixed(3)}</span> WU total
                            </span>
                            <span className="text-amber-600">
                              {totalApiCalls} API call{totalApiCalls !== 1 ? 's' : ''}
                            </span>
                            <span className="text-amber-600">
                              {(totalTimeMs / 1000).toFixed(1)}s server time
                            </span>
                            {Object.entries(run.results).map(([type, stats]) =>
                              stats.workload && stats.workload.total_wu > 0 ? (
                                <span key={type} className="text-amber-500">
                                  {DATA_TYPE_LABELS[type]?.label ?? type}: {stats.workload.total_wu.toFixed(3)} WU ({stats.workload.api_calls} calls)
                                </span>
                              ) : null,
                            )}
                          </div>
                        </div>
                      )}

                      {allRecords.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-gray-400">
                          {run.type === 'error' ? run.message : 'No records in this run'}
                        </div>
                      ) : (
                        <div className="max-h-[400px] overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50">
                              <tr className="border-b border-gray-200">
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">WO / Ref</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Changes</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Details</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Saved</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allRecords.map((rec, i) => (
                                <tr key={`${rec.bubble_thing_id}-${i}`} className="border-b border-gray-50 hover:bg-gray-50">
                                  <td className="px-3 py-1.5">
                                    <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                                      {rec.data_type === 'work_orders' ? 'Job' : rec.data_type === 'invoices' ? 'Invoice' : 'Bill'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-1.5 text-xs font-medium text-gray-800">
                                    {rec.wo_id || rec.bubble_thing_id.slice(0, 12) + '...'}
                                    {rec.invoice_number && <span className="ml-1 text-gray-400">#{rec.invoice_number}</span>}
                                    {rec.bill_number && <span className="ml-1 text-gray-400">#{rec.bill_number}</span>}
                                  </td>
                                  <td className="px-3 py-1.5">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                      rec.status?.toLowerCase().includes('complete') ? 'text-green-600 bg-green-50'
                                      : rec.status?.toLowerCase().includes('active') || rec.status?.toLowerCase().includes('open') ? 'text-blue-600 bg-blue-50'
                                      : rec.status?.toLowerCase().includes('cancel') || rec.status?.toLowerCase().includes('void') ? 'text-red-600 bg-red-50'
                                      : 'text-gray-600 bg-gray-50'
                                    }`}>
                                      {rec.status || '—'}
                                    </span>
                                    {rec.stage && rec.stage !== rec.status && (
                                      <span className="ml-1 text-xs text-gray-400">{rec.stage}</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-1.5">
                                    {rec.is_new ? (
                                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">
                                        New
                                      </span>
                                    ) : rec.field_changes && rec.field_changes.length > 0 ? (
                                      <div className="flex flex-col gap-0.5">
                                        {rec.field_changes.map((fc, j) => (
                                          <div key={j} className="flex items-center gap-1 text-[11px]">
                                            <span className="font-medium text-gray-600">{fc.field}:</span>
                                            {fc.old_value && (
                                              <>
                                                <span className="text-red-400 line-through">{fc.old_value}</span>
                                                <span className="text-gray-300">&rarr;</span>
                                              </>
                                            )}
                                            <span className="text-emerald-600 font-medium">{fc.new_value || '(empty)'}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-gray-300">No changes</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-1.5 text-xs text-gray-500 max-w-[200px] truncate">
                                    {rec.amount != null && <span className="mr-2">${Number(rec.amount).toLocaleString()}</span>}
                                    {(rec.vendor || rec.vendor_name) && <span className="mr-2">{rec.vendor || rec.vendor_name}</span>}
                                    {rec.market && <span className="mr-2">{rec.market}</span>}
                                    {rec.address && <span>{rec.address}</span>}
                                  </td>
                                  <td className="px-3 py-1.5">
                                    {rec.synced ? (
                                      <CheckCircle2 size={14} className="text-green-500" />
                                    ) : rec.error ? (
                                      <span className="text-xs text-red-500" title={rec.error}>Failed</span>
                                    ) : (
                                      <span className="text-xs text-gray-300">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BubbleSyncPage() {
  return (
    <SupabaseProvider>
      <BubbleSyncContent />
    </SupabaseProvider>
  );
}
