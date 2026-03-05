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
