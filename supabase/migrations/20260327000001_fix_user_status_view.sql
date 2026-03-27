-- Fix v_user_current_status: use session updated_at for more reliable online detection
-- and increase thresholds to match 15-minute idle setting in extension
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
  GREATEST(ae.created_at, s.updated_at) AS last_activity_at,
  CASE
    WHEN s.ended_at IS NOT NULL THEN 'offline'
    WHEN s.updated_at > NOW() - INTERVAL '6 minutes' THEN 'active'
    WHEN s.updated_at > NOW() - INTERVAL '20 minutes' THEN 'idle'
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
