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
