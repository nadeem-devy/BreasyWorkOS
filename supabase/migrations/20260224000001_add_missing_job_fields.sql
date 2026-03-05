-- ============================================================
-- Add 70 missing Bubble Job fields to b_job table
-- These fields exist in Bubble but were not captured in the
-- original migration.
-- ============================================================

-- Financial fields
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS amount_cust_price numeric;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS amount_markup double precision;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS nte integer;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS trip_charge text;

-- Status fields
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS status_job_completion text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS status_cust_quote text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS status_cust_invoice text;

-- Job metadata
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS difficulty text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS urgency text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS creation_tool text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS hrs_to_complete integer;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS onsite_needed text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS mm_name text;

-- Closed/completion fields
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS closed_reason text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS closed_details text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS closed_opportunity_reasons text[];
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS completion_summary text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS completion_sms_sent boolean;

-- Date fields
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_closed_txt text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_cust_invoice_due timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_cust_invoice_paid timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_cust_invoice_sent timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_cust_quote_approved timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_cust_quote_sent timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_fulfillment_confirmed_completion timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_last_activity timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_smb_confirmed_paid timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_smb_paid timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_smb_sent_to_ap timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_wo_received timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_work_completed timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_changed_date_quote_scheduled timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_smb_assigned timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_start_cust_quote_stage timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_start_payments_stage timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_start_scheduled_stage timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS date_start_smb_quote_stage timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS new_proposed_date timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS suggested_changed_completion_date timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS work_date_confirmed_pmc timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS work_date_confirmed_smb timestamptz;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS work_date_confirmed_tenant timestamptz;

-- Relationship/reference fields
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS accepted_completion text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS active_activity text[];
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS associated_cust_invoice text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS associated_next_steps text[];
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS associated_smb_payment text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS invoice_smb_invoice text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS invoice_cust_tripcharge_invoice text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS job_chat text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS published_smbs text[];
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS visits text[];

-- Media fields
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS job_cust_photos text[];
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS customer_quote_image text;

-- Recurring job fields
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS recurring_wo_root text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS recurring_child text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS recurring_occurrence integer;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS recurring_previous_wos text[];
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS recurring_status text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS recurring_weekly_frequency integer;

-- Tenant/scheduling fields
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS tenant_presence_required text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS tenant_site_vacant text;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS request_trip_charge boolean;

-- Boolean/flag fields
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS hubspot_deal_closed boolean;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS quote_sms_sent boolean;
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS viewed boolean;

-- Other
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS quote_dates_list text[];
ALTER TABLE b_job ADD COLUMN IF NOT EXISTS mapbox_table_cache text;

-- Indexes on important new fields
CREATE INDEX IF NOT EXISTS idx_b_job_completion ON b_job(status_job_completion);
CREATE INDEX IF NOT EXISTS idx_b_job_cust_quote ON b_job(status_cust_quote);
CREATE INDEX IF NOT EXISTS idx_b_job_cust_invoice ON b_job(status_cust_invoice);
CREATE INDEX IF NOT EXISTS idx_b_job_work_completed ON b_job(date_work_completed);
CREATE INDEX IF NOT EXISTS idx_b_job_source ON b_job(source);
CREATE INDEX IF NOT EXISTS idx_b_job_recurring ON b_job(recurring_status);
CREATE INDEX IF NOT EXISTS idx_b_job_difficulty ON b_job(difficulty);
CREATE INDEX IF NOT EXISTS idx_b_job_urgency ON b_job(urgency);
