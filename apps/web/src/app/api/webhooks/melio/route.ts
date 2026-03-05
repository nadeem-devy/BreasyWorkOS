import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createServiceClient();

    // Map Melio event to our schema
    const eventType = mapMelioEvent(body.event ?? body.type);
    const paymentStatus = mapMelioStatus(body.status ?? body.event);

    await supabase.from('OS_melio_events').insert({
      event_type: eventType,
      melio_payment_id: body.payment_id ?? body.id,
      vendor_name: body.vendor_name ?? body.vendor?.name ?? 'Unknown',
      vendor_id: body.vendor_id ?? body.vendor?.id,
      amount: body.amount,
      currency: body.currency ?? 'USD',
      payment_method: body.payment_method ?? body.method,
      payment_status: paymentStatus,
      failure_reason: body.failure_reason,
      initiated_at: body.initiated_at ?? body.created_at,
      approved_at: body.approved_at,
      sent_at: body.sent_at,
      completed_at: body.completed_at,
      failed_at: body.failed_at,
      wo_id: body.wo_id ?? body.reference,
      bill_number: body.bill_number ?? body.invoice_number,
      metadata: body,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Melio webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function mapMelioEvent(event: string): string {
  const mapping: Record<string, string> = {
    'payment.created': 'payment_initiated',
    'payment.approved': 'payment_approved',
    'payment.sent': 'payment_sent',
    'payment.completed': 'payment_completed',
    'payment.failed': 'payment_failed',
    'payment.cancelled': 'payment_cancelled',
    'payment.refunded': 'payment_refunded',
  };
  return mapping[event] ?? event ?? 'payment_initiated';
}

function mapMelioStatus(status: string): string {
  const mapping: Record<string, string> = {
    'created': 'initiated',
    'pending': 'initiated',
    'approved': 'approved',
    'sent': 'sent',
    'completed': 'completed',
    'failed': 'failed',
    'cancelled': 'failed',
  };
  return mapping[status] ?? status ?? 'initiated';
}
