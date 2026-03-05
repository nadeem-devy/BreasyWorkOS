'use client';

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Database,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Table2,
  ArrowUpDown,
  X,
  Download,
  RefreshCw,
} from 'lucide-react';

const PAGE_SIZE = 25;

const ALL_TABLES = [
  // Bubble migrated tables
  'b_activity', 'b_app_usage', 'b_calendar_event', 'b_chat_message',
  'b_completion', 'b_conversation', 'b_email', 'b_invoice', 'b_job',
  'b_job_request', 'b_job_request_quality_metrics', 'b_job_service',
  'b_leads', 'b_message', 'b_next_step', 'b_next_step_smb', 'b_note',
  'b_notification', 'b_organization', 'b_published_smbs',
  'b_quote_line_item', 'b_section_engagement_track',
  'b_smb_onboard_intent', 'b_smb_quote', 'b_snapshot_market',
  'b_snapshot_mm', 'b_snapshot_pmc', 'b_usage_metrics', 'b_user',
  'b_utm_views', 'b_visit', 'b_blogpost',
  // Existing tables
  'activities', 'ad_accounts', 'ad_metrics', 'call_records', 'campaigns',
  'companies', 'contact_discovery_data', 'contact_expectations',
  'contact_pain_points', 'contact_preferences', 'contact_qualification',
  'contact_tags', 'contacts', 'content_accounts', 'content_posts',
  'conversations', 'deal_stage_history', 'deals', 'duplicate_groups',
  'email_templates', 'email_tracking', 'enrichment_jobs',
  'goal_snapshots', 'goals', 'import_jobs', 'lead_finder_searches',
  'market_manager_assignments', 'messages', 'objection_library',
  'pipeline_stages', 'playbooks', 'post_metrics', 'red_flags',
  'sequence_enrollments', 'sequence_steps', 'sequences',
  'step_conditions', 'sync_log', 'system_logs', 'tags', 'tasks',
  'twilio_numbers', 'users', 'utm_events', 'utm_links', 'vapi_agents',
  'vapi_call_logs', 'webhook_logs',
];

type TableInfo = { name: string; count: number };
type SortConfig = { column: string; ascending: boolean } | null;

export default function DbExplorerPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('');
  const [sort, setSort] = useState<SortConfig>(null);
  const [loading, setLoading] = useState(false);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [tableFilter, setTableFilter] = useState('');

  const supabase = useMemo(() => createClient(), []);

  // Fetch all table names and row counts in parallel
  useEffect(() => {
    async function loadTables() {
      setTablesLoading(true);

      const results = await Promise.allSettled(
        ALL_TABLES.map(async (table) => {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          return { name: table, count: count ?? 0 };
        })
      );

      const tableNames: TableInfo[] = results
        .filter((r): r is PromiseFulfilledResult<TableInfo> => r.status === 'fulfilled')
        .map(r => r.value);

      tableNames.sort((a, b) => b.count - a.count);
      setTables(tableNames);
      setTablesLoading(false);
    }

    loadTables();
  }, [supabase]);

  // Fetch data when table, page, search, or sort changes
  const fetchData = useCallback(async () => {
    if (!selectedTable) return;
    setLoading(true);

    let query = supabase
      .from(selectedTable)
      .select('*', { count: 'exact' });

    // Apply search
    if (searchTerm && searchColumn) {
      query = query.ilike(searchColumn, `%${searchTerm}%`);
    }

    // Apply sort
    if (sort) {
      query = query.order(sort.column, { ascending: sort.ascending });
    }

    // Pagination
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data: rows, count, error } = await query;

    if (error) {
      console.error('Query error:', error);
      setData([]);
      setTotalCount(0);
    } else {
      setData(rows ?? []);
      setTotalCount(count ?? 0);
      if (rows && rows.length > 0) {
        setColumns(Object.keys(rows[0]));
      }
    }

    setLoading(false);
  }, [supabase, selectedTable, page, searchTerm, searchColumn, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Select a table
  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName);
    setPage(0);
    setSearchTerm('');
    setSearchColumn('');
    setSort(null);
    setExpandedRow(null);
  };

  // Toggle sort
  const handleSort = (column: string) => {
    if (sort?.column === column) {
      if (sort.ascending) {
        setSort({ column, ascending: false });
      } else {
        setSort(null);
      }
    } else {
      setSort({ column, ascending: true });
    }
    setPage(0);
  };

  // Apply search
  const handleSearch = () => {
    setPage(0);
    fetchData();
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchColumn('');
    setPage(0);
  };

  // Format cell value for display
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === 'object') return JSON.stringify(value);
    const str = String(value);
    if (str.length > 60) return str.slice(0, 60) + '...';
    return str;
  };

  // Export to CSV
  const exportCSV = () => {
    if (!data.length) return;
    const headers = columns.join(',');
    const rows = data.map(row =>
      columns.map(col => {
        const val = row[col];
        const str = val === null || val === undefined ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_page${page + 1}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(tableFilter.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Sidebar: Table List */}
      <div className="w-64 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Database size={16} className="text-blue-500" />
            Tables ({tables.length})
          </div>
          <input
            type="text"
            placeholder="Filter tables..."
            value={tableFilter}
            onChange={e => setTableFilter(e.target.value)}
            className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 5.5rem)' }}>
          {tablesLoading ? (
            <div className="flex h-32 items-center justify-center text-xs text-gray-400">
              Loading tables...
            </div>
          ) : (
            filteredTables.map(t => (
              <button
                key={t.name}
                onClick={() => handleSelectTable(t.name)}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors hover:bg-gray-50 ${
                  selectedTable === t.name
                    ? 'border-l-2 border-blue-500 bg-blue-50 font-medium text-blue-700'
                    : 'text-gray-600'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Table2 size={12} className="shrink-0 text-gray-400" />
                  {t.name}
                </span>
                <span className="ml-1 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                  {t.count.toLocaleString()}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main: Data View */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {!selectedTable ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            Select a table from the sidebar to view data
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-800">
                  {selectedTable}
                </h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                  {totalCount.toLocaleString()} rows
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchData}
                  className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  title="Refresh"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={exportCSV}
                  className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  title="Export CSV"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2">
              <Search size={14} className="text-gray-400" />
              <select
                value={searchColumn}
                onChange={e => setSearchColumn(e.target.value)}
                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none"
              >
                <option value="">Column...</option>
                {columns.map(col => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search value..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs outline-none focus:border-blue-400"
              />
              <button
                onClick={handleSearch}
                className="rounded-md bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600"
              >
                Search
              </button>
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex h-32 items-center justify-center text-xs text-gray-400">
                  Loading...
                </div>
              ) : data.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-xs text-gray-400">
                  No data found
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="w-8 border-b border-gray-200 px-3 py-2 text-center text-[10px] font-medium text-gray-400">
                        #
                      </th>
                      {columns.map(col => (
                        <th
                          key={col}
                          onClick={() => handleSort(col)}
                          className="cursor-pointer border-b border-gray-200 px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                          <span className="flex items-center gap-1">
                            {col}
                            {sort?.column === col ? (
                              <ChevronDown
                                size={10}
                                className={`transition-transform ${
                                  sort.ascending ? '' : 'rotate-180'
                                }`}
                              />
                            ) : (
                              <ArrowUpDown size={10} className="text-gray-300" />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <Fragment key={i}>
                        <tr
                          onClick={() =>
                            setExpandedRow(expandedRow === i ? null : i)
                          }
                          className={`cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/50 ${
                            expandedRow === i ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <td className="px-3 py-2 text-center text-[10px] text-gray-400">
                            {page * PAGE_SIZE + i + 1}
                          </td>
                          {columns.map(col => (
                            <td
                              key={col}
                              className="max-w-[200px] truncate whitespace-nowrap px-3 py-2 text-gray-700"
                            >
                              {formatValue(row[col])}
                            </td>
                          ))}
                        </tr>
                        {expandedRow === i && (
                          <tr>
                            <td
                              colSpan={columns.length + 1}
                              className="border-b border-blue-100 bg-blue-50/20 p-4"
                            >
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                {columns.map(col => (
                                  <div key={col}>
                                    <span className="font-medium text-gray-500">
                                      {col}:
                                    </span>
                                    <pre className="mt-0.5 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-[11px] text-gray-800">
                                      {row[col] === null
                                        ? 'null'
                                        : typeof row[col] === 'object'
                                          ? JSON.stringify(row[col], null, 2)
                                          : String(row[col])}
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
              <span className="text-[11px] text-gray-500">
                Showing {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, totalCount)} of{' '}
                {totalCount.toLocaleString()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 text-xs text-gray-600">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
