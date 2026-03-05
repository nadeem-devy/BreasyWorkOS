'use client';

import { SupabaseProvider, useSupabase } from '@/components/providers/SupabaseProvider';
import AppBadge from '@/components/shared/AppBadge';
import ExportButton from '@/components/shared/ExportButton';
import { format } from 'date-fns';
import { Clock, Phone, Mail, FileText, Monitor, ChevronDown, ChevronUp, LayoutGrid, PhoneOutgoing, PhoneIncoming, PhoneMissed } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

interface TimelineEntry {
  id: string;
  source: string;
  event_type: string;
  description: string;
  wo_id?: string;
  created_at: string;
  duration_seconds?: number;
  direction?: string;
  contact_name?: string;
  subject_snippet?: string;
  amount?: number;
  raw?: Record<string, unknown>;
}

interface UserOption {
  id: string;
  full_name: string;
}

interface PlatformStats {
  events: number;
  timeSeconds: number;
}

type PlatformFilter = 'all' | 'bubble' | 'gmail' | 'dialpad' | 'melio' | 'activity';

const PLATFORM_CONFIG: Record<PlatformFilter, { label: string; icon: React.ReactNode; color: string; border: string; bg: string }> = {
  all:      { label: 'All Activity',  icon: <LayoutGrid size={16} />, color: 'text-gray-700',    border: 'border-gray-400', bg: 'bg-gray-50' },
  bubble:   { label: 'Bubble',        icon: <FileText size={16} />,   color: 'text-blue-600',    border: 'border-blue-400', bg: 'bg-blue-50' },
  gmail:    { label: 'Gmail',         icon: <Mail size={16} />,       color: 'text-red-600',     border: 'border-red-400',  bg: 'bg-red-50' },
  dialpad:  { label: 'Dialpad',       icon: <Phone size={16} />,      color: 'text-purple-600',  border: 'border-purple-400', bg: 'bg-purple-50' },
  melio:    { label: 'Melio',         icon: <Monitor size={16} />,    color: 'text-emerald-600', border: 'border-emerald-400', bg: 'bg-emerald-50' },
  activity: { label: 'Activity',      icon: <Clock size={16} />,      color: 'text-amber-600',   border: 'border-amber-400', bg: 'bg-amber-50' },
};

function formatDuration(seconds: number): string {
  if (seconds === 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

function getEventIcon(source: string) {
  switch (source) {
    case 'dialpad': return <Phone size={14} className="text-purple-500" />;
    case 'gmail': return <Mail size={14} className="text-red-500" />;
    case 'bubble': return <FileText size={14} className="text-blue-500" />;
    case 'melio': return <Monitor size={14} className="text-emerald-500" />;
    default: return <Clock size={14} className="text-amber-500" />;
  }
}

function mapSourceToFilter(source: string): PlatformFilter {
  if (source === 'bubble' || source === 'gmail' || source === 'dialpad' || source === 'melio') return source;
  return 'activity';
}

function TimelineContent() {
  const supabase = useSupabase();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PlatformFilter>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [sessionTimes, setSessionTimes] = useState<{ bubble: number; gmail: number; dialpad: number; melio: number; idle: number }>({ bubble: 0, gmail: 0, dialpad: 0, melio: 0, idle: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/login';
        return;
      }
      supabase
        .from('OS_profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')
        .then(({ data }) => {
          if (data) setUsers(data);
        });
    });
  }, [supabase]);

  useEffect(() => {
    if (!selectedUser) return;
    setLoading(true);
    setActiveFilter('all');
    setExpandedEntry(null);

    async function fetchTimeline() {
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;
      const allEntries: TimelineEntry[] = [];

      const [bubble, financial, gmail, dialpad, melio, activity, sessions] = await Promise.all([
        supabase.from('OS_bubble_events').select('*').eq('user_id', selectedUser).gte('created_at', startOfDay).lte('created_at', endOfDay).order('created_at'),
        supabase.from('OS_bubble_financial_events').select('*').eq('user_id', selectedUser).gte('created_at', startOfDay).lte('created_at', endOfDay).order('created_at'),
        supabase.from('OS_gmail_events').select('*').eq('user_id', selectedUser).gte('created_at', startOfDay).lte('created_at', endOfDay).order('created_at'),
        supabase.from('OS_dialpad_events').select('*').eq('user_id', selectedUser).gte('started_at', startOfDay).lte('started_at', endOfDay).order('started_at'),
        supabase.from('OS_melio_events').select('*').eq('user_id', selectedUser).gte('created_at', startOfDay).lte('created_at', endOfDay).order('created_at'),
        supabase.from('OS_activity_events').select('*').eq('user_id', selectedUser).gte('created_at', startOfDay).lte('created_at', endOfDay).in('event_type', ['tab_activated', 'idle_start', 'idle_end']).order('created_at'),
        supabase.from('OS_sessions').select('time_bubble, time_gmail, time_dialpad, time_melio, time_idle').eq('user_id', selectedUser).gte('started_at', startOfDay).lte('started_at', endOfDay),
      ]);

      // Aggregate session times
      const times = { bubble: 0, gmail: 0, dialpad: 0, melio: 0, idle: 0 };
      sessions.data?.forEach((s) => {
        times.bubble += s.time_bubble ?? 0;
        times.gmail += s.time_gmail ?? 0;
        times.dialpad += s.time_dialpad ?? 0;
        times.melio += s.time_melio ?? 0;
        times.idle += s.time_idle ?? 0;
      });
      setSessionTimes(times);

      bubble.data?.forEach((r) => allEntries.push({
        id: `b-${r.id}`, source: 'bubble', event_type: r.event_type,
        description: `${r.event_type.replace(/_/g, ' ')} on ${r.wo_id}`,
        wo_id: r.wo_id, created_at: r.created_at,
        raw: r,
      }));
      financial.data?.forEach((r) => allEntries.push({
        id: `bf-${r.id}`, source: 'bubble', event_type: r.event_type,
        description: `${r.event_type.replace(/_/g, ' ')}${r.amount ? ` $${r.amount}` : ''} on ${r.wo_id}`,
        wo_id: r.wo_id, created_at: r.created_at, amount: r.amount,
        raw: r,
      }));
      gmail.data?.forEach((r) => allEntries.push({
        id: `g-${r.id}`, source: 'gmail', event_type: r.event_type,
        description: `Email ${r.direction === 'outbound' ? 'sent' : 'received'}${r.subject_snippet ? `: ${r.subject_snippet}` : ''}`,
        created_at: r.created_at, direction: r.direction, subject_snippet: r.subject_snippet,
        raw: r,
      }));
      dialpad.data?.forEach((r) => allEntries.push({
        id: `d-${r.id}`, source: 'dialpad', event_type: r.event_type,
        description: `Call ${r.event_type.replace('call_', '')}${r.duration_seconds ? ` (${Math.floor(r.duration_seconds / 60)}m ${r.duration_seconds % 60}s)` : ''}${r.contact_name ? ` - ${r.contact_name}` : ''}`,
        created_at: r.started_at || r.created_at, duration_seconds: r.duration_seconds,
        direction: r.direction, contact_name: r.contact_name,
        raw: r,
      }));
      melio.data?.forEach((r) => allEntries.push({
        id: `m-${r.id}`, source: 'melio', event_type: r.event_type,
        description: `Payment ${r.payment_status} - $${r.amount} to ${r.vendor_name}`,
        created_at: r.created_at, amount: r.amount,
        raw: r,
      }));
      activity.data?.forEach((r) => allEntries.push({
        id: `a-${r.id}`, source: r.app ?? 'other', event_type: r.event_type,
        description: r.event_type === 'idle_start' ? 'Went idle' : r.event_type === 'idle_end' ? 'Back to active' : `Switched to ${r.app}`,
        created_at: r.created_at,
        raw: r,
      }));

      allEntries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setEntries(allEntries);
      setLoading(false);
    }

    fetchTimeline();
  }, [supabase, selectedUser, date]);

  // Compute per-platform stats from entries
  const platformStats = useMemo(() => {
    const stats: Record<PlatformFilter, PlatformStats> = {
      all: { events: 0, timeSeconds: 0 },
      bubble: { events: 0, timeSeconds: 0 },
      gmail: { events: 0, timeSeconds: 0 },
      dialpad: { events: 0, timeSeconds: 0 },
      melio: { events: 0, timeSeconds: 0 },
      activity: { events: 0, timeSeconds: 0 },
    };
    for (const entry of entries) {
      const platform = mapSourceToFilter(entry.source);
      stats[platform].events++;
      stats.all.events++;
      // Accumulate call duration for dialpad
      if (platform === 'dialpad' && entry.duration_seconds) {
        stats.dialpad.timeSeconds += entry.duration_seconds;
      }
    }
    // Use session times where available
    stats.bubble.timeSeconds = sessionTimes.bubble;
    stats.gmail.timeSeconds = sessionTimes.gmail;
    stats.melio.timeSeconds = sessionTimes.melio;
    // For dialpad, prefer call duration sum from events (actual talk time)
    // stats.dialpad.timeSeconds is already set from events above, keep it
    // For activity, use idle time
    stats.activity.timeSeconds = sessionTimes.idle;
    // All = sum of session times + dialpad call time
    stats.all.timeSeconds = sessionTimes.bubble + sessionTimes.gmail + sessionTimes.dialpad + sessionTimes.melio + stats.dialpad.timeSeconds;
    return stats;
  }, [entries, sessionTimes]);

  const filteredEntries = useMemo(() => {
    if (activeFilter === 'all') return entries;
    return entries.filter((e) => mapSourceToFilter(e.source) === activeFilter);
  }, [entries, activeFilter]);

  // Detailed stats for the selected platform
  const detailedStats = useMemo(() => {
    if (activeFilter === 'all') return null;
    const filtered = filteredEntries;
    if (activeFilter === 'dialpad') {
      const total = filtered.length;
      const completedCalls = filtered.filter(e => e.event_type === 'call_ended');
      const missedCalls = filtered.filter(e => e.event_type === 'call_missed');
      const inboundCalls = filtered.filter(e => e.direction === 'inbound');
      const outboundCalls = filtered.filter(e => e.direction === 'outbound');
      const totalDuration = filtered.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);
      const completedDurations = completedCalls.map(e => e.duration_seconds ?? 0).filter(d => d > 0);
      const longestCall = completedDurations.length > 0 ? Math.max(...completedDurations) : 0;
      const shortestCall = completedDurations.length > 0 ? Math.min(...completedDurations) : 0;
      const avgDuration = completedDurations.length > 0 ? Math.round(totalDuration / completedDurations.length) : 0;

      // Group outbound calls by contact (who they called)
      const outboundByContact: Record<string, { count: number; duration: number; number: string }> = {};
      for (const e of outboundCalls) {
        const name = e.contact_name || (e.raw?.to_number as string) || 'Unknown';
        if (!outboundByContact[name]) outboundByContact[name] = { count: 0, duration: 0, number: (e.raw?.to_number as string) ?? '' };
        outboundByContact[name].count++;
        outboundByContact[name].duration += e.duration_seconds ?? 0;
      }

      // Group inbound calls by contact (who called them)
      const inboundByContact: Record<string, { count: number; duration: number; number: string }> = {};
      for (const e of inboundCalls) {
        const name = e.contact_name || (e.raw?.from_number as string) || 'Unknown';
        if (!inboundByContact[name]) inboundByContact[name] = { count: 0, duration: 0, number: (e.raw?.from_number as string) ?? '' };
        inboundByContact[name].count++;
        inboundByContact[name].duration += e.duration_seconds ?? 0;
      }

      return {
        type: 'dialpad' as const, total,
        completed: completedCalls.length, missed: missedCalls.length,
        inbound: inboundCalls.length, outbound: outboundCalls.length,
        totalDuration, avgDuration, longestCall, shortestCall,
        outboundByContact, inboundByContact,
      };
    }
    if (activeFilter === 'gmail') {
      const total = filtered.length;
      const sent = filtered.filter(e => e.direction === 'outbound').length;
      const received = filtered.filter(e => e.direction === 'inbound').length;
      return { type: 'gmail' as const, total, sent, received };
    }
    if (activeFilter === 'bubble') {
      const total = filtered.length;
      const uniqueWOs = new Set(filtered.map(e => e.wo_id).filter(Boolean)).size;
      const eventTypes = filtered.reduce((acc, e) => {
        const t = e.event_type.replace(/_/g, ' ');
        acc[t] = (acc[t] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return { type: 'bubble' as const, total, uniqueWOs, eventTypes };
    }
    if (activeFilter === 'melio') {
      const total = filtered.length;
      const totalAmount = filtered.reduce((sum, e) => sum + (e.amount ?? 0), 0);
      return { type: 'melio' as const, total, totalAmount };
    }
    return { type: 'activity' as const, total: filtered.length };
  }, [activeFilter, filteredEntries]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Daily Timeline</h1>
        <ExportButton view="timeline" params={{ user_id: selectedUser, start_date: date, end_date: date }} />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select a user...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {!selectedUser ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
          Select a user to view their timeline
        </div>
      ) : loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
          No activity for this date
        </div>
      ) : (
        <>
          {/* Platform Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(Object.keys(PLATFORM_CONFIG) as PlatformFilter[]).map((platform) => {
              const config = PLATFORM_CONFIG[platform];
              const stats = platformStats[platform];
              const isActive = activeFilter === platform;
              return (
                <button
                  key={platform}
                  onClick={() => setActiveFilter(isActive && platform !== 'all' ? 'all' : platform)}
                  className={`flex flex-col items-start rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${
                    isActive
                      ? `${config.border} ${config.bg} shadow-sm`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${isActive ? config.color : 'text-gray-500'}`}>
                    {config.icon}
                    {config.label}
                  </div>
                  <div className="mt-1.5 text-lg font-semibold text-gray-900">{stats.events}</div>
                  <div className="text-xs text-gray-400">
                    {stats.events === 1 ? 'event' : 'events'}
                    {stats.timeSeconds > 0 && (
                      <span className="ml-1 text-gray-500"> &middot; {formatDuration(stats.timeSeconds)}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Stats Panel */}
          {detailedStats && activeFilter !== 'all' && (
            <div className={`rounded-lg border-2 ${PLATFORM_CONFIG[activeFilter].border} ${PLATFORM_CONFIG[activeFilter].bg} p-4`}>
              <div className={`mb-3 flex items-center gap-2 text-sm font-semibold ${PLATFORM_CONFIG[activeFilter].color}`}>
                {PLATFORM_CONFIG[activeFilter].icon}
                {PLATFORM_CONFIG[activeFilter].label} Details
              </div>

              {detailedStats.type === 'dialpad' && (
                <div className="space-y-4">
                  {/* Row 1: Call Summary + Duration */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Call Summary */}
                    <div className="rounded-lg bg-white/80 p-4">
                      <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <Phone size={12} /> Call Summary
                      </h4>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{detailedStats.total}</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{detailedStats.completed}</div>
                          <div className="text-xs text-gray-500">Connected</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{detailedStats.missed}</div>
                          <div className="text-xs text-gray-500">Missed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{detailedStats.outbound}</div>
                          <div className="text-xs text-gray-500">Outbound</div>
                        </div>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="rounded-lg bg-white/80 p-4">
                      <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <Clock size={12} /> Duration
                      </h4>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{formatDuration(detailedStats.totalDuration)}</div>
                          <div className="text-xs text-gray-500">Total Talk</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{formatDuration(detailedStats.avgDuration)}</div>
                          <div className="text-xs text-gray-500">Avg / Call</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{formatDuration(detailedStats.longestCall)}</div>
                          <div className="text-xs text-gray-500">Longest</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-600">{formatDuration(detailedStats.shortestCall)}</div>
                          <div className="text-xs text-gray-500">Shortest</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Outbound + Inbound contact tables */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Outbound - Who They Called */}
                    <div className="rounded-lg bg-white/80 p-4">
                      <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <PhoneOutgoing size={12} /> Outbound &mdash; Who They Called
                      </h4>
                      {Object.keys(detailedStats.outboundByContact).length === 0 ? (
                        <div className="py-3 text-center text-xs text-gray-400">No outbound calls</div>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 text-left text-gray-500">
                              <th className="pb-1.5 font-medium">Contact</th>
                              <th className="pb-1.5 font-medium text-right">Calls</th>
                              <th className="pb-1.5 font-medium text-right">Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(detailedStats.outboundByContact)
                              .sort((a, b) => b[1].count - a[1].count)
                              .map(([name, info]) => (
                                <tr key={name} className="border-b border-gray-100 last:border-0">
                                  <td className="py-1.5">
                                    <div className="font-medium text-gray-800">{name}</div>
                                    {info.number && name !== info.number && (
                                      <div className="text-gray-400">{info.number}</div>
                                    )}
                                  </td>
                                  <td className="py-1.5 text-right font-medium text-gray-700">{info.count}</td>
                                  <td className="py-1.5 text-right text-gray-500">{formatDuration(info.duration)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Inbound - Who Called Them */}
                    <div className="rounded-lg bg-white/80 p-4">
                      <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <PhoneIncoming size={12} /> Inbound &mdash; Who Called Them
                      </h4>
                      {Object.keys(detailedStats.inboundByContact).length === 0 ? (
                        <div className="py-3 text-center text-xs text-gray-400">No inbound calls</div>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 text-left text-gray-500">
                              <th className="pb-1.5 font-medium">Contact</th>
                              <th className="pb-1.5 font-medium text-right">Calls</th>
                              <th className="pb-1.5 font-medium text-right">Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(detailedStats.inboundByContact)
                              .sort((a, b) => b[1].count - a[1].count)
                              .map(([name, info]) => (
                                <tr key={name} className="border-b border-gray-100 last:border-0">
                                  <td className="py-1.5">
                                    <div className="font-medium text-gray-800">{name}</div>
                                    {info.number && name !== info.number && (
                                      <div className="text-gray-400">{info.number}</div>
                                    )}
                                  </td>
                                  <td className="py-1.5 text-right font-medium text-gray-700">{info.count}</td>
                                  <td className="py-1.5 text-right text-gray-500">{formatDuration(info.duration)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {detailedStats.type === 'gmail' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-white/80 p-3">
                    <div className="text-xs text-gray-500">Total Emails</div>
                    <div className="text-lg font-semibold text-gray-900">{detailedStats.total}</div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3">
                    <div className="text-xs text-gray-500">Sent</div>
                    <div className="text-lg font-semibold text-gray-900">{detailedStats.sent}</div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3">
                    <div className="text-xs text-gray-500">Received</div>
                    <div className="text-lg font-semibold text-gray-900">{detailedStats.received}</div>
                  </div>
                </div>
              )}

              {detailedStats.type === 'bubble' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-white/80 p-3">
                      <div className="text-xs text-gray-500">Total Actions</div>
                      <div className="text-lg font-semibold text-gray-900">{detailedStats.total}</div>
                    </div>
                    <div className="rounded-lg bg-white/80 p-3">
                      <div className="text-xs text-gray-500">Work Orders Touched</div>
                      <div className="text-lg font-semibold text-gray-900">{detailedStats.uniqueWOs}</div>
                    </div>
                    <div className="rounded-lg bg-white/80 p-3 sm:col-span-1 col-span-2">
                      <div className="text-xs text-gray-500">Breakdown</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {Object.entries(detailedStats.eventTypes).map(([type, count]) => (
                          <span key={type} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailedStats.type === 'melio' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/80 p-3">
                    <div className="text-xs text-gray-500">Total Transactions</div>
                    <div className="text-lg font-semibold text-gray-900">{detailedStats.total}</div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3">
                    <div className="text-xs text-gray-500">Total Amount</div>
                    <div className="text-lg font-semibold text-gray-900">${detailedStats.totalAmount.toLocaleString()}</div>
                  </div>
                </div>
              )}

              {detailedStats.type === 'activity' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/80 p-3">
                    <div className="text-xs text-gray-500">Tab Switches / Idle Events</div>
                    <div className="text-lg font-semibold text-gray-900">{detailedStats.total}</div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3">
                    <div className="text-xs text-gray-500">Idle Time</div>
                    <div className="text-lg font-semibold text-gray-900">{formatDuration(sessionTimes.idle)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filtered Timeline */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
              <span className="text-xs font-medium text-gray-500">
                {activeFilter === 'all' ? 'All Events' : `${PLATFORM_CONFIG[activeFilter].label} Events`}
                {' '}&middot; {filteredEntries.length} {filteredEntries.length === 1 ? 'event' : 'events'}
              </span>
              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Show all
                </button>
              )}
            </div>
            {filteredEntries.length === 0 ? (
              <div className="flex h-20 items-center justify-center text-sm text-gray-400">
                No {PLATFORM_CONFIG[activeFilter].label.toLowerCase()} events for this date
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const isExpanded = expandedEntry === entry.id;
                return (
                  <div key={entry.id} className="border-b border-gray-50 last:border-0">
                    <button
                      onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
                    >
                      <span className="w-16 shrink-0 text-xs text-gray-400">
                        {format(new Date(entry.created_at), 'h:mm a')}
                      </span>
                      {getEventIcon(entry.source)}
                      <AppBadge app={entry.source} />
                      <span className="truncate text-gray-700">{entry.description}</span>
                      {entry.wo_id && (
                        <span className="shrink-0 text-xs font-medium text-blue-600">{entry.wo_id}</span>
                      )}
                      <span className="ml-auto shrink-0 text-gray-300">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>

                    {isExpanded && entry.raw && (
                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
                          {Object.entries(entry.raw).map(([key, value]) => {
                            if (key === 'id' || key === 'user_id' || key === 'metadata' || value == null) return null;
                            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                            if (!displayValue || displayValue === 'null') return null;
                            return (
                              <div key={key}>
                                <span className="font-medium text-gray-500">{key.replace(/_/g, ' ')}: </span>
                                <span className="text-gray-700">{displayValue.length > 80 ? displayValue.slice(0, 80) + '...' : displayValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function TimelinePage() {
  return (
    <SupabaseProvider>
      <TimelineContent />
    </SupabaseProvider>
  );
}
