-- ============================================================
-- Breasy WorkOS - Combined Database Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 001: Extensions and base functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 002: Users and profiles (must come before get_user_role/get_user_market)
CREATE TYPE user_role AS ENUM ('market_manager', 'admin_ar', 'admin_ap', 'manager', 'super_admin');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  market TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  chrome_profile TEXT CHECK (chrome_profile IN ('breasy_work', 'breasy_admin')),
  timezone TEXT DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'market_manager')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Now create helper functions that reference profiles
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_market()
RETURNS TEXT AS $$
  SELECT market FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 003: Activity events (partitioned)
CREATE TYPE tracked_app AS ENUM ('bubble', 'gmail', 'dialpad', 'melio', 'other');
CREATE TYPE activity_status AS ENUM ('active', 'idle', 'offline');

CREATE TABLE activity_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  app tracked_app NOT NULL,
  event_type TEXT NOT NULL,
  url_path TEXT,
  url_host TEXT,
  tab_title TEXT,
  metadata JSONB DEFAULT '{}',
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  event_date DATE GENERATED ALWAYS AS (created_at::date) STORED,
  PRIMARY KEY (id, event_date)
) PARTITION BY RANGE (event_date);

CREATE TABLE activity_events_2026_02 PARTITION OF activity_events
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE activity_events_2026_03 PARTITION OF activity_events
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE activity_events_2026_04 PARTITION OF activity_events
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE activity_events_2026_05 PARTITION OF activity_events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE activity_events_2026_06 PARTITION OF activity_events
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE activity_events_default PARTITION OF activity_events DEFAULT;

-- 004: Bubble events
CREATE TABLE bubble_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  wo_id TEXT NOT NULL,
  company TEXT,
  market TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL DEFAULT 'operational',
  old_value TEXT,
  new_value TEXT,
  field_name TEXT,
  vendor_name TEXT,
  note_text TEXT,
  metadata JSONB DEFAULT '{}',
  source TEXT DEFAULT 'webhook',
  bubble_thing_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 005: Bubble financial events
CREATE TABLE bubble_financial_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  wo_id TEXT NOT NULL,
  company TEXT,
  market TEXT,
  event_type TEXT NOT NULL,
  invoice_number TEXT,
  amount DECIMAL(12, 2),
  currency TEXT DEFAULT 'USD',
  vendor_name TEXT,
  payment_method TEXT,
  invoice_sent_at TIMESTAMPTZ,
  payment_received_at TIMESTAMPTZ,
  due_date DATE,
  aging_days INTEGER,
  bill_number TEXT,
  bill_created_at TIMESTAMPTZ,
  bill_approved_at TIMESTAMPTZ,
  bill_paid_at TIMESTAMPTZ,
  adjustment_reason TEXT,
  original_amount DECIMAL(12, 2),
  adjusted_amount DECIMAL(12, 2),
  metadata JSONB DEFAULT '{}',
  source TEXT DEFAULT 'webhook',
  bubble_thing_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 006: Gmail events
CREATE TABLE gmail_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  gmail_message_id TEXT NOT NULL,
  gmail_thread_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_address TEXT,
  to_addresses TEXT[],
  cc_addresses TEXT[],
  subject_snippet TEXT,
  has_attachments BOOLEAN DEFAULT false,
  label_ids TEXT[],
  wo_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 007: Dialpad events
CREATE TABLE dialpad_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  dialpad_call_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT,
  to_number TEXT,
  contact_name TEXT,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  call_status TEXT,
  is_missed BOOLEAN DEFAULT false,
  wo_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 008: Melio events
CREATE TABLE melio_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  melio_payment_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_id TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  initiated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  payment_status TEXT NOT NULL,
  failure_reason TEXT,
  wo_id TEXT,
  bill_number TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 009: Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  time_bubble INTEGER DEFAULT 0,
  time_gmail INTEGER DEFAULT 0,
  time_dialpad INTEGER DEFAULT 0,
  time_melio INTEGER DEFAULT 0,
  time_other INTEGER DEFAULT 0,
  time_idle INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  total_tab_switches INTEGER DEFAULT 0,
  browser TEXT,
  chrome_profile TEXT,
  extension_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 010: Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_market ON profiles(market);
CREATE INDEX idx_profiles_active ON profiles(is_active);

CREATE INDEX idx_activity_events_user_date ON activity_events(user_id, event_date DESC);
CREATE INDEX idx_activity_events_app ON activity_events(app);
CREATE INDEX idx_activity_events_session ON activity_events(session_id);
CREATE INDEX idx_activity_events_created ON activity_events(created_at DESC);

CREATE INDEX idx_bubble_events_user ON bubble_events(user_id);
CREATE INDEX idx_bubble_events_wo ON bubble_events(wo_id);
CREATE INDEX idx_bubble_events_type ON bubble_events(event_type);
CREATE INDEX idx_bubble_events_created ON bubble_events(created_at DESC);
CREATE INDEX idx_bubble_events_wo_trgm ON bubble_events USING gin(wo_id gin_trgm_ops);

CREATE INDEX idx_bfe_user ON bubble_financial_events(user_id);
CREATE INDEX idx_bfe_wo ON bubble_financial_events(wo_id);
CREATE INDEX idx_bfe_type ON bubble_financial_events(event_type);
CREATE INDEX idx_bfe_created ON bubble_financial_events(created_at DESC);
CREATE INDEX idx_bfe_invoice ON bubble_financial_events(invoice_number);
CREATE INDEX idx_bfe_due_date ON bubble_financial_events(due_date);
CREATE INDEX idx_bfe_amount ON bubble_financial_events(amount);

CREATE INDEX idx_gmail_events_user ON gmail_events(user_id);
CREATE INDEX idx_gmail_events_thread ON gmail_events(gmail_thread_id);
CREATE INDEX idx_gmail_events_created ON gmail_events(created_at DESC);
CREATE INDEX idx_gmail_events_wo ON gmail_events(wo_id);
CREATE INDEX idx_gmail_events_direction ON gmail_events(direction);

CREATE INDEX idx_dialpad_events_user ON dialpad_events(user_id);
CREATE INDEX idx_dialpad_events_call ON dialpad_events(dialpad_call_id);
CREATE INDEX idx_dialpad_events_created ON dialpad_events(created_at DESC);
CREATE INDEX idx_dialpad_events_missed ON dialpad_events(is_missed) WHERE is_missed = true;

CREATE INDEX idx_melio_events_user ON melio_events(user_id);
CREATE INDEX idx_melio_events_payment ON melio_events(melio_payment_id);
CREATE INDEX idx_melio_events_status ON melio_events(payment_status);
CREATE INDEX idx_melio_events_created ON melio_events(created_at DESC);
CREATE INDEX idx_melio_events_vendor ON melio_events(vendor_name);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);
CREATE INDEX idx_sessions_active ON sessions(user_id, ended_at) WHERE ended_at IS NULL;

-- 011: Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bubble_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bubble_financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialpad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE melio_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Managers and admins can view all profiles"
  ON profiles FOR SELECT USING (
    get_user_role() IN ('manager', 'super_admin')
  );

CREATE POLICY "Super admins can manage all profiles"
  ON profiles FOR ALL USING (get_user_role() = 'super_admin');

CREATE POLICY "Users can view own activity"
  ON activity_events FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can view all activity"
  ON activity_events FOR SELECT USING (
    get_user_role() IN ('manager', 'super_admin')
  );

CREATE POLICY "Users can insert own activity"
  ON activity_events FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users see own bubble events"
  ON bubble_events FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers see all bubble events"
  ON bubble_events FOR SELECT USING (
    get_user_role() IN ('manager', 'super_admin', 'admin_ar', 'admin_ap')
  );

CREATE POLICY "Service can insert bubble events"
  ON bubble_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Finance roles see all financial events"
  ON bubble_financial_events FOR SELECT USING (
    get_user_role() IN ('admin_ar', 'admin_ap', 'manager', 'super_admin')
  );

CREATE POLICY "MMs see own WO financials"
  ON bubble_financial_events FOR SELECT USING (
    user_id = auth.uid() AND get_user_role() = 'market_manager'
  );

CREATE POLICY "Service can insert financial events"
  ON bubble_financial_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Users see own gmail events"
  ON gmail_events FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers see all gmail events"
  ON gmail_events FOR SELECT USING (
    get_user_role() IN ('manager', 'super_admin')
  );

CREATE POLICY "Service can insert gmail events"
  ON gmail_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Users see own dialpad events"
  ON dialpad_events FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers see all dialpad events"
  ON dialpad_events FOR SELECT USING (
    get_user_role() IN ('manager', 'super_admin')
  );

CREATE POLICY "Service can insert dialpad events"
  ON dialpad_events FOR INSERT WITH CHECK (true);

CREATE POLICY "AP roles see all melio events"
  ON melio_events FOR SELECT USING (
    get_user_role() IN ('admin_ap', 'manager', 'super_admin')
  );

CREATE POLICY "Service can insert melio events"
  ON melio_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Users see own sessions"
  ON sessions FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers see all sessions"
  ON sessions FOR SELECT USING (
    get_user_role() IN ('manager', 'super_admin')
  );

CREATE POLICY "Users can manage own sessions"
  ON sessions FOR ALL USING (user_id = auth.uid());

-- 012: Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE activity_events;
ALTER PUBLICATION supabase_realtime ADD TABLE bubble_events;
ALTER PUBLICATION supabase_realtime ADD TABLE bubble_financial_events;
ALTER PUBLICATION supabase_realtime ADD TABLE gmail_events;
ALTER PUBLICATION supabase_realtime ADD TABLE dialpad_events;
ALTER PUBLICATION supabase_realtime ADD TABLE melio_events;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- 013: Views and functions
CREATE OR REPLACE VIEW v_user_current_status AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.role,
  p.market,
  s.id AS session_id,
  s.started_at AS session_started,
  ae.app AS current_app,
  ae.url_path AS current_url,
  ae.created_at AS last_activity_at,
  CASE
    WHEN ae.created_at > NOW() - INTERVAL '5 minutes' THEN 'active'
    WHEN ae.created_at > NOW() - INTERVAL '15 minutes' THEN 'idle'
    ELSE 'offline'
  END AS status,
  s.time_bubble,
  s.time_gmail,
  s.time_dialpad,
  s.time_melio
FROM profiles p
LEFT JOIN sessions s ON s.user_id = p.id AND s.ended_at IS NULL
LEFT JOIN LATERAL (
  SELECT app, url_path, created_at
  FROM activity_events
  WHERE user_id = p.id
  ORDER BY created_at DESC
  LIMIT 1
) ae ON true
WHERE p.is_active = true;

CREATE OR REPLACE VIEW v_ar_aging AS
SELECT
  wo_id,
  company,
  invoice_number,
  amount,
  due_date,
  invoice_sent_at,
  payment_received_at,
  CASE
    WHEN payment_received_at IS NOT NULL THEN 'paid'
    WHEN due_date IS NULL THEN 'no_due_date'
    WHEN CURRENT_DATE - due_date <= 0 THEN 'current'
    WHEN CURRENT_DATE - due_date BETWEEN 1 AND 30 THEN '1-30'
    WHEN CURRENT_DATE - due_date BETWEEN 31 AND 60 THEN '31-60'
    WHEN CURRENT_DATE - due_date BETWEEN 61 AND 90 THEN '61-90'
    ELSE '90+'
  END AS aging_bucket,
  GREATEST(0, CURRENT_DATE - due_date) AS days_overdue
FROM bubble_financial_events
WHERE event_type IN ('invoice_created', 'invoice_sent');

CREATE OR REPLACE FUNCTION get_time_allocation(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  bubble_seconds BIGINT,
  gmail_seconds BIGINT,
  dialpad_seconds BIGINT,
  melio_seconds BIGINT,
  other_seconds BIGINT,
  idle_seconds BIGINT,
  total_seconds BIGINT
) AS $$
  SELECT
    s.started_at::date AS date,
    SUM(s.time_bubble)::BIGINT AS bubble_seconds,
    SUM(s.time_gmail)::BIGINT AS gmail_seconds,
    SUM(s.time_dialpad)::BIGINT AS dialpad_seconds,
    SUM(s.time_melio)::BIGINT AS melio_seconds,
    SUM(s.time_other)::BIGINT AS other_seconds,
    SUM(s.time_idle)::BIGINT AS idle_seconds,
    SUM(COALESCE(s.duration_seconds, 0))::BIGINT AS total_seconds
  FROM sessions s
  WHERE s.user_id = p_user_id
    AND s.started_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY s.started_at::date
  ORDER BY date;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_wo_last_activity(p_wo_id TEXT)
RETURNS TABLE (
  wo_id TEXT,
  last_user_id UUID,
  last_user_name TEXT,
  last_activity_at TIMESTAMPTZ,
  last_event_type TEXT,
  time_since_last_activity INTERVAL
) AS $$
  SELECT
    be.wo_id,
    be.user_id AS last_user_id,
    p.full_name AS last_user_name,
    be.created_at AS last_activity_at,
    be.event_type AS last_event_type,
    NOW() - be.created_at AS time_since_last_activity
  FROM bubble_events be
  JOIN profiles p ON p.id = be.user_id
  WHERE be.wo_id = p_wo_id
  ORDER BY be.created_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION create_next_month_partition()
RETURNS void AS $$
DECLARE
  next_month_start DATE;
  next_month_end DATE;
  partition_name TEXT;
BEGIN
  next_month_start := date_trunc('month', CURRENT_DATE + INTERVAL '1 month')::date;
  next_month_end := (next_month_start + INTERVAL '1 month')::date;
  partition_name := 'activity_events_' || to_char(next_month_start, 'YYYY_MM');

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF activity_events FOR VALUES FROM (%L) TO (%L)',
    partition_name, next_month_start, next_month_end
  );
END;
$$ LANGUAGE plpgsql;
