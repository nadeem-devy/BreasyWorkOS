'use client';

import { SupabaseProvider, useSupabase } from '@/components/providers/SupabaseProvider';
import ExportButton from '@/components/shared/ExportButton';
import { ArrowDownLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ARData {
  invoicesSentToday: number;
  paymentsReceivedToday: number;
  paymentsReceivedAmount: number;
  outstandingReceivables: number;
  avgDaysToPayment: number;
  agingBuckets: { bucket: string; amount: number }[];
  recentInvoices: {
    invoice_number: string;
    wo_id: string;
    company: string | null;
    amount: number;
    invoice_sent_at: string | null;
    payment_received_at: string | null;
  }[];
  followUpGaps: {
    wo_id: string;
    company: string | null;
    last_activity_at: string;
    days_since: number;
  }[];
}

function SummaryCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function ARContent() {
  const supabase = useSupabase();
  const [data, setData] = useState<ARData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAR() {
      const today = format(new Date(), 'yyyy-MM-dd');
      const startOfDay = `${today}T00:00:00`;
      const endOfDay = `${today}T23:59:59`;

      const [invoices, aging, recentInv, gaps] = await Promise.all([
        // Today's activity
        supabase
          .from('OS_bubble_financial_events')
          .select('event_type, amount, payment_received_at')
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay)
          .in('event_type', ['invoice_sent', 'invoice_created', 'payment_received']),

        // Aging data
        supabase.from('v_ar_aging').select('*'),

        // Recent invoices
        supabase
          .from('OS_bubble_financial_events')
          .select('invoice_number, wo_id, company, amount, invoice_sent_at, payment_received_at')
          .in('event_type', ['invoice_sent', 'invoice_created'])
          .order('created_at', { ascending: false })
          .limit(20),

        // Follow-up gaps (WOs with no activity in 3+ days)
        supabase.rpc('get_wo_last_activity', { p_wo_id: '' }).select('*'),
      ]);

      const sentToday = invoices.data?.filter((r) => r.event_type === 'invoice_sent').length ?? 0;
      const paymentsToday = invoices.data?.filter((r) => r.event_type === 'payment_received') ?? [];
      const paymentsAmount = paymentsToday.reduce((acc, r) => acc + (r.amount ?? 0), 0);

      // Calculate aging buckets
      const buckets: Record<string, number> = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
      let outstanding = 0;
      const daysArr: number[] = [];

      aging.data?.forEach((r) => {
        if (r.aging_bucket !== 'paid' && r.aging_bucket !== 'no_due_date') {
          buckets[r.aging_bucket] = (buckets[r.aging_bucket] ?? 0) + Number(r.amount ?? 0);
          outstanding += Number(r.amount ?? 0);
        }
        if (r.payment_received_at && r.invoice_sent_at) {
          const diff = Math.floor(
            (new Date(r.payment_received_at).getTime() - new Date(r.invoice_sent_at).getTime()) / 86400000
          );
          daysArr.push(diff);
        }
      });

      const avgDays = daysArr.length > 0 ? Math.round(daysArr.reduce((a, b) => a + b, 0) / daysArr.length) : 0;

      setData({
        invoicesSentToday: sentToday,
        paymentsReceivedToday: paymentsToday.length,
        paymentsReceivedAmount: paymentsAmount,
        outstandingReceivables: outstanding,
        avgDaysToPayment: avgDays,
        agingBuckets: Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount })),
        recentInvoices: (recentInv.data ?? []).map((r) => ({
          invoice_number: r.invoice_number ?? '—',
          wo_id: r.wo_id,
          company: r.company,
          amount: r.amount ?? 0,
          invoice_sent_at: r.invoice_sent_at,
          payment_received_at: r.payment_received_at,
        })),
        followUpGaps: [],
      });
      setLoading(false);
    }
    fetchAR();
  }, [supabase]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-gray-400">Loading AR data...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowDownLeft size={20} className="text-green-600" />
          <h1 className="text-lg font-semibold text-gray-900">Accounts Receivable</h1>
        </div>
        <ExportButton view="ar" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Invoices Sent Today" value={data.invoicesSentToday} />
        <SummaryCard label="Payments Received" value={`$${data.paymentsReceivedAmount.toLocaleString()}`} sub={`${data.paymentsReceivedToday} payments`} />
        <SummaryCard label="Outstanding Receivables" value={`$${data.outstandingReceivables.toLocaleString()}`} />
        <SummaryCard label="Avg Days to Payment" value={data.avgDaysToPayment} sub="days" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-gray-600">Aging Buckets</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.agingBuckets}>
            <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-600">Recent Invoices</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Invoice</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">WO</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Company</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Amount</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Sent</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Paid</th>
              </tr>
            </thead>
            <tbody>
              {data.recentInvoices.map((inv, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{inv.invoice_number}</td>
                  <td className="px-4 py-2.5 text-blue-600">{inv.wo_id}</td>
                  <td className="px-4 py-2.5 text-gray-700">{inv.company ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-700">${inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {inv.invoice_sent_at ? format(new Date(inv.invoice_sent_at), 'MMM d') : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    {inv.payment_received_at ? (
                      <span className="text-green-600">{format(new Date(inv.payment_received_at), 'MMM d')}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ARPage() {
  return (
    <SupabaseProvider>
      <ARContent />
    </SupabaseProvider>
  );
}
