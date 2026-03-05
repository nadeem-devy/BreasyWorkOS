-- ======================================================================
-- COMPLETE BUBBLE → SUPABASE MIGRATION
-- Auto-generated on 2026-02-24 22:22:09
-- Source: Bubble API at https://app.joinbreasy.com/api/1.1/obj
-- Data types: 97
-- Total fields: 1307
-- ======================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 1099 → b_1099
-- Bubble fields: 7
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_1099 (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  file text,
  user_val text,
  year text
);

-- ────────────────────────────────────────────────────────────
-- activity → b_activity
-- Bubble fields: 12
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_activity (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  activity_type text,
  associated_fulfillment_owner text,
  associated_job text,
  body text,
  complete boolean,
  date_completed timestamptz,
  job_stage text,
  title text
);

-- ────────────────────────────────────────────────────────────
-- appsetting → b_appsetting
-- Bubble fields: 6
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_appsetting (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  cust_csvtemplate text,
  smb_csv_template text
);

-- ────────────────────────────────────────────────────────────
-- appusage → b_appusage
-- Bubble fields: 7
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_appusage (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  page_name text,
  type_val text,
  user_val text
);

-- ────────────────────────────────────────────────────────────
-- backendworkflowlog → b_backendworkflowlog
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_backendworkflowlog (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- blogpost → b_blogpost
-- Bubble fields: 15
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_blogpost (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  body_text text,
  category text,
  description text,
  likes integer,
  main_image text,
  market text,
  markets text[],
  saved boolean,
  status text,
  time_to_read integer,
  title text
);

-- ────────────────────────────────────────────────────────────
-- calendarevent → b_calendarevent
-- Bubble fields: 12
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_calendarevent (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  completed boolean,
  end_date_time timestamptz,
  event text,
  fulfillment_owner text,
  job text,
  owner text,
  quote text,
  start_date_time timestamptz
);

-- ────────────────────────────────────────────────────────────
-- call → b_call
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_call (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- chat → b_chat
-- Bubble fields: 8
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_chat (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  last_message text,
  messages text[],
  participants text[],
  smb_phone text
);

-- ────────────────────────────────────────────────────────────
-- chat-message → b_chat_message
-- Bubble fields: 11
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_chat_message (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  attachements text[],
  chat text,
  content text,
  inbound boolean,
  is_read boolean,
  owner text,
  source text
);

-- ────────────────────────────────────────────────────────────
-- chatapp → b_chatapp
-- Bubble fields: 8
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_chatapp (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  active boolean,
  job text,
  messages text[],
  users text[]
);

-- ────────────────────────────────────────────────────────────
-- chatmessages → b_chatmessages
-- Bubble fields: 13
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_chatmessages (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  audio text,
  chat text,
  completion_button boolean,
  content text,
  file text,
  image text[],
  quote_button boolean,
  read boolean,
  type_val text
);

-- ────────────────────────────────────────────────────────────
-- clicks → b_clicks
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_clicks (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- completion → b_completion
-- Bubble fields: 23
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_completion (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  "[old]_completion_next_service" text,
  "[old]_fulfillment_approved" boolean,
  "[old]_fulfillment_approved_by" text,
  added_by text,
  assignedfulfillmentuser text,
  associated_job text,
  associated_smb_user text,
  completion_after_photos text[],
  completion_before_photos text[],
  completion_duration text,
  completion_recommendation text,
  completion_smb_name text,
  completion_smb_phone text,
  completion_summary text,
  date_completed timestamptz,
  date_fulfillment_approved timestamptz,
  is_accepted boolean,
  markup numeric,
  source text
);

-- ────────────────────────────────────────────────────────────
-- conversation → b_conversation
-- Bubble fields: 16
-- ────────────────────────────────────────────────────────────
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
  job text,
  job_address jsonb,
  job_work_order text,
  messages text[],
  related_conversation_job text[],
  related_messages_assigned_wos text[],
  smb text,
  unread boolean
);

-- ────────────────────────────────────────────────────────────
-- custcontactintent → b_custcontactintent
-- Bubble fields: 13
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_custcontactintent (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_contact text,
  contact_created boolean,
  email text,
  erroroncreate boolean,
  first_name text,
  job_title text,
  last_name text,
  org text,
  phone text
);

-- ────────────────────────────────────────────────────────────
-- customercontact → b_customercontact
-- Bubble fields: 7
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_customercontact (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  email text,
  full_name text,
  phone_number integer
);

-- ────────────────────────────────────────────────────────────
-- customerscorecard → b_customerscorecard
-- Bubble fields: 8
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_customerscorecard (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  customer_org text,
  job text,
  job_created_date timestamptz,
  jobstage text
);

-- ────────────────────────────────────────────────────────────
-- duplicatedinvoices → b_duplicatedinvoices
-- Bubble fields: 12
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_duplicatedinvoices (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  invoice_created_date timestamptz,
  invoice_number text,
  invoice_status text,
  invoice_type text,
  related_job text,
  total_amount_customer integer,
  total_amount_smb integer,
  work_order text
);

-- ────────────────────────────────────────────────────────────
-- duplicateinvoicerf → b_duplicateinvoicerf
-- Bubble fields: 23
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_duplicateinvoicerf (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_date timestamptz,
  modified_date timestamptz,
  amount_cust_price integer,
  amount_smb_payout integer,
  associated_cust_org text,
  associated_smb text,
  date_cust_invoice_due timestamptz,
  date_job_completed timestamptz,
  date_job_completion_confirmed timestamptz,
  date_sent_to_ap timestamptz,
  invoice_job text,
  invoice_number text,
  invoice_quote text,
  invoice_status text,
  invoice_type text,
  job_work_order text,
  smb_address_city text,
  smb_address_state text,
  smb_address_street text,
  smb_address_zipcode integer,
  smb_name text,
  smb_phone text
);

-- ────────────────────────────────────────────────────────────
-- duplicatejob → b_duplicatejob
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_duplicatejob (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- duplicatejobservice → b_duplicatejobservice
-- Bubble fields: 14
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_duplicatejobservice (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  customer_price integer,
  markup numeric,
  service_job text,
  service_market text,
  service_smb_hours integer,
  service_smb_rate integer,
  service_suggested_hours integer,
  service_suggested_rate integer,
  service_type text,
  smb_total_cost integer
);

-- ────────────────────────────────────────────────────────────
-- duplicatenextstep → b_duplicatenextstep
-- Bubble fields: 14
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_duplicatenextstep (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_date timestamptz,
  modified_date timestamptz,
  associated_fulfillment_user text,
  associated_job text,
  blocked boolean,
  date_completed timestamptz,
  date_due timestamptz,
  due_date_text text,
  job_workorder text,
  next_step_details text,
  next_step_type text,
  task_job_stage text,
  task_status text
);

-- ────────────────────────────────────────────────────────────
-- duplicatequote → b_duplicatequote
-- Bubble fields: 20
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_duplicatequote (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_date timestamptz,
  modified_date timestamptz,
  amount_cost_of_materials integer,
  amount_customer_calculation numeric,
  amount_customer_markup numeric,
  amount_customer_total integer,
  amount_smb_labor integer,
  amount_smb_total integer,
  associated_smb_org text,
  associated_smb_user text,
  date_smb_submitted timestamptz,
  onsite_note text,
  onsite_photos text[],
  quote_additional_recommendations text,
  quote_expected_time_to_completion text,
  quote_scope_of_work text,
  quote_smb_name text,
  quote_smb_phone text,
  status text
);

-- ────────────────────────────────────────────────────────────
-- dynamicsmbtablecache → b_dynamicsmbtablecache
-- Bubble fields: 6
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_dynamicsmbtablecache (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  cache jsonb,
  n8n_query_count integer
);

-- ────────────────────────────────────────────────────────────
-- email → b_email
-- Bubble fields: 21
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_email (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  email_body text,
  email_file_attachments text[],
  email_subject text,
  email_type text,
  is_read boolean,
  is_starred boolean,
  job_work_order text,
  message_id text,
  read_by text,
  receiver text,
  receiver_email text,
  receiver_name text,
  related_fulfillment_owner text,
  sender text,
  sender_email text,
  sender_name text,
  slack_notification_sent boolean
);

-- ────────────────────────────────────────────────────────────
-- feedback → b_feedback
-- Bubble fields: 7
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_feedback (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  description text,
  job_workorder text,
  type_val text
);

-- ────────────────────────────────────────────────────────────
-- feedback-fa → b_feedback_fa
-- Bubble fields: 13
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_feedback_fa (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  description text,
  expected_behavior text,
  issue_type text,
  platform_area text,
  priority text,
  title text,
  user_val text,
  what_caused_the_issue text
);

-- ────────────────────────────────────────────────────────────
-- foactivitystats → b_foactivitystats
-- Bubble fields: 16
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_foactivitystats (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  cust_call integer,
  cust_email integer,
  cust_sms integer,
  fulfillment_name text,
  others integer,
  portal_update integer,
  related_user text,
  smb_call integer,
  smb_email integer,
  smb_sms integer,
  tenant_call integer,
  tenant_sms integer
);

-- ────────────────────────────────────────────────────────────
-- formsviewmorejobscount → b_formsviewmorejobscount
-- Bubble fields: 6
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_formsviewmorejobscount (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  job text,
  user_val text
);

-- ────────────────────────────────────────────────────────────
-- fulfillmentanalytics → b_fulfillmentanalytics
-- Bubble fields: 14
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_fulfillmentanalytics (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  breasy_profit integer,
  closed_lost integer,
  closed_won integer,
  "closed_won_revenue%" integer,
  "completion%" integer,
  date_val timestamptz,
  fulfillment_owner text,
  lost_revenue numeric,
  smb_quote_amount numeric,
  won_revenue numeric
);

-- ────────────────────────────────────────────────────────────
-- holdsmbcsv → b_holdsmbcsv
-- Bubble fields: 15
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_holdsmbcsv (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  city text,
  ein text,
  hubspot_id text,
  hubspot_url text,
  organization_bio text,
  organization_name text,
  state text,
  street text,
  vendor_portal_url text,
  website text,
  zip integer
);

-- ────────────────────────────────────────────────────────────
-- invoice → b_invoice
-- Bubble fields: 17
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_invoice (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  amount_cust_price integer,
  amount_smb_price integer,
  associated_cust_org text,
  date_due timestamptz,
  date_job_completed timestamptz,
  date_job_completion_confirmed timestamptz,
  invoice_job text,
  invoice_number text,
  invoice_status text,
  invoice_type text,
  job_work_order text,
  smb_name text,
  smb_phone text
);

-- ────────────────────────────────────────────────────────────
-- job → b_job
-- Bubble fields: 65
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_job (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  accepted_completion text,
  accepted_quote text,
  activeactivityupdated text[],
  active_next_step text,
  address_geo jsonb,
  amount_cost_of_materials integer,
  amount_cust_price integer,
  amount_markup numeric,
  amount_smb_price integer,
  assigned_cust_org text,
  assigned_cust_user text,
  assigned_fulfillment_user text,
  assigned_smb_user text,
  associated_activitiesupdated text[],
  associated_cust_invoice text,
  associated_next_steps text[],
  associated_quotes text[],
  associated_smb_payment text,
  blocked boolean,
  closed_details text,
  closed_reason text,
  date_closed timestamptz,
  date_closed_txt text,
  date_cust_invoice_due timestamptz,
  date_cust_invoice_sent timestamptz,
  date_cust_quote_sent timestamptz,
  date_fulfillment_confirmed_completion timestamptz,
  date_quote_scheduled timestamptz,
  date_quote_scheduled_txt text,
  date_smb_confirmed_paid timestamptz,
  date_smb_quote_recieved timestamptz,
  date_smb_sent_to_ap timestamptz,
  date_work_completed timestamptz,
  date_work_scheduled timestamptz,
  date_work_scheduled_txt text,
  hubspot_deal_closed boolean,
  hubspot_deal_id text,
  hubspot_deal_id_inserted boolean,
  invoice_smb_invoice text,
  job_cust_photos text[],
  job_description text,
  job_id integer,
  job_invoice_no text,
  job_market text,
  job_services_list text[],
  job_work_order text,
  last_activity timestamptz,
  occupied_first text,
  occupied_last text,
  occupied_note text,
  occupied_phone text,
  published_smbs text[],
  quote_cust_scope_of_work text,
  quote_smb_scope_of_work text,
  smb_payment_status_zapier text,
  status_cust_invoice text,
  status_cust_quote text,
  status_job_completion text,
  status_job_stage text,
  status_smb_quote text,
  time_to_quote numeric
);

-- ────────────────────────────────────────────────────────────
-- jobrequest → b_jobrequest
-- Bubble fields: 22
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_jobrequest (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  additional_details text,
  address jsonb,
  budget integer,
  contact_name text,
  email text,
  end_page text,
  high_estimate_price integer,
  high_estimate_reason text,
  low_estimate_price integer,
  low_estimate_reason text,
  market text,
  opt_in boolean,
  phone text,
  recurring text,
  role text,
  services text[],
  super_services text[],
  urgency text
);

-- ────────────────────────────────────────────────────────────
-- jobrequestqualitymetrics → b_jobrequestqualitymetrics
-- Bubble fields: 15
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_jobrequestqualitymetrics (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  budget_missing boolean,
  eligible_smbs text[],
  n8n_description_rating integer,
  "pmc_compl_%" integer,
  pmc_jobs_to_date integer,
  site_images_missing boolean,
  "smb_compl_%s" text[],
  smb_distances text[],
  warning_no_smbs_in_range_30mi boolean,
  "warning_no_smbs_with_80%" boolean,
  warning_pmc_compl_below_50 boolean
);

-- ────────────────────────────────────────────────────────────
-- jobservice → b_jobservice
-- Bubble fields: 15
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_jobservice (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  customer_price integer,
  job_work_order text,
  markup numeric,
  service_job text,
  service_market text,
  service_smb_hours integer,
  service_smb_rate integer,
  service_suggested_hours integer,
  service_suggested_rate integer,
  service_type text,
  smb_total_cost integer
);

-- ────────────────────────────────────────────────────────────
-- landingpagereview → b_landingpagereview
-- Bubble fields: 7
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_landingpagereview (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  content text,
  job text,
  user_val text
);

-- ────────────────────────────────────────────────────────────
-- landingpageteam → b_landingpageteam
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_landingpageteam (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- leads → b_leads
-- Bubble fields: 8
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_leads (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  email text,
  message text,
  name text,
  phone text
);

-- ────────────────────────────────────────────────────────────
-- managertask → b_managertask
-- Bubble fields: 11
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_managertask (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associatedjob text,
  description text,
  issue text,
  notify text[],
  reviewed boolean,
  stage text,
  workorder text
);

-- ────────────────────────────────────────────────────────────
-- mapboxdynamicsmbtablecache → b_mapboxdynamicsmbtablecache
-- Bubble fields: 6
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_mapboxdynamicsmbtablecache (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  mbcache jsonb,
  n8n_query_count integer
);

-- ────────────────────────────────────────────────────────────
-- marketingfaq → b_marketingfaq
-- Bubble fields: 8
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_marketingfaq (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  active boolean,
  answer text,
  audience text,
  question text
);

-- ────────────────────────────────────────────────────────────
-- marketingtestimonial → b_marketingtestimonial
-- Bubble fields: 9
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_marketingtestimonial (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  active boolean,
  audience text,
  display_name text,
  market text,
  text text
);

-- ────────────────────────────────────────────────────────────
-- markettwins(lut) → b_markettwinslut
-- Bubble fields: 6
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_markettwinslut (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  address jsonb,
  linked_option text
);

-- ────────────────────────────────────────────────────────────
-- message → b_message
-- Bubble fields: 11
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_message (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  content text,
  direction text,
  from_phone text,
  message_date timestamptz,
  message_note text,
  related_note text,
  sender text
);

-- ────────────────────────────────────────────────────────────
-- monthgoalsbreasy → b_monthgoalsbreasy
-- Bubble fields: 6
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_monthgoalsbreasy (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_date_round_to_month_usmountain_plus12_hours timestamptz,
  gp_goal integer
);

-- ────────────────────────────────────────────────────────────
-- monthgoalsmarket → b_monthgoalsmarket
-- Bubble fields: 8
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_monthgoalsmarket (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_date_round_to_month_usmountain_plus12_hours timestamptz,
  associated_market text,
  gp_goal integer,
  market_name_for_sorting text
);

-- ────────────────────────────────────────────────────────────
-- monthgoalsmm → b_monthgoalsmm
-- Bubble fields: 8
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_monthgoalsmm (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_date_round_to_month_usmountain_plus12_hours timestamptz,
  associated_mm text,
  gp_goal integer,
  mm_first_name_for_sorting text
);

-- ────────────────────────────────────────────────────────────
-- nextstep → b_nextstep
-- Bubble fields: 14
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_nextstep (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_fulfillment_user text,
  associated_job text,
  blocked boolean,
  date_completed timestamptz,
  date_due timestamptz,
  due_date_text text,
  next_step_details text,
  next_step_type text,
  task_job_stage text,
  task_status text
);

-- ────────────────────────────────────────────────────────────
-- nextstepsmb → b_nextstepsmb
-- Bubble fields: 14
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_nextstepsmb (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_fulfillment_user text,
  blocked boolean,
  date_completed timestamptz,
  date_due timestamptz,
  due_date_text text,
  next_step_details text,
  next_step_type text,
  related_organization text,
  task_manager text,
  task_status text
);

-- ────────────────────────────────────────────────────────────
-- note → b_note
-- Bubble fields: 9
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_note (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associatedjob text,
  associated_org text,
  body text,
  file text[],
  note_type text
);

-- ────────────────────────────────────────────────────────────
-- notification-joy → b_notification_joy
-- Bubble fields: 10
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_notification_joy (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  completed boolean,
  job text,
  message text,
  mm text,
  type_val text,
  users text[]
);

-- ────────────────────────────────────────────────────────────
-- notifications → b_notifications
-- Bubble fields: 12
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_notifications (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  content text,
  read boolean,
  receiver text,
  related_email text,
  related_job text,
  related_message text,
  sender text,
  type_val text
);

-- ────────────────────────────────────────────────────────────
-- organization → b_organization
-- Bubble fields: 93
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_organization (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_activities text[],
  associated_jobs text[],
  associated_primary_contact text,
  associated_users text[],
  cust_ap_email text,
  cust_ap_payment_discount numeric,
  cust_ap_payment_method text,
  cust_ap_payment_terms text,
  cust_ap_source text,
  cust_associated_ap_contact text,
  cust_associated_approval_contact text,
  cust_associated_coordinator_contact text,
  cust_bill_to_address jsonb,
  cust_factoring_approved boolean,
  cust_factoring_set_up boolean,
  cust_invoiced_all_closed numeric,
  cust_invoiced_closed_lost numeric,
  cust_invoiced_closed_won numeric,
  cust_property_types text[],
  cust_tier text,
  cust_vendor_portal_url text,
  date_agreed_to_communications timestamptz,
  date_last_complete timestamptz,
  date_last_cw timestamptz,
  date_last_published timestamptz,
  date_last_sent_or_assigned timestamptz,
  lifecycle_active_complete boolean,
  lifecycle_active_sent boolean,
  lifecycle_completed_wo boolean,
  lifecycle_sent_workorder boolean,
  lifecycle_stage text,
  lifecycle_stage_prev text,
  mercury_status text,
  metric_compl_perc numeric,
  metric_cw_rev_perc numeric,
  metric_goal_weekly_job_volume text,
  metric_payment_count integer,
  metric_smb_rev_current_per_week integer,
  metric_smb_rev_goal_per_week integer,
  metric_total_wo_matched integer,
  metric_wo_count_all_closed integer,
  metric_wo_count_closed_lost integer,
  metric_wo_count_closed_won integer,
  metric_wo_created_all_time integer,
  note_cust text,
  note_fulfillment text,
  note_org_bio text,
  note_smb_preferences text,
  org_added_via text,
  org_address_geo jsonb,
  org_agreed_to_communications text,
  org_function text,
  org_hubspot_id text,
  org_markets text[],
  org_name text,
  org_tier text,
  org_website text,
  readonly_days_since_complete integer,
  readonly_days_since_cw integer,
  readonly_days_since_published integer,
  readonly_days_since_sent_or_assigned integer,
  smb_agreed_to_payment_method text,
  smb_agreed_to_smb_sla text,
  smb_agreed_to_subcontracting text,
  smb_approved_for_work boolean,
  smb_bank_acc_num integer,
  smb_bank_route_num integer,
  smb_date_agreed_to_payment_method timestamptz,
  smb_date_agreed_to_smb_sla timestamptz,
  smb_date_agreed_to_subcontracting timestamptz,
  smb_date_approved_for_work timestamptz,
  smb_date_orientation_call_completed timestamptz,
  smb_ein integer,
  smb_insurance_exp timestamptz,
  smb_insurance_num text,
  smb_license_exp timestamptz,
  smb_license_num text,
  smb_orientation_complete text,
  smb_payment_all_closed numeric,
  smb_payment_closed_lost numeric,
  smb_payment_closed_won numeric,
  smb_requested_job boolean,
  smb_services text[],
  smb_source text,
  smb_tierpoint_compl_count integer,
  smb_tierpoint_compl_perc integer,
  smb_tierpoint_cw_rev_perc integer,
  smb_tierpoint_smb_payment integer,
  smb_tierpoint_total integer
);

-- ────────────────────────────────────────────────────────────
-- payment → b_payment
-- Bubble fields: 15
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_payment (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  amount_smb_price integer,
  associated_job text,
  associated_smb_org text,
  associated_smb_user text,
  date_sent_to_quickbooks timestamptz,
  job_address jsonb,
  job_work_complete timestamptz,
  job_work_order text,
  payment_status text,
  smb_address jsonb,
  zap_trigger_success boolean
);

-- ────────────────────────────────────────────────────────────
-- pricerecommendations → b_pricerecommendations
-- Bubble fields: 8
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_pricerecommendations (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  avg_closed_won_price integer,
  parent_service text,
  recommended_price integer,
  service text
);

-- ────────────────────────────────────────────────────────────
-- publishedsmbs → b_publishedsmbs
-- Bubble fields: 11
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_publishedsmbs (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  accepted boolean,
  completed boolean,
  job text,
  quotation_date timestamptz,
  smb_id text,
  smb_name text,
  viewed boolean
);

-- ────────────────────────────────────────────────────────────
-- pushnotification → b_pushnotification
-- Bubble fields: 9
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_pushnotification (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  job text,
  status text,
  sub_text text,
  title text,
  user_val text
);

-- ────────────────────────────────────────────────────────────
-- qarecord → b_qarecord
-- Bubble fields: 9
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_qarecord (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  success boolean,
  success_future_suggestion text,
  success_mm_score integer,
  success_pmc_score integer,
  success_smb_score integer
);

-- ────────────────────────────────────────────────────────────
-- quotelineitem → b_quotelineitem
-- Bubble fields: 15
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_quotelineitem (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_job text,
  associated_quote text,
  change_price boolean,
  change_price_reason text,
  cost_of_material numeric,
  description text,
  n8n boolean,
  total_price integer,
  unit_measurement text,
  unit_price integer,
  unit_quantity integer
);

-- ────────────────────────────────────────────────────────────
-- response → b_response
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_response (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- revenuegoals → b_revenuegoals
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_revenuegoals (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- scopetestdata → b_scopetestdata
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_scopetestdata (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- sectionengagementtrack → b_sectionengagementtrack
-- Bubble fields: 10
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_sectionengagementtrack (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  created_date_txt text,
  duration integer,
  enter_time timestamptz,
  leave_time timestamptz,
  page_name text,
  related_user text
);

-- ────────────────────────────────────────────────────────────
-- serviceticket → b_serviceticket
-- Bubble fields: 14
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_serviceticket (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_cust_company text,
  associated_job text,
  associated_mm text,
  associated_smb_org text,
  date_resolved timestamptz,
  description text,
  resolution text,
  service_ticket_category text,
  service_ticket_status text,
  ticket_notes text
);

-- ────────────────────────────────────────────────────────────
-- slackalytics → b_slackalytics
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_slackalytics (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- smbav → b_smbav
-- Bubble fields: 9
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_smbav (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  management_tools text,
  markets text[],
  open_availability text,
  services text[],
  user_val text
);

-- ────────────────────────────────────────────────────────────
-- smbonboardintent → b_smbonboardintent
-- Bubble fields: 24
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_smbonboardintent (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_smb_user text,
  baseline_weekly_revenue text,
  business_name text,
  market text,
  monthlyjobcmpl integer,
  name_first text,
  name_last text,
  page_exit text,
  phone text,
  revenue_goal integer,
  smb_priority text,
  smb_source text,
  source_url text,
  super_services text[],
  user_val text,
  utm_campaign text,
  utm_medium text,
  utm_source text,
  utm_term text,
  website text
);

-- ────────────────────────────────────────────────────────────
-- smbquestionnaire → b_smbquestionnaire
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_smbquestionnaire (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- smbquote → b_smbquote
-- Bubble fields: 20
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_smbquote (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  added_by text,
  amount_cost_of_materials integer,
  amount_cust_total integer,
  amount_smb_total integer,
  associated_smb_user text,
  date_completion_expected timestamptz,
  date_quote_submitted timestamptz,
  onsite_photos text[],
  quote_additional_recommendations text,
  quote_expected_minutes_time_to_complete integer,
  quote_expected_time_to_complete text,
  quote_scope_of_work text,
  quote_smb_name text,
  quote_smb_phone text,
  source text,
  status_quote text
);

-- ────────────────────────────────────────────────────────────
-- smbrequest → b_smbrequest
-- Bubble fields: 22
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_smbrequest (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  address jsonb,
  associated_job text,
  associated_pmc text,
  associated_smb_org text,
  associated_smb_user text,
  closed_opp_reason text,
  closed_won_reason text,
  context text,
  date_deadline timestamptz,
  market text,
  priority text,
  request_owner text,
  services text[],
  special_request text,
  stage text,
  status text,
  type_val text
);

-- ────────────────────────────────────────────────────────────
-- smbsmsblast → b_smbsmsblast
-- Bubble fields: 9
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_smbsmsblast (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  activities text[],
  messages text[],
  message_text text,
  orgs text[],
  sent_count integer
);

-- ────────────────────────────────────────────────────────────
-- smstable → b_smstable
-- Bubble fields: 7
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_smstable (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  last_edited_by text,
  message text,
  stage text
);

-- ────────────────────────────────────────────────────────────
-- snapshot_daily → b_snapshot_daily
-- Bubble fields: 10
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_snapshot_daily (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  market_snapshot_list text[],
  mmsnapshot_list text[],
  overall_snapshot text,
  pmcsnapshot_list text[],
  record_date timestamptz,
  smborg_snapshot_list text[]
);

-- ────────────────────────────────────────────────────────────
-- snapshot_market → b_snapshot_market
-- Bubble fields: 15
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_snapshot_market (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  agg_co_count integer,
  agg_co_revenue integer,
  agg_cw_count integer,
  agg_cw_revenue integer,
  agg_gross_profit integer,
  agg_op_gross_profit integer,
  agg_service_types_requested_list text[],
  closed_jobs text[],
  date_val timestamptz,
  market text,
  open_jobs text[]
);

-- ────────────────────────────────────────────────────────────
-- snapshot_mm → b_snapshot_mm
-- Bubble fields: 20
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_snapshot_mm (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  agg_co_count integer,
  agg_co_revenue integer,
  agg_cw_count integer,
  agg_cw_revenue integer,
  agg_gross_profit integer,
  agg_op_gross_profit integer,
  closed_jobs text[],
  date_val timestamptz,
  marketmanager text,
  open_jobs text[],
  snap_activities_added_count integer,
  snap_jobs_w_no_2_day_activity integer,
  snap_old_open_wos_count integer,
  snap_open_wos_count integer,
  snap_past_due_next_steps_count integer,
  snap_tomorrow_next_steps_count integer
);

-- ────────────────────────────────────────────────────────────
-- snapshot_overall → b_snapshot_overall
-- Bubble fields: 25
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_snapshot_overall (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  active_pmcs text[],
  active_smbs text[],
  agg_co_count integer,
  agg_co_revenue integer,
  agg_cw_count integer,
  agg_cw_revenue integer,
  agg_gross_profit integer,
  agg_mm_accepted_quoted_revenue integer,
  agg_op_gross_profit integer,
  agg_pmc_approved_revenue integer,
  closed_jobs text[],
  cw_pmcs_one_day text[],
  cw_smbs_one_day text[],
  date_val timestamptz,
  open_jobs text[],
  snap_active_customers_count integer,
  snap_active_cw_customers_count integer,
  snap_active_cw_smbs_count integer,
  snap_active_smbs_count integer,
  snap_matched_smbs_count integer,
  snap_open_wos_count integer
);

-- ────────────────────────────────────────────────────────────
-- snapshot_pmc → b_snapshot_pmc
-- Bubble fields: 18
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_snapshot_pmc (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  agg_co_count integer,
  agg_co_revenue integer,
  agg_cw_count integer,
  agg_cw_revenue integer,
  agg_gross_profit integer,
  agg_op_gross_profit integer,
  agg_services_requested text[],
  closed_jobs text[],
  date_val timestamptz,
  open_jobs text[],
  pmc text,
  snap_old_wos_count integer,
  snap_open_wos_count integer,
  snap_past_due_quote_count integer
);

-- ────────────────────────────────────────────────────────────
-- snapshot_smborg → b_snapshot_smborg
-- Bubble fields: 20
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_snapshot_smborg (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  agg_co_count integer,
  agg_co_revenue integer,
  agg_cw_revenue integer,
  agg_cw_count integer,
  agg_gross_profit integer,
  agg_op_gross_profit integer,
  agg_op_payout_amount integer,
  agg_won_payout_amount integer,
  closed_jobs text[],
  date_val timestamptz,
  open_jobs text[],
  smb_org text,
  snap_completions_past_due_count integer,
  snap_old_wos_count integer,
  snap_open_wos_count integer,
  snap_quotes_past_due_count integer
);

-- ────────────────────────────────────────────────────────────
-- task → b_task
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_task (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- tripcharge → b_tripcharge
-- Bubble fields: 9
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_tripcharge (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  cust_price numeric,
  job text,
  photos text[],
  smb_price integer,
  why_trip_charge text
);

-- ────────────────────────────────────────────────────────────
-- tripchargev2 → b_tripchargev2
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_tripchargev2 (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- twiliocall → b_twiliocall
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_twiliocall (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- twilioconversation → b_twilioconversation
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_twilioconversation (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- twiliomessage → b_twiliomessage
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_twiliomessage (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- usagemetrics → b_usagemetrics
-- Bubble fields: 14
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_usagemetrics (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  all_visits integer,
  element_name text,
  element_type text,
  interaction text,
  page_name text,
  type_val text,
  unique_visits text[],
  visit_time_date timestamptz,
  visit_time_date_txt text,
  who_interacted text
);

-- ────────────────────────────────────────────────────────────
-- user → b_user
-- Bubble fields: 52
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_user (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_date timestamptz,
  modified_date timestamptz,
  authentication jsonb,
  contact_added_by text,
  cust_contact_hubspot_id text,
  cust_job_title text,
  delete_account boolean,
  mm_dialpad_id text,
  mm_job_page integer,
  mm_slack_id text,
  smb1099 text,
  smb_compl_date_count integer,
  smb_on_time_compl_count integer,
  smb_on_time_quote_count integer,
  smb_quote_date_count integer,
  smb_approved_for_work boolean,
  smb_associated_smb_onboard_intent text,
  smb_daily_availability text[],
  smb_num_of_helpers integer,
  smb_num_of_trucks integer,
  smb_services text[],
  smb_source text,
  "smb_special_equipment&notes" text,
  smb_w9 text,
  user_signed_up boolean,
  user_accept_terms boolean,
  user_account_status text,
  user_added_by text,
  user_added_via text,
  user_alpha_tester boolean,
  user_associated_activities text[],
  user_associated_jobs text[],
  user_associated_org text,
  user_beta_tester boolean,
  user_contact_email text,
  user_contact_phone text,
  user_first_name text,
  user_full_name text,
  user_function text,
  user_language text[],
  user_last_name text,
  user_lifecycle text,
  user_login_code integer,
  user_login_expiration timestamptz,
  user_login_last_date timestamptz,
  user_markets text[],
  user_profile_pic text,
  user_role text,
  user_verified boolean,
  user_verified_contact boolean,
  user_verified_details boolean
);

-- ────────────────────────────────────────────────────────────
-- utmevent → b_utmevent
-- Bubble fields: 0
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_utmevent (
  id bigserial PRIMARY KEY,

);

-- ────────────────────────────────────────────────────────────
-- utmviews → b_utmviews
-- Bubble fields: 9
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_utmviews (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  campaign text,
  device text,
  medium text,
  source text,
  term text
);

-- ────────────────────────────────────────────────────────────
-- visit → b_visit
-- Bubble fields: 8
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_visit (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  tenant_last_viewed timestamptz,
  tenant_response_stage integer,
  visit_permission text,
  visit_type text
);

-- ────────────────────────────────────────────────────────────
-- weekly_stats_breasy → b_weekly_stats_breasy
-- Bubble fields: 57
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_weekly_stats_breasy (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  dailies_mtd text[],
  dailies_t30 text[],
  dailies_week text[],
  end_date timestamptz,
  mtd_average_amt_per_wo numeric,
  mtdavg_wos_per_customer numeric,
  mtd_completion_perc numeric,
  "mtd_cwrev%" numeric,
  mtd_gp_perc numeric,
  mtd_gross_profit integer,
  mtd_invoiced integer,
  mtdnum_active_customers integer,
  mtd_num_active_cwcustomers integer,
  mtd_num_active_cwsmbs integer,
  mtd_num_active_smbs integer,
  mtd_num_recurring_wos_completed integer,
  mtd_num_wos_completed integer,
  mtd_num_wos_created integer,
  mtd_perc_wos_recurring numeric,
  mtd_quoted_amounts integer,
  t30_average_amt_per_wo numeric,
  t30avg_wos_per_customer numeric,
  t30_completion_perc numeric,
  "t30_cwrev%" numeric,
  t30_follow_through_v1 numeric,
  t30_gp_perc numeric,
  t30_gross_profit integer,
  t30_invoiced integer,
  t30num_active_customers integer,
  t30_num_active_cwcustomers integer,
  t30_num_active_cwsmbs integer,
  t30_num_active_smbs integer,
  t30_num_recurring_wos_completed integer,
  t30_num_wos_completed integer,
  t30_num_wos_created integer,
  t30_perc_wos_recurring numeric,
  t30_quoted_amounts integer,
  week_average_amt_per_wo numeric,
  weekavg_wos_per_customer numeric,
  week_completion_perc numeric,
  "week_cwrev%" numeric,
  week_gp_perc numeric,
  week_gross_profit integer,
  week_invoiced integer,
  weeknum_active_customers integer,
  week_num_active_cwcustomers integer,
  week_num_active_cwsmbs integer,
  week_num_active_smbs integer,
  week_num_recurring_wos_completed integer,
  week_num_wos_completed integer,
  week_num_wos_created integer,
  week_perc_wos_recurring numeric,
  week_quoted_amounts integer
);

-- ────────────────────────────────────────────────────────────
-- weekly_stats_main → b_weekly_stats_main
-- Bubble fields: 15
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_weekly_stats_main (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  breasy text,
  end_date timestamptz,
  markets text[],
  mms text[],
  mtd_dailies text[],
  pmcs text[],
  smbs text[],
  t30_dailies text[],
  week integer,
  week_dailies text[],
  yrwk integer
);

-- ────────────────────────────────────────────────────────────
-- weekly_stats_market → b_weekly_stats_market
-- Bubble fields: 33
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_weekly_stats_market (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_market text,
  end_date timestamptz,
  month_gpgoal integer,
  mtd_gp_goal numeric,
  mtd_gpperc numeric,
  mtd_gross_profit integer,
  mtd_lost_gp integer,
  mtd_perc_progress_through_month numeric,
  mtd_perc_to_gp_goal numeric,
  mtd_snapshots text[],
  num_old_wos integer,
  num_open_wos integer,
  t30_compl_perc numeric,
  t30_cwrev_perc numeric,
  t30_days_to_cust_quote numeric,
  t30num_active_customers integer,
  t30num_active_smbs integer,
  t30num_customer_activities integer,
  t30num_cwcustomers integer,
  t30num_cwsmbs integer,
  t30num_op_wos integer,
  t30num_smbactivities integer,
  t30num_won_wos integer,
  t30_op_rev integer,
  t30_service_types_requested text[],
  t30_snapshots text[],
  t30speed_from_created_to_cust_quote numeric,
  t30_won_rev integer,
  week_snapshots text[]
);

-- ────────────────────────────────────────────────────────────
-- weekly_stats_mm → b_weekly_stats_mm
-- Bubble fields: 32
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_weekly_stats_mm (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_mm text,
  end_date timestamptz,
  month_gp_goal integer,
  mtd_gpgoal numeric,
  mtd_gpperc numeric,
  mtd_gross_profit integer,
  mtd_lost_gp integer,
  mtdpercent_progress_through_month numeric,
  mtdpercent_to_gpgoal numeric,
  mtd_snapshots text[],
  num_next_steps_past_due integer,
  num_old_wos integer,
  num_open_wos integer,
  t30_completion_perc numeric,
  t30_cw_rev_perc numeric,
  t30days_to_cust_quote numeric,
  t30num_active_customers integer,
  t30num_active_smbs integer,
  t30num_customer_activities integer,
  t30num_cwcustomers integer,
  t30num_cwsmbs integer,
  t30num_op_wos integer,
  t30num_smbactivities integer,
  t30num_won_wos integer,
  t30_op_rev integer,
  t30_snapshots text[],
  t30_won_rev integer,
  week_snapshots text[]
);

-- ────────────────────────────────────────────────────────────
-- weekly_stats_pmc → b_weekly_stats_pmc
-- Bubble fields: 21
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_weekly_stats_pmc (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_markets text[],
  associated_pmc text,
  end_date timestamptz,
  market_mms text[],
  num_old_wos integer,
  num_open_wos integer,
  num_past_due_approvals integer,
  t30_compl_perc numeric,
  t30_cwrev_perc numeric,
  t30_gpp numeric,
  t30_num_lost_wos integer,
  t30_num_wocomplete integer,
  t30_op_rev integer,
  t30_past_due_approvals integer,
  t30_service_types_recieved text[],
  t30_won_revenue integer,
  week_past_due_approvals integer
);

-- ────────────────────────────────────────────────────────────
-- weekly_stats_smborg → b_weekly_stats_smborg
-- Bubble fields: 46
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b_weekly_stats_smborg (
  id bigserial PRIMARY KEY,
  bubble_id text UNIQUE NOT NULL,
  created_by text,
  created_date timestamptz,
  modified_date timestamptz,
  associated_markets text[],
  associated_smborg text,
  end_date timestamptz,
  market_mms text[],
  monthly_payout_goal integer,
  mtd_won_pay integer,
  mtd_gp_perc numeric,
  mtd_lost_pay integer,
  mtd_num_past_due_quotes integer,
  mtd_num_past_due_scheduled integer,
  mtd_op_gp integer,
  mtd_paid_out integer,
  mtd_payout_goal integer,
  mtd_pay_perc numeric,
  mtd_perc_of_month numeric,
  mtd_perc_to_payout_goal integer,
  mtd_snapshots text[],
  mtd_won_gp integer,
  num_old_wos integer,
  num_open_wos integer,
  num_past_due_quotes integer,
  num_past_due_scheduled integer,
  t30_compl_perc numeric,
  t30_cwrev_perc numeric,
  t30_follow_through_v1 numeric,
  t30_followthrough_v2 numeric,
  t30_gpperc numeric,
  t30_lost_gp integer,
  t30num_op_wos integer,
  t30num_won_wos integer,
  t30_op_rev integer,
  t30_past_due_quotes integer,
  t30_past_due_scheduled integer,
  t30_perc_completion_form_creation integer,
  t30_perc_quote_form_creation integer,
  t30_perc_to_payout_goal integer,
  t30_smbpayout integer,
  t30_snapshots text[],
  t30_won_gp integer,
  t30_won_rev integer,
  week_snapshots text[],
  wkpayout_goalx4 integer
);

-- ======================================================================
-- INDEXES
-- ======================================================================
CREATE INDEX IF NOT EXISTS idx_b_1099_bubble_id ON b_1099(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_1099_created ON b_1099(created_date);
CREATE INDEX IF NOT EXISTS idx_b_activity_bubble_id ON b_activity(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_activity_created ON b_activity(created_date);
CREATE INDEX IF NOT EXISTS idx_b_appsetting_bubble_id ON b_appsetting(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_appsetting_created ON b_appsetting(created_date);
CREATE INDEX IF NOT EXISTS idx_b_appusage_bubble_id ON b_appusage(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_appusage_created ON b_appusage(created_date);
CREATE INDEX IF NOT EXISTS idx_b_backendworkflowlog_bubble_id ON b_backendworkflowlog(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_blogpost_bubble_id ON b_blogpost(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_blogpost_created ON b_blogpost(created_date);
CREATE INDEX IF NOT EXISTS idx_b_calendarevent_bubble_id ON b_calendarevent(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_calendarevent_created ON b_calendarevent(created_date);
CREATE INDEX IF NOT EXISTS idx_b_call_bubble_id ON b_call(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_chat_bubble_id ON b_chat(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_chat_created ON b_chat(created_date);
CREATE INDEX IF NOT EXISTS idx_b_chat_message_bubble_id ON b_chat_message(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_chat_message_created ON b_chat_message(created_date);
CREATE INDEX IF NOT EXISTS idx_b_chatapp_bubble_id ON b_chatapp(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_chatapp_created ON b_chatapp(created_date);
CREATE INDEX IF NOT EXISTS idx_b_chatmessages_bubble_id ON b_chatmessages(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_chatmessages_created ON b_chatmessages(created_date);
CREATE INDEX IF NOT EXISTS idx_b_clicks_bubble_id ON b_clicks(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_completion_bubble_id ON b_completion(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_completion_created ON b_completion(created_date);
CREATE INDEX IF NOT EXISTS idx_b_conversation_bubble_id ON b_conversation(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_conversation_created ON b_conversation(created_date);
CREATE INDEX IF NOT EXISTS idx_b_custcontactintent_bubble_id ON b_custcontactintent(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_custcontactintent_created ON b_custcontactintent(created_date);
CREATE INDEX IF NOT EXISTS idx_b_customercontact_bubble_id ON b_customercontact(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_customercontact_created ON b_customercontact(created_date);
CREATE INDEX IF NOT EXISTS idx_b_customerscorecard_bubble_id ON b_customerscorecard(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_customerscorecard_created ON b_customerscorecard(created_date);
CREATE INDEX IF NOT EXISTS idx_b_duplicatedinvoices_bubble_id ON b_duplicatedinvoices(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_duplicatedinvoices_created ON b_duplicatedinvoices(created_date);
CREATE INDEX IF NOT EXISTS idx_b_duplicateinvoicerf_bubble_id ON b_duplicateinvoicerf(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_duplicateinvoicerf_created ON b_duplicateinvoicerf(created_date);
CREATE INDEX IF NOT EXISTS idx_b_duplicatejob_bubble_id ON b_duplicatejob(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_duplicatejobservice_bubble_id ON b_duplicatejobservice(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_duplicatejobservice_created ON b_duplicatejobservice(created_date);
CREATE INDEX IF NOT EXISTS idx_b_duplicatenextstep_bubble_id ON b_duplicatenextstep(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_duplicatenextstep_created ON b_duplicatenextstep(created_date);
CREATE INDEX IF NOT EXISTS idx_b_duplicatequote_bubble_id ON b_duplicatequote(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_duplicatequote_created ON b_duplicatequote(created_date);
CREATE INDEX IF NOT EXISTS idx_b_dynamicsmbtablecache_bubble_id ON b_dynamicsmbtablecache(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_dynamicsmbtablecache_created ON b_dynamicsmbtablecache(created_date);
CREATE INDEX IF NOT EXISTS idx_b_email_bubble_id ON b_email(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_email_created ON b_email(created_date);
CREATE INDEX IF NOT EXISTS idx_b_feedback_bubble_id ON b_feedback(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_feedback_created ON b_feedback(created_date);
CREATE INDEX IF NOT EXISTS idx_b_feedback_fa_bubble_id ON b_feedback_fa(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_feedback_fa_created ON b_feedback_fa(created_date);
CREATE INDEX IF NOT EXISTS idx_b_foactivitystats_bubble_id ON b_foactivitystats(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_foactivitystats_created ON b_foactivitystats(created_date);
CREATE INDEX IF NOT EXISTS idx_b_formsviewmorejobscount_bubble_id ON b_formsviewmorejobscount(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_formsviewmorejobscount_created ON b_formsviewmorejobscount(created_date);
CREATE INDEX IF NOT EXISTS idx_b_fulfillmentanalytics_bubble_id ON b_fulfillmentanalytics(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_fulfillmentanalytics_created ON b_fulfillmentanalytics(created_date);
CREATE INDEX IF NOT EXISTS idx_b_holdsmbcsv_bubble_id ON b_holdsmbcsv(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_holdsmbcsv_created ON b_holdsmbcsv(created_date);
CREATE INDEX IF NOT EXISTS idx_b_invoice_bubble_id ON b_invoice(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_invoice_created ON b_invoice(created_date);
CREATE INDEX IF NOT EXISTS idx_b_job_bubble_id ON b_job(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_job_created ON b_job(created_date);
CREATE INDEX IF NOT EXISTS idx_b_jobrequest_bubble_id ON b_jobrequest(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_jobrequest_created ON b_jobrequest(created_date);
CREATE INDEX IF NOT EXISTS idx_b_jobrequestqualitymetrics_bubble_id ON b_jobrequestqualitymetrics(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_jobrequestqualitymetrics_created ON b_jobrequestqualitymetrics(created_date);
CREATE INDEX IF NOT EXISTS idx_b_jobservice_bubble_id ON b_jobservice(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_jobservice_created ON b_jobservice(created_date);
CREATE INDEX IF NOT EXISTS idx_b_landingpagereview_bubble_id ON b_landingpagereview(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_landingpagereview_created ON b_landingpagereview(created_date);
CREATE INDEX IF NOT EXISTS idx_b_landingpageteam_bubble_id ON b_landingpageteam(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_leads_bubble_id ON b_leads(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_leads_created ON b_leads(created_date);
CREATE INDEX IF NOT EXISTS idx_b_managertask_bubble_id ON b_managertask(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_managertask_created ON b_managertask(created_date);
CREATE INDEX IF NOT EXISTS idx_b_mapboxdynamicsmbtablecache_bubble_id ON b_mapboxdynamicsmbtablecache(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_mapboxdynamicsmbtablecache_created ON b_mapboxdynamicsmbtablecache(created_date);
CREATE INDEX IF NOT EXISTS idx_b_marketingfaq_bubble_id ON b_marketingfaq(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_marketingfaq_created ON b_marketingfaq(created_date);
CREATE INDEX IF NOT EXISTS idx_b_marketingtestimonial_bubble_id ON b_marketingtestimonial(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_marketingtestimonial_created ON b_marketingtestimonial(created_date);
CREATE INDEX IF NOT EXISTS idx_b_markettwinslut_bubble_id ON b_markettwinslut(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_markettwinslut_created ON b_markettwinslut(created_date);
CREATE INDEX IF NOT EXISTS idx_b_message_bubble_id ON b_message(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_message_created ON b_message(created_date);
CREATE INDEX IF NOT EXISTS idx_b_monthgoalsbreasy_bubble_id ON b_monthgoalsbreasy(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_monthgoalsbreasy_created ON b_monthgoalsbreasy(created_date);
CREATE INDEX IF NOT EXISTS idx_b_monthgoalsmarket_bubble_id ON b_monthgoalsmarket(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_monthgoalsmarket_created ON b_monthgoalsmarket(created_date);
CREATE INDEX IF NOT EXISTS idx_b_monthgoalsmm_bubble_id ON b_monthgoalsmm(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_monthgoalsmm_created ON b_monthgoalsmm(created_date);
CREATE INDEX IF NOT EXISTS idx_b_nextstep_bubble_id ON b_nextstep(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_nextstep_created ON b_nextstep(created_date);
CREATE INDEX IF NOT EXISTS idx_b_nextstepsmb_bubble_id ON b_nextstepsmb(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_nextstepsmb_created ON b_nextstepsmb(created_date);
CREATE INDEX IF NOT EXISTS idx_b_note_bubble_id ON b_note(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_note_created ON b_note(created_date);
CREATE INDEX IF NOT EXISTS idx_b_notification_joy_bubble_id ON b_notification_joy(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_notification_joy_created ON b_notification_joy(created_date);
CREATE INDEX IF NOT EXISTS idx_b_notifications_bubble_id ON b_notifications(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_notifications_created ON b_notifications(created_date);
CREATE INDEX IF NOT EXISTS idx_b_organization_bubble_id ON b_organization(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_organization_created ON b_organization(created_date);
CREATE INDEX IF NOT EXISTS idx_b_payment_bubble_id ON b_payment(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_payment_created ON b_payment(created_date);
CREATE INDEX IF NOT EXISTS idx_b_pricerecommendations_bubble_id ON b_pricerecommendations(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_pricerecommendations_created ON b_pricerecommendations(created_date);
CREATE INDEX IF NOT EXISTS idx_b_publishedsmbs_bubble_id ON b_publishedsmbs(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_publishedsmbs_created ON b_publishedsmbs(created_date);
CREATE INDEX IF NOT EXISTS idx_b_pushnotification_bubble_id ON b_pushnotification(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_pushnotification_created ON b_pushnotification(created_date);
CREATE INDEX IF NOT EXISTS idx_b_qarecord_bubble_id ON b_qarecord(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_qarecord_created ON b_qarecord(created_date);
CREATE INDEX IF NOT EXISTS idx_b_quotelineitem_bubble_id ON b_quotelineitem(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_quotelineitem_created ON b_quotelineitem(created_date);
CREATE INDEX IF NOT EXISTS idx_b_response_bubble_id ON b_response(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_revenuegoals_bubble_id ON b_revenuegoals(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_scopetestdata_bubble_id ON b_scopetestdata(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_sectionengagementtrack_bubble_id ON b_sectionengagementtrack(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_sectionengagementtrack_created ON b_sectionengagementtrack(created_date);
CREATE INDEX IF NOT EXISTS idx_b_serviceticket_bubble_id ON b_serviceticket(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_serviceticket_created ON b_serviceticket(created_date);
CREATE INDEX IF NOT EXISTS idx_b_slackalytics_bubble_id ON b_slackalytics(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_smbav_bubble_id ON b_smbav(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_smbav_created ON b_smbav(created_date);
CREATE INDEX IF NOT EXISTS idx_b_smbonboardintent_bubble_id ON b_smbonboardintent(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_smbonboardintent_created ON b_smbonboardintent(created_date);
CREATE INDEX IF NOT EXISTS idx_b_smbquestionnaire_bubble_id ON b_smbquestionnaire(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_smbquote_bubble_id ON b_smbquote(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_smbquote_created ON b_smbquote(created_date);
CREATE INDEX IF NOT EXISTS idx_b_smbrequest_bubble_id ON b_smbrequest(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_smbrequest_created ON b_smbrequest(created_date);
CREATE INDEX IF NOT EXISTS idx_b_smbsmsblast_bubble_id ON b_smbsmsblast(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_smbsmsblast_created ON b_smbsmsblast(created_date);
CREATE INDEX IF NOT EXISTS idx_b_smstable_bubble_id ON b_smstable(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_smstable_created ON b_smstable(created_date);
CREATE INDEX IF NOT EXISTS idx_b_snapshot_daily_bubble_id ON b_snapshot_daily(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_snapshot_daily_created ON b_snapshot_daily(created_date);
CREATE INDEX IF NOT EXISTS idx_b_snapshot_market_bubble_id ON b_snapshot_market(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_snapshot_market_created ON b_snapshot_market(created_date);
CREATE INDEX IF NOT EXISTS idx_b_snapshot_mm_bubble_id ON b_snapshot_mm(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_snapshot_mm_created ON b_snapshot_mm(created_date);
CREATE INDEX IF NOT EXISTS idx_b_snapshot_overall_bubble_id ON b_snapshot_overall(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_snapshot_overall_created ON b_snapshot_overall(created_date);
CREATE INDEX IF NOT EXISTS idx_b_snapshot_pmc_bubble_id ON b_snapshot_pmc(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_snapshot_pmc_created ON b_snapshot_pmc(created_date);
CREATE INDEX IF NOT EXISTS idx_b_snapshot_smborg_bubble_id ON b_snapshot_smborg(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_snapshot_smborg_created ON b_snapshot_smborg(created_date);
CREATE INDEX IF NOT EXISTS idx_b_task_bubble_id ON b_task(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_tripcharge_bubble_id ON b_tripcharge(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_tripcharge_created ON b_tripcharge(created_date);
CREATE INDEX IF NOT EXISTS idx_b_tripchargev2_bubble_id ON b_tripchargev2(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_twiliocall_bubble_id ON b_twiliocall(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_twilioconversation_bubble_id ON b_twilioconversation(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_twiliomessage_bubble_id ON b_twiliomessage(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_usagemetrics_bubble_id ON b_usagemetrics(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_usagemetrics_created ON b_usagemetrics(created_date);
CREATE INDEX IF NOT EXISTS idx_b_user_bubble_id ON b_user(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_user_created ON b_user(created_date);
CREATE INDEX IF NOT EXISTS idx_b_utmevent_bubble_id ON b_utmevent(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_utmviews_bubble_id ON b_utmviews(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_utmviews_created ON b_utmviews(created_date);
CREATE INDEX IF NOT EXISTS idx_b_visit_bubble_id ON b_visit(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_visit_created ON b_visit(created_date);
CREATE INDEX IF NOT EXISTS idx_b_weekly_stats_breasy_bubble_id ON b_weekly_stats_breasy(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_weekly_stats_breasy_created ON b_weekly_stats_breasy(created_date);
CREATE INDEX IF NOT EXISTS idx_b_weekly_stats_main_bubble_id ON b_weekly_stats_main(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_weekly_stats_main_created ON b_weekly_stats_main(created_date);
CREATE INDEX IF NOT EXISTS idx_b_weekly_stats_market_bubble_id ON b_weekly_stats_market(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_weekly_stats_market_created ON b_weekly_stats_market(created_date);
CREATE INDEX IF NOT EXISTS idx_b_weekly_stats_mm_bubble_id ON b_weekly_stats_mm(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_weekly_stats_mm_created ON b_weekly_stats_mm(created_date);
CREATE INDEX IF NOT EXISTS idx_b_weekly_stats_pmc_bubble_id ON b_weekly_stats_pmc(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_weekly_stats_pmc_created ON b_weekly_stats_pmc(created_date);
CREATE INDEX IF NOT EXISTS idx_b_weekly_stats_smborg_bubble_id ON b_weekly_stats_smborg(bubble_id);
CREATE INDEX IF NOT EXISTS idx_b_weekly_stats_smborg_created ON b_weekly_stats_smborg(created_date);

-- ======================================================================
-- ROW LEVEL SECURITY
-- ======================================================================
ALTER TABLE b_1099 ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_appsetting ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_appusage ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_backendworkflowlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_blogpost ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_calendarevent ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_call ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_chat_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_chatapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_chatmessages ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_custcontactintent ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_customercontact ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_customerscorecard ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_duplicatedinvoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_duplicateinvoicerf ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_duplicatejob ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_duplicatejobservice ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_duplicatenextstep ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_duplicatequote ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_dynamicsmbtablecache ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_feedback_fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_foactivitystats ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_formsviewmorejobscount ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_fulfillmentanalytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_holdsmbcsv ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_jobrequest ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_jobrequestqualitymetrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_jobservice ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_landingpagereview ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_landingpageteam ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_managertask ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_mapboxdynamicsmbtablecache ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_marketingfaq ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_marketingtestimonial ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_markettwinslut ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_monthgoalsbreasy ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_monthgoalsmarket ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_monthgoalsmm ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_nextstep ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_nextstepsmb ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_note ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_notification_joy ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_pricerecommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_publishedsmbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_pushnotification ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_qarecord ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_quotelineitem ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_response ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_revenuegoals ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_scopetestdata ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_sectionengagementtrack ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_serviceticket ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_slackalytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_smbav ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_smbonboardintent ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_smbquestionnaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_smbquote ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_smbrequest ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_smbsmsblast ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_smstable ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_snapshot_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_snapshot_market ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_snapshot_mm ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_snapshot_overall ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_snapshot_pmc ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_snapshot_smborg ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_tripcharge ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_tripchargev2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_twiliocall ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_twilioconversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_twiliomessage ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_usagemetrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_utmevent ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_utmviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_visit ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_weekly_stats_breasy ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_weekly_stats_main ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_weekly_stats_market ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_weekly_stats_mm ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_weekly_stats_pmc ENABLE ROW LEVEL SECURITY;
ALTER TABLE b_weekly_stats_smborg ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'b_1099',
      'b_activity',
      'b_appsetting',
      'b_appusage',
      'b_backendworkflowlog',
      'b_blogpost',
      'b_calendarevent',
      'b_call',
      'b_chat',
      'b_chat_message',
      'b_chatapp',
      'b_chatmessages',
      'b_clicks',
      'b_completion',
      'b_conversation',
      'b_custcontactintent',
      'b_customercontact',
      'b_customerscorecard',
      'b_duplicatedinvoices',
      'b_duplicateinvoicerf',
      'b_duplicatejob',
      'b_duplicatejobservice',
      'b_duplicatenextstep',
      'b_duplicatequote',
      'b_dynamicsmbtablecache',
      'b_email',
      'b_feedback',
      'b_feedback_fa',
      'b_foactivitystats',
      'b_formsviewmorejobscount',
      'b_fulfillmentanalytics',
      'b_holdsmbcsv',
      'b_invoice',
      'b_job',
      'b_jobrequest',
      'b_jobrequestqualitymetrics',
      'b_jobservice',
      'b_landingpagereview',
      'b_landingpageteam',
      'b_leads',
      'b_managertask',
      'b_mapboxdynamicsmbtablecache',
      'b_marketingfaq',
      'b_marketingtestimonial',
      'b_markettwinslut',
      'b_message',
      'b_monthgoalsbreasy',
      'b_monthgoalsmarket',
      'b_monthgoalsmm',
      'b_nextstep',
      'b_nextstepsmb',
      'b_note',
      'b_notification_joy',
      'b_notifications',
      'b_organization',
      'b_payment',
      'b_pricerecommendations',
      'b_publishedsmbs',
      'b_pushnotification',
      'b_qarecord',
      'b_quotelineitem',
      'b_response',
      'b_revenuegoals',
      'b_scopetestdata',
      'b_sectionengagementtrack',
      'b_serviceticket',
      'b_slackalytics',
      'b_smbav',
      'b_smbonboardintent',
      'b_smbquestionnaire',
      'b_smbquote',
      'b_smbrequest',
      'b_smbsmsblast',
      'b_smstable',
      'b_snapshot_daily',
      'b_snapshot_market',
      'b_snapshot_mm',
      'b_snapshot_overall',
      'b_snapshot_pmc',
      'b_snapshot_smborg',
      'b_task',
      'b_tripcharge',
      'b_tripchargev2',
      'b_twiliocall',
      'b_twilioconversation',
      'b_twiliomessage',
      'b_usagemetrics',
      'b_user',
      'b_utmevent',
      'b_utmviews',
      'b_visit',
      'b_weekly_stats_breasy',
      'b_weekly_stats_main',
      'b_weekly_stats_market',
      'b_weekly_stats_mm',
      'b_weekly_stats_pmc',
      'b_weekly_stats_smborg'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "service_role_all_%s" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "authenticated_read_%s" ON %I FOR SELECT TO authenticated USING (true)',
      tbl, tbl
    );
  END LOOP;
END $$;
