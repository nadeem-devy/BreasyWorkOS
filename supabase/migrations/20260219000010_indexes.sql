-- profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_market ON profiles(market);
CREATE INDEX idx_profiles_active ON profiles(is_active);

-- activity_events
CREATE INDEX idx_activity_events_user_date ON activity_events(user_id, event_date DESC);
CREATE INDEX idx_activity_events_app ON activity_events(app);
CREATE INDEX idx_activity_events_session ON activity_events(session_id);
CREATE INDEX idx_activity_events_created ON activity_events(created_at DESC);

-- bubble_events
CREATE INDEX idx_bubble_events_user ON bubble_events(user_id);
CREATE INDEX idx_bubble_events_wo ON bubble_events(wo_id);
CREATE INDEX idx_bubble_events_type ON bubble_events(event_type);
CREATE INDEX idx_bubble_events_created ON bubble_events(created_at DESC);
CREATE INDEX idx_bubble_events_wo_trgm ON bubble_events USING gin(wo_id gin_trgm_ops);

-- bubble_financial_events
CREATE INDEX idx_bfe_user ON bubble_financial_events(user_id);
CREATE INDEX idx_bfe_wo ON bubble_financial_events(wo_id);
CREATE INDEX idx_bfe_type ON bubble_financial_events(event_type);
CREATE INDEX idx_bfe_created ON bubble_financial_events(created_at DESC);
CREATE INDEX idx_bfe_invoice ON bubble_financial_events(invoice_number);
CREATE INDEX idx_bfe_due_date ON bubble_financial_events(due_date);
CREATE INDEX idx_bfe_amount ON bubble_financial_events(amount);

-- gmail_events
CREATE INDEX idx_gmail_events_user ON gmail_events(user_id);
CREATE INDEX idx_gmail_events_thread ON gmail_events(gmail_thread_id);
CREATE INDEX idx_gmail_events_created ON gmail_events(created_at DESC);
CREATE INDEX idx_gmail_events_wo ON gmail_events(wo_id);
CREATE INDEX idx_gmail_events_direction ON gmail_events(direction);

-- dialpad_events
CREATE INDEX idx_dialpad_events_user ON dialpad_events(user_id);
CREATE INDEX idx_dialpad_events_call ON dialpad_events(dialpad_call_id);
CREATE INDEX idx_dialpad_events_created ON dialpad_events(created_at DESC);
CREATE INDEX idx_dialpad_events_missed ON dialpad_events(is_missed) WHERE is_missed = true;

-- melio_events
CREATE INDEX idx_melio_events_user ON melio_events(user_id);
CREATE INDEX idx_melio_events_payment ON melio_events(melio_payment_id);
CREATE INDEX idx_melio_events_status ON melio_events(payment_status);
CREATE INDEX idx_melio_events_created ON melio_events(created_at DESC);
CREATE INDEX idx_melio_events_vendor ON melio_events(vendor_name);

-- sessions
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);
CREATE INDEX idx_sessions_active ON sessions(user_id, ended_at) WHERE ended_at IS NULL;
