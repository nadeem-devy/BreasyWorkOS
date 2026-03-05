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
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (id, event_date)
) PARTITION BY RANGE (event_date);

-- Auto-set event_date from created_at on insert
CREATE OR REPLACE FUNCTION set_activity_event_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.event_date := (NEW.created_at AT TIME ZONE 'UTC')::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_event_date
  BEFORE INSERT ON activity_events
  FOR EACH ROW EXECUTE FUNCTION set_activity_event_date();

-- Initial partitions
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
