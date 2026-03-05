import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Vercel Cron: runs every 5 minutes to poll Melio for payment updates

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();
    const apiKey = process.env.MELIO_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Melio API key not configured' }, { status: 500 });
    }

    // Fetch recent payments from Melio
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const response = await fetch(
      `https://api.melio.com/v1/payments?updated_since=${encodeURIComponent(fiveMinutesAgo)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Melio API error:', response.status, await response.text());
      return NextResponse.json({ error: 'Melio API error' }, { status: 502 });
    }

    const data = await response.json();
    const payments = data.payments ?? data.items ?? data;

    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ message: 'No new payments' });
    }

    let upserted = 0;

    for (const payment of payments) {
      const paymentId = payment.id ?? payment.payment_id;

      // Check if this payment+status already exists
      const { data: existing } = await supabase
        .from('OS_melio_events')
        .select('id')
        .eq('melio_payment_id', String(paymentId))
        .eq('payment_status', payment.status)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const eventType = mapStatusToEvent(payment.status);

      await supabase.from('OS_melio_events').insert({
        event_type: eventType,
        melio_payment_id: String(paymentId),
        vendor_name: payment.vendor_name ?? payment.vendor?.name ?? 'Unknown',
        vendor_id: payment.vendor_id ?? payment.vendor?.id,
        amount: payment.amount,
        currency: payment.currency ?? 'USD',
        payment_method: payment.delivery_method ?? payment.payment_method,
        payment_status: payment.status,
        failure_reason: payment.failure_reason,
        initiated_at: payment.created_at,
        approved_at: payment.approved_at,
        sent_at: payment.sent_at ?? payment.scheduled_date,
        completed_at: payment.completed_at ?? payment.delivery_date,
        failed_at: payment.failed_at,
        bill_number: payment.bill_id ?? payment.invoice_number,
        metadata: payment,
      });

      upserted++;
    }

    return NextResponse.json({ message: 'Melio poll complete', upserted });
  } catch (error) {
    console.error('Melio poll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function mapStatusToEvent(status: string): string {
  const mapping: Record<string, string> = {
    'created': 'payment_initiated',
    'pending': 'payment_initiated',
    'approved': 'payment_approved',
    'scheduled': 'payment_approved',
    'sent': 'payment_sent',
    'in_transit': 'payment_sent',
    'completed': 'payment_completed',
    'delivered': 'payment_completed',
    'failed': 'payment_failed',
    'cancelled': 'payment_cancelled',
    'refunded': 'payment_refunded',
  };
  return mapping[status] ?? `payment_${status}`;
}
