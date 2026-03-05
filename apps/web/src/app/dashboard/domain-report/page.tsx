'use client';

import { useEffect, useState } from 'react';
import { Globe, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  full_name: string;
}

interface DomainEntry {
  domain: string;
  seconds: number;
  user_id?: string;
}

interface ActivityFlag {
  id: number;
  user_id: string;
  flag_type: string;
  confidence: number;
  details: Record<string, unknown>;
  flagged_at: string;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

function formatPercent(part: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

const FLAG_LABELS: Record<string, string> = {
  mouse_jiggler: 'Mouse Jiggler Detected',
  periodic_clicks: 'Periodic Fake Clicks',
  no_real_input: 'No Real Input (Mouse Only)',
};

export default function DomainReportPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [flags, setFlags] = useState<ActivityFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [userDomains, setUserDomains] = useState<Record<string, DomainEntry[]>>({});

  // Fetch users
  useEffect(() => {
    fetch('/api/admin/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data.filter((u: UserProfile & { is_active?: boolean }) => u.is_active !== false));
      });
  }, []);

  // Fetch domains + flags when date or user changes
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const userParam = selectedUser !== 'all' ? `&userId=${selectedUser}` : '';
      const [domainsRes, flagsRes] = await Promise.all([
        fetch(`/api/admin/domains?date=${date}${userParam}`),
        fetch(`/api/admin/activity-flags?reviewed=false`),
      ]);

      const domainsData = await domainsRes.json();
      const flagsData = await flagsRes.json();

      if (Array.isArray(domainsData)) {
        // Aggregate by domain across all users
        const agg: Record<string, number> = {};
        for (const d of domainsData) {
          agg[d.domain] = (agg[d.domain] ?? 0) + d.seconds;
        }
        const sorted = Object.entries(agg)
          .map(([domain, seconds]) => ({ domain, seconds }))
          .sort((a, b) => b.seconds - a.seconds);
        setDomains(sorted);
      }

      if (Array.isArray(flagsData)) {
        // Filter flags to selected date
        const dayFlags = flagsData.filter((f: ActivityFlag) =>
          f.flagged_at.startsWith(date)
        );
        setFlags(selectedUser !== 'all'
          ? dayFlags.filter((f: ActivityFlag) => f.user_id === selectedUser)
          : dayFlags
        );
      }

      setLoading(false);
    }
    fetchData();
  }, [date, selectedUser]);

  async function loadDomainUsers(domain: string) {
    if (expandedDomain === domain) {
      setExpandedDomain(null);
      return;
    }
    setExpandedDomain(domain);

    if (selectedUser !== 'all') return; // No need to expand if single user

    // Fetch per-user breakdown for this domain
    const res = await fetch(`/api/admin/domains?date=${date}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      const byUser: Record<string, number> = {};
      for (const d of data) {
        if (d.domain === domain && d.user_id) {
          byUser[d.user_id] = (byUser[d.user_id] ?? 0) + d.seconds;
        }
      }
      const entries = Object.entries(byUser)
        .map(([userId, seconds]) => ({ domain, seconds, user_id: userId }))
        .sort((a, b) => b.seconds - a.seconds);
      setUserDomains((prev) => ({ ...prev, [domain]: entries }));
    }
  }

  function getUserName(userId: string): string {
    return users.find((u) => u.id === userId)?.full_name ?? userId.slice(0, 8);
  }

  const totalSeconds = domains.reduce((acc, d) => acc + d.seconds, 0);
  const topDomains = domains.slice(0, 10);
  const otherDomains = domains.slice(10);
  const otherSeconds = otherDomains.reduce((acc, d) => acc + d.seconds, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe size={20} className="text-gray-600" />
          <h1 className="text-lg font-semibold text-gray-900">Domain Report</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        />
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="all">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </select>
      </div>

      {/* Activity Flags */}
      {flags.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-800">
            <AlertTriangle size={16} />
            Suspicious Activity Detected ({flags.length} flag{flags.length > 1 ? 's' : ''})
          </div>
          <div className="space-y-1.5">
            {flags.map((f) => (
              <div key={f.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-amber-900">{getUserName(f.user_id)}</span>
                  <span className="text-amber-700">{FLAG_LABELS[f.flag_type] ?? f.flag_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                    {f.confidence}% confidence
                  </span>
                  <span className="text-amber-600">
                    {format(new Date(f.flagged_at), 'h:mm a')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">Loading...</div>
      ) : domains.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
          No domain data for this date
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Total Tracked Time</p>
              <p className="text-xl font-semibold text-gray-900">{formatTime(totalSeconds)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Unique Domains</p>
              <p className="text-xl font-semibold text-gray-900">{domains.length}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Top Domain</p>
              <p className="text-xl font-semibold text-gray-900 truncate" title={domains[0]?.domain}>
                {domains[0]?.domain ?? '—'}
              </p>
            </div>
          </div>

          {/* Top domains bar visualization */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-medium text-gray-600">Top Domains by Time</h2>
            <div className="space-y-2">
              {topDomains.map((d) => {
                const pct = totalSeconds > 0 ? (d.seconds / totalSeconds) * 100 : 0;
                return (
                  <div key={d.domain} className="group">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-medium text-gray-800 truncate max-w-[300px]">{d.domain}</span>
                      <span className="text-gray-500 tabular-nums">{formatTime(d.seconds)} ({formatPercent(d.seconds, totalSeconds)})</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${Math.max(pct, 0.5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {otherSeconds > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="font-medium text-gray-500">Other ({otherDomains.length} domains)</span>
                    <span className="text-gray-500 tabular-nums">{formatTime(otherSeconds)} ({formatPercent(otherSeconds, totalSeconds)})</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-gray-300"
                      style={{ width: `${Math.max((otherSeconds / totalSeconds) * 100, 0.5)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full domain table */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-8">#</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Domain</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-600">Time</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-600">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d, i) => (
                  <>
                    <tr
                      key={d.domain}
                      className={`border-b border-gray-100 last:border-0 ${
                        selectedUser === 'all' ? 'cursor-pointer hover:bg-gray-50' : ''
                      }`}
                      onClick={() => selectedUser === 'all' && loadDomainUsers(d.domain)}
                    >
                      <td className="px-4 py-2.5 text-gray-400 tabular-nums">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        <div className="flex items-center gap-1.5">
                          {selectedUser === 'all' && (
                            expandedDomain === d.domain
                              ? <ChevronDown size={14} className="text-gray-400" />
                              : <ChevronRight size={14} className="text-gray-400" />
                          )}
                          {d.domain}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600 tabular-nums">{formatTime(d.seconds)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600 tabular-nums">{formatPercent(d.seconds, totalSeconds)}</td>
                    </tr>
                    {expandedDomain === d.domain && selectedUser === 'all' && userDomains[d.domain] && (
                      <tr key={`${d.domain}-users`}>
                        <td colSpan={4} className="bg-gray-50 px-8 py-2">
                          <div className="space-y-1">
                            {userDomains[d.domain].map((ud) => (
                              <div key={ud.user_id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700">{getUserName(ud.user_id ?? '')}</span>
                                <span className="font-medium text-gray-900 tabular-nums">{formatTime(ud.seconds)}</span>
                              </div>
                            ))}
                          </div>
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
