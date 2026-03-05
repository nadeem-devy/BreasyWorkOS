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
