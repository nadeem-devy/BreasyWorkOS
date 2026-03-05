'use client';

import { SupabaseProvider, useSupabase } from '@/components/providers/SupabaseProvider';
import ExportButton from '@/components/shared/ExportButton';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface APData {
  billsCreatedToday: number;
  paymentsCompleted: number;
  paymentsCompletedAmount: number;
  avgDaysBillToPaid: number;
  overdueBills: { bill_number: string; vendor_name: string; amount: number; created_at: string; days_overdue: number }[];
  recentBills: { bill_number: string; vendor_name: string; amount: number; created_at: string; payment_status: string }[];
  cashOutflow: { date: string; amount: number }[];
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

function APContent() {
  const supabase = useSupabase();
  const [data, setData] = useState<APData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAP() {
      const today = format(new Date(), 'yyyy-MM-dd');
      const startOfDay = `${today}T00:00:00`;
      const endOfDay = `${today}T23:59:59`;
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      const [todayBills, melioPayments, allBills, outflow] = await Promise.all([
        // Today's vendor bills
        supabase
          .from('OS_bubble_financial_events')
          .select('*')
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay)
          .in('event_type', ['vendor_bill_created', 'vendor_bill_paid']),

        // Melio payments
        supabase
          .from('OS_melio_events')
          .select('*')
          .in('payment_status', ['completed'])
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay),

        // Recent vendor bills
        supabase
          .from('OS_bubble_financial_events')
          .select('*')
          .in('event_type', ['vendor_bill_created', 'vendor_bill_approved', 'vendor_bill_paid'])
          .order('created_at', { ascending: false })
          .limit(20),

        // Cash outflow last 30 days
        supabase
          .from('OS_melio_events')
          .select('amount, created_at')
          .eq('payment_status', 'completed')
          .gte('created_at', `${thirtyDaysAgo}T00:00:00`)
          .order('created_at'),
      ]);

      const billsToday = todayBills.data?.filter((r) => r.event_type === 'vendor_bill_created').length ?? 0;
      const paidToday = melioPayments.data ?? [];
      const paidAmount = paidToday.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);

      // Calculate avg days bill -> paid
      const daysArr: number[] = [];
      allBills.data?.forEach((r) => {
        if (r.bill_paid_at && r.bill_created_at) {
          const diff = Math.floor(
            (new Date(r.bill_paid_at).getTime() - new Date(r.bill_created_at).getTime()) / 86400000
          );
          daysArr.push(diff);
        }
      });
      const avgDays = daysArr.length > 0 ? Math.round(daysArr.reduce((a, b) => a + b, 0) / daysArr.length) : 0;

      // Find overdue bills
      const overdue = (allBills.data ?? [])
        .filter((r) => r.event_type === 'vendor_bill_created' && !r.bill_paid_at)
        .filter((r) => {
          const created = new Date(r.created_at);
          const daysSince = Math.floor((Date.now() - created.getTime()) / 86400000);
          return daysSince > 30;
        })
        .map((r) => ({
          bill_number: r.bill_number ?? r.invoice_number ?? '—',
          vendor_name: r.vendor_name ?? '—',
          amount: Number(r.amount ?? 0),
          created_at: r.created_at,
          days_overdue: Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000),
        }));

      // Group outflow by day
      const outflowMap = new Map<string, number>();
      outflow.data?.forEach((r) => {
        const day = format(new Date(r.created_at), 'MMM d');
        outflowMap.set(day, (outflowMap.get(day) ?? 0) + Number(r.amount));
      });

      setData({
        billsCreatedToday: billsToday,
        paymentsCompleted: paidToday.length,
        paymentsCompletedAmount: paidAmount,
        avgDaysBillToPaid: avgDays,
        overdueBills: overdue,
        recentBills: (allBills.data ?? []).slice(0, 10).map((r) => ({
          bill_number: r.bill_number ?? r.invoice_number ?? '—',
          vendor_name: r.vendor_name ?? '—',
          amount: Number(r.amount ?? 0),
          created_at: r.created_at,
          payment_status: r.event_type.replace('vendor_bill_', ''),
        })),
        cashOutflow: Array.from(outflowMap.entries()).map(([date, amount]) => ({ date, amount })),
      });
      setLoading(false);
    }
    fetchAP();
  }, [supabase]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-gray-400">Loading AP data...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpRight size={20} className="text-orange-600" />
          <h1 className="text-lg font-semibold text-gray-900">Accounts Payable</h1>
        </div>
        <ExportButton view="ap" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Bills Created Today" value={data.billsCreatedToday} />
        <SummaryCard label="Payments Completed" value={`$${data.paymentsCompletedAmount.toLocaleString()}`} sub={`${data.paymentsCompleted} payments`} />
        <SummaryCard label="Avg Days Bill to Paid" value={data.avgDaysBillToPaid} sub="days" />
        <SummaryCard label="Overdue Bills" value={data.overdueBills.length} />
      </div>

      {data.cashOutflow.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-gray-600">Cash Outflow (30 Days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.cashOutflow}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Line type="monotone" dataKey="amount" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-600">Recent Vendor Bills</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Bill #</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Vendor</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Amount</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Created</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentBills.map((bill, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{bill.bill_number}</td>
                  <td className="px-4 py-2.5 text-gray-700">{bill.vendor_name}</td>
                  <td className="px-4 py-2.5 text-gray-700">${bill.amount.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-500">{format(new Date(bill.created_at), 'MMM d')}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      bill.payment_status === 'paid' ? 'bg-green-50 text-green-700' :
                      bill.payment_status === 'approved' ? 'bg-blue-50 text-blue-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {bill.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.overdueBills.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-red-600">Overdue Bills</h2>
          <div className="overflow-hidden rounded-lg border border-red-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-100 bg-red-50">
                  <th className="px-4 py-2.5 text-left font-medium text-red-700">Bill #</th>
                  <th className="px-4 py-2.5 text-left font-medium text-red-700">Vendor</th>
                  <th className="px-4 py-2.5 text-left font-medium text-red-700">Amount</th>
                  <th className="px-4 py-2.5 text-left font-medium text-red-700">Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                {data.overdueBills.map((bill, i) => (
                  <tr key={i} className="border-b border-red-50 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{bill.bill_number}</td>
                    <td className="px-4 py-2.5 text-gray-700">{bill.vendor_name}</td>
                    <td className="px-4 py-2.5 text-gray-700">${bill.amount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-medium text-red-600">{bill.days_overdue}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function APPage() {
  return (
    <SupabaseProvider>
      <APContent />
    </SupabaseProvider>
  );
}
