'use client';

import ExportButton from '@/components/shared/ExportButton';
import { useEffect, useState, useCallback } from 'react';
import { BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AllocationRow {
  user_id: string;
  full_name: string;
  bubble: number;
  gmail: number;
  dialpad: number;
  melio: number;
  other: number;
  idle: number;
  total: number;
  session_count: number;
  first_start: string | null;
  last_end: string | null;
}

interface DomainEntry {
  domain: string;
  seconds: number;
}

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Known app domains to exclude from "Other" breakdown
const KNOWN_DOMAINS = new Set([
  'app.joinbreasy.com', 'mail.google.com', 'dialpad.com',
  'app.dialpad.com', 'app.melio.com',
]);
function isKnownDomain(domain: string) {
  if (KNOWN_DOMAINS.has(domain)) return true;
  if (domain.endsWith('.bubble.io') || domain.endsWith('.bubbleapps.io')) return true;
  return false;
}

export default function TimeAllocationPage() {
  const [data, setData] = useState<AllocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [domainBreakdown, setDomainBreakdown] = useState<DomainEntry[]>([]);
  const [domainLoading, setDomainLoading] = useState(false);
  const [allDomains, setAllDomains] = useState<Record<string, DomainEntry[]>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/time-allocation?date=${date}&period=${period}`);
      const json = await res.json();
      setData(json.rows ?? []);

      // Preload domain data for all users (for chart tooltip)
      const startDate = period === 'day'
        ? date
        : period === 'week'
          ? format(new Date(new Date(date).getTime() - 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
          : format(new Date(new Date(date).getTime() - 29 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

      const domRes = await fetch(`/api/admin/domains?date=${startDate}&endDate=${date}`);
      const domData = await domRes.json();
      if (Array.isArray(domData)) {
        const byUser: Record<string, DomainEntry[]> = {};
        for (const d of domData) {
          if (!d.user_id || isKnownDomain(d.domain)) continue;
          if (!byUser[d.user_id]) byUser[d.user_id] = [];
          const existing = byUser[d.user_id].find((e) => e.domain === d.domain);
          if (existing) existing.seconds += d.seconds;
          else byUser[d.user_id].push({ domain: d.domain, seconds: d.seconds });
        }
        for (const uid of Object.keys(byUser)) {
          byUser[uid].sort((a, b) => b.seconds - a.seconds);
        }
        setAllDomains(byUser);
      }
    } catch {
      setData([]);
    }
    setLoading(false);
  }, [period, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggleDomainBreakdown(userId: string) {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setDomainBreakdown([]);
      return;
    }

    setExpandedUser(userId);
    setDomainLoading(true);

    const startDate = period === 'day'
      ? date
      : period === 'week'
        ? format(new Date(new Date(date).getTime() - 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        : format(new Date(new Date(date).getTime() - 29 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

    const res = await fetch(
      `/api/admin/domains?userId=${userId}&date=${startDate}&endDate=${date}`
    );
    const domains = await res.json();

    if (Array.isArray(domains)) {
      const otherDomains = domains
        .filter((d: DomainEntry) => !isKnownDomain(d.domain))
        .sort((a: DomainEntry, b: DomainEntry) => b.seconds - a.seconds);
      setDomainBreakdown(otherDomains);
    }
    setDomainLoading(false);
  }

  const chartData = data.map((r) => ({
    name: r.full_name.split(' ')[0],
    userId: r.user_id,
    Bubble: Math.round(r.bubble / 60),
    Gmail: Math.round(r.gmail / 60),
    Dialpad: Math.round(r.dialpad / 60),
    Melio: Math.round(r.melio / 60),
    Other: Math.round(r.other / 60),
    Idle: Math.round(r.idle / 60),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const userId = payload[0]?.payload?.userId;
    const domains = userId ? allDomains[userId] ?? [] : [];
    const topDomains = domains.slice(0, 8);

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs">
        <p className="font-semibold text-gray-900 mb-1.5">{label}</p>
        {payload.map((entry: { name: string; value: number; color: string }) => (
          <div key={entry.name} className="flex items-center justify-between gap-4" style={{ color: entry.color }}>
            <span>{entry.name}</span>
            <span className="font-medium">{entry.value}m</span>
          </div>
        ))}
        {topDomains.length > 0 && (
          <>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="font-medium text-gray-500 mb-1">Other Domains:</p>
              {topDomains.map((d) => (
                <div key={d.domain} className="flex items-center justify-between gap-3 text-gray-600">
                  <span className="truncate max-w-[160px]">{d.domain}</span>
                  <span className="tabular-nums">{formatHours(d.seconds)}</span>
                </div>
              ))}
              {domains.length > 8 && (
                <p className="text-gray-400 mt-0.5">+{domains.length - 8} more</p>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const totalActive = data.reduce((acc, r) => acc + r.total - r.idle, 0);
  const avgPerPerson = data.length > 0 ? Math.round(totalActive / data.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-gray-600" />
          <h1 className="text-lg font-semibold text-gray-900">Time Allocation</h1>
        </div>
        <ExportButton view="time-allocation" params={{ start_date: date }} />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-gray-300">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm capitalize ${
                period === p ? 'bg-[#1c2b3d] text-white' : 'text-gray-600 hover:bg-gray-50'
              } ${p === 'day' ? 'rounded-l-lg' : ''} ${p === 'month' ? 'rounded-r-lg' : ''}`}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">Loading...</div>
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
          No session data for this period
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 60 }}>
                <XAxis type="number" label={{ value: 'Minutes', position: 'insideBottom', offset: -5 }} />
                <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Bubble" fill="#3B82F6" stackId="a" />
                <Bar dataKey="Gmail" fill="#EF4444" stackId="a" />
                <Bar dataKey="Dialpad" fill="#8B5CF6" stackId="a" />
                <Bar dataKey="Melio" fill="#10B981" stackId="a" />
                <Bar dataKey="Other" fill="#F59E0B" stackId="a" />
                <Bar dataKey="Idle" fill="#D1D5DB" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Total Active</p>
              <p className="text-xl font-semibold text-gray-900">{formatHours(totalActive)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Avg / Person</p>
              <p className="text-xl font-semibold text-gray-900">{formatHours(avgPerPerson)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">People Tracked</p>
              <p className="text-xl font-semibold text-gray-900">{data.length}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Start Time</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">End Time</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Bubble</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Gmail</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Dialpad</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Melio</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Other</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Idle</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <>
                    <tr key={r.user_id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{r.full_name}</td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {r.first_start ? format(new Date(r.first_start), 'h:mm a') : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {r.last_end ? format(new Date(r.last_end), 'h:mm a') : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{formatHours(r.bubble)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{formatHours(r.gmail)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{formatHours(r.dialpad)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{formatHours(r.melio)}</td>
                      <td className="px-4 py-2.5">
                        {r.other > 0 ? (
                          <button
                            onClick={() => toggleDomainBreakdown(r.user_id)}
                            className="flex items-center gap-1 text-amber-600 hover:text-amber-700"
                          >
                            {formatHours(r.other)}
                            {expandedUser === r.user_id
                              ? <ChevronDown size={14} />
                              : <ChevronRight size={14} />}
                          </button>
                        ) : (
                          <span className="text-gray-600">{formatHours(r.other)}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{formatHours(r.idle)}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{formatHours(r.total)}</td>
                    </tr>
                    {expandedUser === r.user_id && (
                      <tr key={`${r.user_id}-domains`} className="border-b border-gray-100">
                        <td colSpan={10} className="bg-amber-50/50 px-4 py-3">
                          {domainLoading ? (
                            <span className="text-xs text-gray-400">Loading domains...</span>
                          ) : domainBreakdown.length === 0 ? (
                            <span className="text-xs text-gray-400">No domain data available yet</span>
                          ) : (
                            <div className="space-y-1.5">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Other Domains Breakdown
                              </p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                {domainBreakdown.map((d) => (
                                  <div key={d.domain} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-700 truncate max-w-[200px]" title={d.domain}>
                                      {d.domain}
                                    </span>
                                    <span className="ml-2 font-medium text-gray-900 tabular-nums">
                                      {formatHours(d.seconds)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
