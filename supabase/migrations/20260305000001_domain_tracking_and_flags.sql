-- Domain time tracking: stores per-user, per-day, per-domain time
CREATE TABLE IF NOT EXISTS "OS_domain_time" (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  domain TEXT NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date, domain)
);

CREATE TRIGGER update_domain_time_updated_at
  BEFORE UPDATE ON "OS_domain_time"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for querying by user+date
CREATE INDEX idx_domain_time_user_date ON "OS_domain_time" (user_id, date);

-- Activity flags: stores fake activity detections
CREATE TABLE IF NOT EXISTS "OS_activity_flags" (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL,
  flag_type TEXT NOT NULL, -- 'mouse_jiggler', 'periodic_clicks', 'no_real_input'
  confidence INTEGER NOT NULL DEFAULT 0, -- 0-100
  details JSONB DEFAULT '{}',
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_flags_user ON "OS_activity_flags" (user_id, flagged_at DESC);
CREATE INDEX idx_activity_flags_unreviewed ON "OS_activity_flags" (reviewed, flagged_at DESC);

-- RLS policies
ALTER TABLE "OS_domain_time" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OS_activity_flags" ENABLE ROW LEVEL SECURITY;

-- Domain time: users can insert own, admins can read all
CREATE POLICY "Users can insert own domain time"
  ON "OS_domain_time" FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own domain time"
  ON "OS_domain_time" FOR UPDATE USING (true);

CREATE POLICY "Authenticated can read domain time"
  ON "OS_domain_time" FOR SELECT TO authenticated USING (true);

-- Activity flags: extension inserts, admins read
CREATE POLICY "Service can insert activity flags"
  ON "OS_activity_flags" FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can read activity flags"
  ON "OS_activity_flags" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update activity flags"
  ON "OS_activity_flags" FOR UPDATE TO authenticated USING (true);
