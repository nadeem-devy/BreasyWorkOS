'use client';

import { SupabaseProvider, useSupabase } from '@/components/providers/SupabaseProvider';
import AppBadge from '@/components/shared/AppBadge';
import ExportButton from '@/components/shared/ExportButton';
import { format, formatDistanceToNow } from 'date-fns';
import { Briefcase, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WORow {
  wo_id: string;
  company: string | null;
  last_user_name: string;
  last_event_type: string;
  last_activity_at: string;
}

interface WOActivity {
  id: number;
  event_type: string;
  created_at: string;
  user_name: string;
  source: string;
}

function WorkOrdersContent() {
  const supabase = useSupabase();
  const [workOrders, setWorkOrders] = useState<WORow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<WOActivity[]>([]);

  useEffect(() => {
    async function fetchWOs() {
      setLoading(true);

      // Get distinct WO IDs with latest activity
      const { data } = await supabase
        .from('OS_bubble_events')
        .select('wo_id, company, user_id, event_type, created_at, profiles!inner(full_name)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!data) { setLoading(false); return; }

      // Deduplicate to latest per WO
      const woMap = new Map<string, WORow>();
      for (const row of data) {
        if (!woMap.has(row.wo_id)) {
          const profile = row.profiles as unknown as { full_name: string };
          woMap.set(row.wo_id, {
            wo_id: row.wo_id,
            company: row.company,
            last_user_name: profile.full_name,
            last_event_type: row.event_type,
            last_activity_at: row.created_at,
          });
        }
      }

      setWorkOrders(Array.from(woMap.values()));
      setLoading(false);
    }
    fetchWOs();
  }, [supabase]);

  async function toggleExpand(woId: string) {
    if (expanded === woId) {
      setExpanded(null);
      return;
    }
    setExpanded(woId);

    const { data } = await supabase
      .from('OS_bubble_events')
      .select('id, event_type, created_at, user_id, profiles!inner(full_name)')
      .eq('wo_id', woId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setExpandedActivities(
        data.map((r) => {
          const profile = r.profiles as unknown as { full_name: string };
          return {
            id: r.id,
            event_type: r.event_type,
            created_at: r.created_at,
            user_name: profile.full_name,
            source: 'bubble',
          };
        })
      );
    }
  }

  const filtered = search
    ? workOrders.filter(
        (w) =>
          w.wo_id.toLowerCase().includes(search.toLowerCase()) ||
          (w.company ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : workOrders;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase size={20} className="text-gray-600" />
          <h1 className="text-lg font-semibold text-gray-900">Work Orders</h1>
        </div>
        <ExportButton view="work-orders" />
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search WO ID or company..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
          No work orders found
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-8 px-2 py-2.5" />
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">WO ID</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Company</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Last By</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Last Action</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">When</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Since</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((wo) => (
                <>
                  <tr
                    key={wo.wo_id}
                    onClick={() => toggleExpand(wo.wo_id)}
                    className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-2 py-2.5 text-gray-400">
                      {expanded === wo.wo_id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-blue-600">{wo.wo_id}</td>
                    <td className="px-4 py-2.5 text-gray-700">{wo.company ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-700">{wo.last_user_name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{wo.last_event_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 text-gray-500">{format(new Date(wo.last_activity_at), 'MMM d, h:mm a')}</td>
                    <td className="px-4 py-2.5 text-gray-400">{formatDistanceToNow(new Date(wo.last_activity_at), { addSuffix: true })}</td>
                  </tr>
                  {expanded === wo.wo_id && (
                    <tr key={`${wo.wo_id}-detail`}>
                      <td colSpan={7} className="bg-gray-50 px-8 py-3">
                        <p className="mb-2 text-xs font-medium text-gray-500">Activity Log</p>
                        <div className="space-y-1">
                          {expandedActivities.map((a) => (
                            <div key={a.id} className="flex items-center gap-3 text-xs">
                              <span className="w-28 text-gray-400">{format(new Date(a.created_at), 'MMM d, h:mm a')}</span>
                              <AppBadge app={a.source} />
                              <span className="text-gray-600">{a.user_name}</span>
                              <span className="text-gray-500">{a.event_type.replace(/_/g, ' ')}</span>
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
      )}
    </div>
  );
}

export default function WorkOrdersPage() {
  return (
    <SupabaseProvider>
      <WorkOrdersContent />
    </SupabaseProvider>
  );
}
