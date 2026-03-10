'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Phone, PhoneMissed, Clock, TrendingUp } from 'lucide-react';

interface PerUser {
  name: string;
  calls: number;
  talkTime: number;
  missed: number;
  inbound: number;
  outbound: number;
}

interface PerDay {
  date: string;
  label: string;
  calls: number;
  talkTime: number;
  missed: number;
}

interface PerHour {
  hour: string;
  calls: number;
  talkTime: number;
}

interface Summary {
  totalCalls: number;
  totalTalkTime: number;
  avgDuration: number;
  missedCalls: number;
}

interface BreakdownData {
  perUser: PerUser[];
  perDay: PerDay[];
  perHour: PerHour[];
  summary: Summary;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48',
];

export default function CallBreakdownCharts({ date }: { date?: string | null } = {}) {
  const [data, setData] = useState<BreakdownData | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = date
      ? `/api/admin/call-breakdown?date=${date}`
      : `/api/admin/call-breakdown?days=${days}`;
    fetch(url)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [days, date]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        Loading call data...
      </div>
    );
  }

  if (!data || data.summary.totalCalls === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        No call data for this period
      </div>
    );
  }

  const { perUser, perDay, perHour, summary } = data;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-600">Call Breakdown{date ? ` — ${date}` : ''}</h2>
        {!date && (
        <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
          {[1, 3, 7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                days === d
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {d === 1 ? 'Today' : `${d}d`}
            </button>
          ))}
        </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone size={14} />
            Total Calls
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.totalCalls}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={14} />
            Talk Time
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {summary.totalTalkTime >= 60
              ? `${Math.floor(summary.totalTalkTime / 60)}h ${summary.totalTalkTime % 60}m`
              : `${summary.totalTalkTime}m`}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <TrendingUp size={14} />
            Avg Duration
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {Math.floor(summary.avgDuration / 60)}m {summary.avgDuration % 60}s
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <PhoneMissed size={14} />
            Missed
          </div>
          <p className="mt-1 text-2xl font-semibold text-red-600">{summary.missedCalls}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Calls per user bar chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-xs font-medium text-gray-500">Calls per User</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={perUser} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="outbound" stackId="a" fill="#3b82f6" name="Outbound" />
              <Bar dataKey="inbound" stackId="a" fill="#10b981" name="Inbound" />
              <Bar dataKey="missed" stackId="a" fill="#ef4444" name="Missed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Talk time per user pie chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-xs font-medium text-gray-500">Talk Time Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={perUser.filter((u) => u.talkTime > 0)}
                dataKey="talkTime"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={((props: Record<string, unknown>) => `${props.name ?? ''}: ${props.value ?? 0}m`) as never}
                labelLine={{ stroke: '#999', strokeWidth: 0.5 }}
              >
                {perUser
                  .filter((u) => u.talkTime > 0)
                  .map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily trend */}
      {perDay.length > 1 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-xs font-medium text-gray-500">Daily Call Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={perDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} name="Calls" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="talkTime" stroke="#10b981" strokeWidth={2} name="Talk Time (min)" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Hourly distribution (today) */}
      {perHour.some((h) => h.calls > 0) && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-xs font-medium text-gray-500">{date ? `${date} Hourly Activity` : "Today\u0027s Hourly Activity"}</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={perHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="calls" fill="#8b5cf6" name="Calls" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
