export type UserRole = 'market_manager' | 'admin_ar' | 'admin_ap' | 'manager' | 'super_admin';

export type TrackedApp = 'bubble' | 'gmail' | 'dialpad' | 'melio' | 'other';

export type ActivityStatus = 'active' | 'idle' | 'offline';

export type ChromeProfile = 'breasy_work' | 'breasy_admin';

// Activity event types
export type ActivityEventType =
  | 'tab_activated'
  | 'tab_deactivated'
  | 'idle_start'
  | 'idle_end'
  | 'url_changed'
  | 'session_start'
  | 'session_end';

// Bubble operational event types
export type BubbleEventType =
  | 'wo_created'
  | 'wo_opened'
  | 'wo_status_changed'
  | 'wo_stage_changed'
  | 'vendor_assigned'
  | 'vendor_reassigned'
  | 'note_added'
  | 'photo_uploaded'
  | 'quote_sent'
  | 'quote_approved'
  | 'quote_rejected'
  | 'scheduled'
  | 'completed'
  | 'field_changed';

// Bubble financial event types
export type BubbleFinancialEventType =
  | 'invoice_created'
  | 'invoice_sent'
  | 'invoice_updated'
  | 'payment_received'
  | 'payment_partial'
  | 'credit_applied'
  | 'adjustment_made'
  | 'invoice_voided'
  | 'vendor_bill_created'
  | 'vendor_bill_approved'
  | 'vendor_bill_paid'
  | 'vendor_bill_rejected'
  | 'vendor_bill_updated'
  | 'vendor_payment_initiated'
  | 'vendor_payment_completed';

// Gmail event types
export type GmailEventType = 'email_sent' | 'email_received';

// Dialpad event types
export type DialpadEventType = 'call_started' | 'call_ended' | 'call_missed' | 'call_voicemail';

// Melio event types
export type MelioEventType =
  | 'payment_initiated'
  | 'payment_approved'
  | 'payment_sent'
  | 'payment_completed'
  | 'payment_failed'
  | 'payment_cancelled'
  | 'payment_refunded';

// Unified timeline event (for dashboard display)
export interface TimelineEvent {
  id: string;
  userId: string;
  userName: string;
  source: TrackedApp | 'system';
  eventType: string;
  description: string;
  woId?: string;
  company?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Live user status (for live view)
export interface UserLiveStatus {
  userId: string;
  fullName: string;
  role: UserRole;
  market?: string;
  status: ActivityStatus;
  currentApp?: TrackedApp;
  currentUrl?: string;
  lastActivityAt?: string;
  sessionStarted?: string;
  sessionDuration?: number;
  timeBubble?: number;
  timeGmail?: number;
  timeDialpad?: number;
  timeMelio?: number;
}

// Time allocation data
export interface TimeAllocationDay {
  date: string;
  bubbleSeconds: number;
  gmailSeconds: number;
  dialpadSeconds: number;
  melioSeconds: number;
  otherSeconds: number;
  idleSeconds: number;
  totalSeconds: number;
}

// AR aging bucket
export type AgingBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+';

// AR summary
export interface ARSummary {
  invoicesSentToday: number;
  paymentsReceivedToday: number;
  paymentsReceivedAmount: number;
  outstandingReceivables: number;
  avgDaysToPayment: number;
  agingBuckets: Record<AgingBucket, number>;
}

// AP summary
export interface APSummary {
  billsCreatedToday: number;
  paymentsCompleted: number;
  paymentsCompletedAmount: number;
  avgDaysBillToPaid: number;
  overdueBills: number;
  cashOutflowToday: number;
}

// Bubble sync types
export type BubbleSyncDataType = 'work_orders' | 'invoices' | 'vendor_bills';
export type BubbleEventSource = 'webhook' | 'sync';
