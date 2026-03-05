-- ============================================================
-- Bubble.io to Supabase Migration - Table Creation
-- All tables prefixed with b_ to avoid conflicts with existing tables
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CORE TABLES (no foreign key dependencies)
-- ============================================================

-- Organizations (SMBs, PMCs, etc.)
CREATE TABLE IF NOT EXISTS b_organization (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  org_name text,
  org_function text,
  org_tier text,
  cust_tier text,
  org_website text,
  org_address_geo jsonb,
  org_markets text[],
  org_hubspot_id text,
  org_added_via text,
  associated_primary_contact text,
  associated_users text[],
  lifecycle_stage text,
  lifecycle_stage_prev text,
  smb_source text,
  smb_services text[],
  smb_approved_for_work boolean,
  smb_ein bigint,
  smb_license_num text,
  smb_license_exp timestamptz,
  smb_insurance_num text,
  smb_insurance_exp timestamptz,
  smb_payment_closed_won numeric,
  mercury_status text,
  metric_wo_created_all_time integer DEFAULT 0,
  metric_wo_count_closed_won integer DEFAULT 0,
  metric_compl_perc integer DEFAULT 0,
  metric_cw_rev_perc integer DEFAULT 0,
  metric_payment_count integer DEFAULT 0,
  date_last_complete timestamptz,
  date_last_published timestamptz,
  date_last_sent_or_assigned timestamptz
);

-- Users
CREATE TABLE IF NOT EXISTS b_user (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_date timestamptz,
  modified_date timestamptz,
  authentication jsonb,
  user_first_name text,
  user_last_name text,
  user_full_name text,
  user_role text,
  user_function text,
  user_contact_email text,
  user_contact_phone text,
  user_markets text[],
  user_account_status text,
  user_lifecycle text,
  user_added_via text,
  user_accept_terms boolean,
  user_beta_tester boolean,
  user_verified boolean,
  user_signed_up boolean,
  user_login_last_date timestamptz,
  user_associated_org text,
  smb_source text,
  mm_dialpad_id text,
  mm_slack_id text,
  mm_job_page integer,
  cust_contact_hubspot_id text
);

-- Calendar Events
CREATE TABLE IF NOT EXISTS b_calendar_event (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  event text,
  start_date_time timestamptz,
  end_date_time timestamptz,
  completed boolean DEFAULT false
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS b_blogpost (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_date timestamptz,
  modified_date timestamptz,
  raw_data jsonb
);

-- ============================================================
-- JOB-RELATED TABLES
-- ============================================================

-- Jobs
CREATE TABLE IF NOT EXISTS b_job (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  job_id integer,
  job_work_order text,
  job_invoice_no text,
  job_market text,
  job_description text,
  job_services_list text[],
  job_recommended_price numeric,
  lifecycle text,
  status_job_stage text,
  status_smb_quote text,
  address_geo jsonb,
  assigned_cust_org text,
  assigned_cust_user text,
  assigned_fulfillment_user text,
  assigned_smb_user text,
  accepted_quote text,
  active_next_step text,
  calendar_event text,
  associated_quotes text[],
  associated_activities text[],
  amount_cost_of_materials numeric,
  amount_smb_price numeric,
  date_closed timestamptz,
  date_quote_scheduled timestamptz,
  date_quote_scheduled_txt text,
  date_smb_quote_received timestamptz,
  date_work_scheduled timestamptz,
  date_work_scheduled_txt text,
  last_activity timestamptz,
  blocked boolean DEFAULT false,
  occupied_first text,
  occupied_last text,
  occupied_note text,
  occupied_phone text,
  quote_cust_scope_of_work text,
  quote_smb_scope_of_work text,
  smb_payment_status_zapier text,
  hubspot_deal_id text,
  hubspot_deal_id_inserted boolean DEFAULT false,
  time_to_quote integer
);

-- Job Services
CREATE TABLE IF NOT EXISTS b_job_service (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  job_work_order text,
  service_market text,
  customer_price numeric,
  smb_total_cost numeric,
  service_smb_hours numeric,
  service_smb_rate numeric,
  markup double precision
);

-- Job Requests
CREATE TABLE IF NOT EXISTS b_job_request (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_date timestamptz,
  modified_date timestamptz,
  raw_data jsonb
);

-- Job Request Quality Metrics
CREATE TABLE IF NOT EXISTS b_job_request_quality_metrics (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  budget_missing boolean,
  eligible_smbs text[],
  n8n_description_rating integer,
  pmc_compl_pct integer,
  pmc_jobs_to_date integer,
  site_images_missing boolean,
  smb_compl_pcts jsonb,
  smb_distances jsonb,
  warning_no_smbs_in_range_30mi boolean,
  warning_no_smbs_with_80_pct boolean,
  warning_pmc_compl_below_50 boolean
);

-- Duplicate Jobs (snapshot/archive)
CREATE TABLE IF NOT EXISTS b_duplicate_job (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_date timestamptz,
  modified_date timestamptz,
  job_work_order text,
  job_market text,
  job_description text,
  job_services text[],
  job_services_list text[],
  job_notes text[],
  status_job_stage text,
  address_geo jsonb,
  address_street text,
  address_city text,
  address_state text,
  address_zip text,
  assigned_cust_org text,
  assigned_cust_user text,
  assigned_fulfillment_user text,
  assigned_smb_user text,
  next_step text,
  breasy_mm_next_step text,
  amount_cust_invoice numeric,
  amount_smb_total numeric,
  date_closed timestamptz,
  date_closed_txt text,
  date_completion_approved timestamptz,
  date_completion_confirmed timestamptz,
  date_cust_invoice_confirmed timestamptz,
  date_cust_invoice_due timestamptz,
  date_cust_invoice_sent timestamptz,
  date_cust_quote_sent timestamptz,
  date_smb_invoice_ap timestamptz,
  date_smb_quote_confirmed timestamptz,
  date_smb_reminder_1 timestamptz,
  date_smb_reminder_2 timestamptz,
  date_work_approval_confirmed timestamptz,
  date_work_assigned timestamptz,
  date_work_completed timestamptz,
  date_work_scheduled timestamptz,
  date_work_submitted timestamptz,
  last_activity timestamptz,
  job_next_step_due timestamptz,
  job_cust_quote_status text,
  job_smb_completion_status text,
  job_smb_quote_status text,
  invoice_cust_invoice text,
  invoice_number text,
  invoice_smb_invoice text,
  deal_hubspot_id text,
  occupied_first text,
  occupied_last text,
  related_invoice_numbers text[]
);

-- Duplicate Job Services
CREATE TABLE IF NOT EXISTS b_duplicate_job_service (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  customer_price numeric,
  smb_total_cost numeric,
  service_smb_hours numeric,
  service_smb_rate numeric,
  service_suggested_hours numeric,
  service_suggested_rate numeric,
  service_market text,
  markup double precision
);

-- ============================================================
-- QUOTES
-- ============================================================

-- SMB Quotes
CREATE TABLE IF NOT EXISTS b_smb_quote (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_job text,
  associated_smb_user text,
  status_quote text,
  source text,
  quote_scope_of_work text,
  quote_additional_recommendations text,
  quote_expected_time_to_complete text,
  quote_smb_name text,
  quote_smb_phone text,
  amount_cost_of_materials numeric,
  amount_smb_total numeric,
  date_quote_scheduled timestamptz,
  date_quote_submitted timestamptz,
  date_completion_expected timestamptz,
  created_date_text text,
  onsite_photos text[]
);

-- Duplicate Quotes
CREATE TABLE IF NOT EXISTS b_duplicate_quote (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_smb_org text,
  associated_smb_user text,
  status text,
  quote_scope_of_work text,
  quote_additional_recommendations text,
  quote_expected_time_to_completion text,
  quote_smb_name text,
  quote_smb_phone text,
  onsite_note text,
  amount_cost_of_materials numeric,
  amount_smb_labor numeric,
  amount_customer_calculation numeric,
  amount_customer_total numeric,
  amount_customer_markup double precision,
  date_smb_submitted timestamptz
);

-- Quote Line Items
CREATE TABLE IF NOT EXISTS b_quote_line_item (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_job text,
  line_item_type text,
  description text
);

-- Published SMBs (job assignments)
CREATE TABLE IF NOT EXISTS b_published_smbs (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  job text,
  smb_id text,
  accepted boolean DEFAULT false,
  viewed boolean DEFAULT false,
  quotation_date timestamptz,
  quotation_date_txt text
);

-- ============================================================
-- INVOICES & PAYMENTS
-- ============================================================

-- Invoices
CREATE TABLE IF NOT EXISTS b_invoice (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  job_work_order text,
  invoice_type text,
  invoice_status text,
  associated_cust_org text,
  amount_smb_price numeric,
  date_job_completed timestamptz,
  date_job_completion_confirmed timestamptz,
  paid_date timestamptz
);

-- Duplicate Invoice RF
CREATE TABLE IF NOT EXISTS b_duplicate_invoice_rf (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  job_work_order text,
  invoice_type text,
  invoice_status text,
  associated_cust_org text,
  associated_smb text,
  amount_smb_payout numeric,
  date_job_completed timestamptz,
  date_job_completion_confirmed timestamptz,
  date_sent_to_ap timestamptz,
  smb_name text,
  smb_phone text,
  smb_address_street text,
  smb_address_city text,
  smb_address_state text,
  smb_address_zipcode text
);

-- ============================================================
-- COMMUNICATION TABLES
-- ============================================================

-- Conversations
CREATE TABLE IF NOT EXISTS b_conversation (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_external_user text,
  associated_internal_user text,
  associated_markets text[],
  external_phone_no text,
  job_address jsonb,
  job_work_order text,
  messages text[],
  smb text,
  unread boolean DEFAULT false
);

-- Messages
CREATE TABLE IF NOT EXISTS b_message (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  content text,
  direction text,
  message_date timestamptz,
  message_note text,
  related_note text
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS b_chat_message (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  chat text,
  content text,
  owner text,
  source text,
  inbound boolean,
  is_read boolean DEFAULT false
);

-- Emails
CREATE TABLE IF NOT EXISTS b_email (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  email_subject text,
  email_body text,
  email_type text,
  sender_email text,
  sender_name text,
  receiver_email text,
  message_id text,
  is_read boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  read_by text,
  slack_notification_sent boolean DEFAULT false
);

-- Notifications
CREATE TABLE IF NOT EXISTS b_notification (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  content text,
  type text,
  sender text,
  related_message text,
  read boolean DEFAULT false
);

-- ============================================================
-- ACTIVITY & TASK TABLES
-- ============================================================

-- Activities
CREATE TABLE IF NOT EXISTS b_activity (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  title text,
  body text,
  associated_job text,
  associated_fulfillment_owner text,
  job_stage text,
  percentage text,
  complete boolean DEFAULT false,
  date_completed timestamptz
);

-- Next Steps
CREATE TABLE IF NOT EXISTS b_next_step (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  next_step_details text,
  task_job_stage text,
  task_status text,
  date_due timestamptz,
  due_date_text text,
  blocked boolean DEFAULT false
);

-- Next Steps SMB
CREATE TABLE IF NOT EXISTS b_next_step_smb (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_fulfillment_user text,
  next_step_details text,
  task_status text,
  task_manager text,
  date_due timestamptz,
  date_completed timestamptz,
  due_date_text text,
  blocked boolean DEFAULT false
);

-- Notes
CREATE TABLE IF NOT EXISTS b_note (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  body text,
  note_type text
);

-- Completions
CREATE TABLE IF NOT EXISTS b_completion (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  date_completed timestamptz,
  is_accepted boolean DEFAULT false,
  source text
);

-- ============================================================
-- ANALYTICS & METRICS TABLES
-- ============================================================

-- Usage Metrics
CREATE TABLE IF NOT EXISTS b_usage_metrics (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  page_name text,
  all_visits integer DEFAULT 0,
  unique_visits text[],
  visit_time_date timestamptz,
  visit_time_date_txt text
);

-- Section Engagement Track
CREATE TABLE IF NOT EXISTS b_section_engagement_track (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  page_name text,
  duration integer,
  enter_time timestamptz,
  leave_time timestamptz,
  created_date_txt text,
  related_user text
);

-- App Usage
CREATE TABLE IF NOT EXISTS b_app_usage (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  type text,
  "user" text
);

-- Snapshot MM
CREATE TABLE IF NOT EXISTS b_snapshot_mm (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  date timestamptz,
  market_manager text,
  agg_co_count integer DEFAULT 0,
  agg_cw_count integer DEFAULT 0,
  snap_activities_added_count integer DEFAULT 0,
  snap_jobs_w_no_2_day_activity integer DEFAULT 0,
  snap_old_open_wos_count integer DEFAULT 0,
  snap_open_wos_count integer DEFAULT 0,
  snap_past_due_next_steps_count integer DEFAULT 0,
  snap_tomorrow_next_steps_count integer DEFAULT 0
);

-- Snapshot PMC
CREATE TABLE IF NOT EXISTS b_snapshot_pmc (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  date timestamptz,
  pmc text,
  agg_co_count integer DEFAULT 0,
  agg_cw_count integer DEFAULT 0,
  snap_old_wos_count integer DEFAULT 0,
  snap_open_wos_count integer DEFAULT 0
);

-- Snapshot Market
CREATE TABLE IF NOT EXISTS b_snapshot_market (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  date timestamptz,
  market text,
  agg_co_count integer DEFAULT 0,
  agg_cw_count integer DEFAULT 0
);

-- UTM Views
CREATE TABLE IF NOT EXISTS b_utm_views (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_date timestamptz,
  modified_date timestamptz,
  campaign text,
  source text,
  medium text,
  term text
);

-- Visits
CREATE TABLE IF NOT EXISTS b_visit (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  visit_type text,
  visit_permission text,
  tenant_last_viewed text,
  tenant_response_stage integer
);

-- Leads
CREATE TABLE IF NOT EXISTS b_leads (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_date timestamptz,
  modified_date timestamptz,
  email text,
  blog text
);

-- SMB Onboard Intent
CREATE TABLE IF NOT EXISTS b_smb_onboard_intent (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_date timestamptz,
  modified_date timestamptz,
  market text,
  super_services text[]
);

-- ============================================================
-- INDEXES for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_b_user_org ON b_user(user_associated_org);
CREATE INDEX IF NOT EXISTS idx_b_user_email ON b_user(user_contact_email);
CREATE INDEX IF NOT EXISTS idx_b_user_role ON b_user(user_role);

CREATE INDEX IF NOT EXISTS idx_b_job_work_order ON b_job(job_work_order);
CREATE INDEX IF NOT EXISTS idx_b_job_market ON b_job(job_market);
CREATE INDEX IF NOT EXISTS idx_b_job_status ON b_job(status_job_stage);
CREATE INDEX IF NOT EXISTS idx_b_job_cust_org ON b_job(assigned_cust_org);
CREATE INDEX IF NOT EXISTS idx_b_job_smb_user ON b_job(assigned_smb_user);

CREATE INDEX IF NOT EXISTS idx_b_activity_job ON b_activity(associated_job);
CREATE INDEX IF NOT EXISTS idx_b_activity_created ON b_activity(created_date);

CREATE INDEX IF NOT EXISTS idx_b_message_created ON b_message(created_date);
CREATE INDEX IF NOT EXISTS idx_b_message_direction ON b_message(direction);

CREATE INDEX IF NOT EXISTS idx_b_invoice_work_order ON b_invoice(job_work_order);
CREATE INDEX IF NOT EXISTS idx_b_invoice_status ON b_invoice(invoice_status);
CREATE INDEX IF NOT EXISTS idx_b_invoice_cust_org ON b_invoice(associated_cust_org);

CREATE INDEX IF NOT EXISTS idx_b_org_name ON b_organization(org_name);
CREATE INDEX IF NOT EXISTS idx_b_org_function ON b_organization(org_function);
CREATE INDEX IF NOT EXISTS idx_b_org_lifecycle ON b_organization(lifecycle_stage);

CREATE INDEX IF NOT EXISTS idx_b_next_step_status ON b_next_step(task_status);
CREATE INDEX IF NOT EXISTS idx_b_next_step_due ON b_next_step(date_due);

CREATE INDEX IF NOT EXISTS idx_b_note_type ON b_note(note_type);

CREATE INDEX IF NOT EXISTS idx_b_conversation_ext_user ON b_conversation(associated_external_user);
CREATE INDEX IF NOT EXISTS idx_b_conversation_int_user ON b_conversation(associated_internal_user);

CREATE INDEX IF NOT EXISTS idx_b_email_sender ON b_email(sender_email);
CREATE INDEX IF NOT EXISTS idx_b_email_receiver ON b_email(receiver_email);

CREATE INDEX IF NOT EXISTS idx_b_duplicate_job_wo ON b_duplicate_job(job_work_order);
CREATE INDEX IF NOT EXISTS idx_b_duplicate_job_market ON b_duplicate_job(job_market);

CREATE INDEX IF NOT EXISTS idx_b_smb_quote_job ON b_smb_quote(associated_job);
CREATE INDEX IF NOT EXISTS idx_b_duplicate_quote_org ON b_duplicate_quote(associated_smb_org);

CREATE INDEX IF NOT EXISTS idx_b_job_service_wo ON b_job_service(job_work_order);
CREATE INDEX IF NOT EXISTS idx_b_section_engagement_user ON b_section_engagement_track(related_user);

-- ============================================================
-- ENABLE RLS (Row Level Security) on all tables
-- ============================================================

ALTER TABLE b_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_calendar_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_job_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_job_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_job_request_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_duplicate_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_duplicate_job_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_smb_quote ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_duplicate_quote ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_quote_line_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_published_smbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_duplicate_invoice_rf ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_chat_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_next_step ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_next_step_smb ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_note ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_section_engagement_track ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_app_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_snapshot_mm ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_snapshot_pmc ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_snapshot_market ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_utm_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_visit ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_smb_onboard_intent ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow service_role full access (for migration & backend)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'b_organization','b_user','b_calendar_event','b_job','b_job_service',
      'b_job_request','b_job_request_quality_metrics','b_duplicate_job',
      'b_duplicate_job_service','b_smb_quote','b_duplicate_quote',
      'b_quote_line_item','b_published_smbs','b_invoice','b_duplicate_invoice_rf',
      'b_conversation','b_message','b_chat_message','b_email','b_notification',
      'b_activity','b_next_step','b_next_step_smb','b_note','b_completion',
      'b_usage_metrics','b_section_engagement_track','b_app_usage',
      'b_snapshot_mm','b_snapshot_pmc','b_snapshot_market','b_utm_views',
      'b_visit','b_leads','b_smb_onboard_intent'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "service_role_all_%s" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "authenticated_read_%s" ON %I FOR SELECT TO authenticated USING (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- Enable Realtime for key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE b_job;
ALTER PUBLICATION supabase_realtime ADD TABLE b_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE b_message;
ALTER PUBLICATION supabase_realtime ADD TABLE b_notification;
ALTER PUBLICATION supabase_realtime ADD TABLE b_next_step;
