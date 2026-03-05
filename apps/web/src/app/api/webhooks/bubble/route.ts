import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const FINANCIAL_EVENT_TYPES = new Set([
  'invoice_created', 'invoice_sent', 'invoice_updated', 'payment_received',
  'payment_partial', 'credit_applied', 'adjustment_made', 'invoice_voided',
  'vendor_bill_created', 'vendor_bill_approved', 'vendor_bill_paid',
  'vendor_bill_rejected', 'vendor_bill_updated', 'vendor_payment_initiated',
  'vendor_payment_completed',
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate webhook secret
    if (body.webhook_secret !== process.env.BUBBLE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Look up user by email
    const { data: profile } = await supabase
      .from('OS_profiles')
      .select('id')
      .eq('email', body.user_email)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const eventType = body.event_type;
    const data = body.data ?? {};

    if (FINANCIAL_EVENT_TYPES.has(eventType)) {
      // Insert into bubble_financial_events
      await supabase.from('OS_bubble_financial_events').insert({
        user_id: profile.id,
        wo_id: body.wo_id,
        company: body.company,
        market: body.market,
        event_type: eventType,
        invoice_number: data.invoice_number,
        amount: data.amount,
        vendor_name: data.vendor_name,
        payment_method: data.payment_method,
        due_date: data.due_date,
        bill_number: data.bill_number,
        adjustment_reason: data.adjustment_reason,
        original_amount: data.original_amount,
        adjusted_amount: data.adjusted_amount,
        invoice_sent_at: eventType === 'invoice_sent' ? body.timestamp : undefined,
        payment_received_at: eventType === 'payment_received' ? body.timestamp : undefined,
        bill_created_at: eventType === 'vendor_bill_created' ? body.timestamp : undefined,
        bill_approved_at: eventType === 'vendor_bill_approved' ? body.timestamp : undefined,
        bill_paid_at: eventType === 'vendor_bill_paid' ? body.timestamp : undefined,
        source: 'webhook',
        bubble_thing_id: data.bubble_thing_id,
      });
    } else {
      // Insert into bubble_events (operational)
      await supabase.from('OS_bubble_events').insert({
        user_id: profile.id,
        wo_id: body.wo_id,
        company: body.company,
        market: body.market,
        event_type: eventType,
        event_category: 'operational',
        old_value: data.old_value ?? data.old_status,
        new_value: data.new_value ?? data.new_status,
        field_name: data.field_name,
        vendor_name: data.vendor_name,
        note_text: data.note_text,
        source: 'webhook',
        bubble_thing_id: data.bubble_thing_id,
        metadata: data,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bubble webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
