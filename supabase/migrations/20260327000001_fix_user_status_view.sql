-- Fix v_user_current_status: use session updated_at for reliable online detection,
-- use LATERAL join to pick only the most recent session per user,
-- and increase thresholds to match 15-minute idle setting in extension.

-- Close all stale open sessions (not updated in 30+ min)
UPDATE "OS_sessions"
SET ended_at = updated_at
WHERE ended_at IS NULL
AND updated_at < NOW() - INTERVAL '30 minutes';

CREATE OR REPLACE VIEW v_user_current_status AS
SELECT
  p.id AS user_id, p.full_name, p.role, p.market,
  s.id AS session_id, s.started_at AS session_started,
  ae.app AS current_app, ae.url_path AS current_url,
  GREATEST(ae.created_at, s.updated_at) AS last_activity_at,
  CASE
    WHEN s.id IS NULL THEN 'offline'
    WHEN s.ended_at IS NOT NULL THEN 'offline'
    WHEN s.updated_at > NOW() - INTERVAL '6 minutes' THEN 'active'
    WHEN s.updated_at > NOW() - INTERVAL '20 minutes' THEN 'idle'
    ELSE 'offline'
  END AS status,
  s.time_bubble, s.time_gmail, s.time_dialpad, s.time_melio
FROM "OS_profiles" p
LEFT JOIN LATERAL (
  SELECT id, started_at, ended_at, updated_at, time_bubble, time_gmail, time_dialpad, time_melio
  FROM "OS_sessions"
  WHERE user_id = p.id
  ORDER BY started_at DESC
  LIMIT 1
) s ON true
LEFT JOIN LATERAL (
  SELECT app, url_path, created_at FROM "OS_activity_events"
  WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1
) ae ON true
WHERE p.is_active = true;
