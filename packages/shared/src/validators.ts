import { z } from 'zod';

// Bubble webhook payload
export const bubbleWebhookSchema = z.object({
  webhook_secret: z.string(),
  event_type: z.string(),
  user_email: z.string().email(),
  wo_id: z.string(),
  company: z.string().optional(),
  market: z.string().optional(),
  timestamp: z.string().datetime(),
  data: z.record(z.unknown()).optional(),
});

export type BubbleWebhookPayload = z.infer<typeof bubbleWebhookSchema>;

// Bubble financial webhook payload
export const bubbleFinancialWebhookSchema = bubbleWebhookSchema.extend({
  data: z.object({
    invoice_number: z.string().optional(),
    amount: z.number().optional(),
    vendor_name: z.string().optional(),
    bill_number: z.string().optional(),
    payment_method: z.string().optional(),
    due_date: z.string().optional(),
    old_value: z.string().optional(),
    new_value: z.string().optional(),
    field_name: z.string().optional(),
    adjustment_reason: z.string().optional(),
    original_amount: z.number().optional(),
    adjusted_amount: z.number().optional(),
  }).optional(),
});

export type BubbleFinancialWebhookPayload = z.infer<typeof bubbleFinancialWebhookSchema>;

// Activity event from Chrome extension
export const activityEventSchema = z.object({
  user_id: z.string().uuid(),
  app: z.enum(['bubble', 'gmail', 'dialpad', 'melio', 'other']),
  event_type: z.string(),
  url_path: z.string().optional(),
  url_host: z.string().optional(),
  tab_title: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  session_id: z.string().uuid().optional(),
});

export type ActivityEventPayload = z.infer<typeof activityEventSchema>;

// Dialpad webhook payload
export const dialpadWebhookSchema = z.object({
  event_type: z.string(),
  call_id: z.string(),
  direction: z.enum(['inbound', 'outbound']),
  from_number: z.string().optional(),
  to_number: z.string().optional(),
  contact_name: z.string().optional(),
  duration_seconds: z.number().optional(),
  status: z.string().optional(),
  started_at: z.string().optional(),
  ended_at: z.string().optional(),
});

export type DialpadWebhookPayload = z.infer<typeof dialpadWebhookSchema>;

// Gmail push notification payload
export const gmailPushSchema = z.object({
  message: z.object({
    data: z.string(), // base64 encoded
    messageId: z.string(),
    publishTime: z.string(),
  }),
  subscription: z.string(),
});

export type GmailPushPayload = z.infer<typeof gmailPushSchema>;

// Melio webhook payload
export const melioWebhookSchema = z.object({
  event: z.string(),
  payment_id: z.string(),
  vendor_name: z.string(),
  vendor_id: z.string().optional(),
  amount: z.number(),
  currency: z.string().default('USD'),
  payment_method: z.string().optional(),
  status: z.string(),
  failure_reason: z.string().optional(),
  timestamp: z.string(),
});

export type MelioWebhookPayload = z.infer<typeof melioWebhookSchema>;

// Export route query params
export const exportQuerySchema = z.object({
  view: z.enum(['timeline', 'ar', 'ap', 'time-allocation', 'work-orders']),
  user_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  format: z.enum(['csv', 'xlsx']).default('csv'),
});

export type ExportQuery = z.infer<typeof exportQuerySchema>;
