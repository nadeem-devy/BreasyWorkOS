-- Live view: current user status
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

-- AR aging view
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

-- Daily time allocation function
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

-- WO last activity function
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

-- Auto-create next month partition
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
