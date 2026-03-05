-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bubble_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bubble_financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialpad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE melio_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Managers and admins can view all profiles"
  ON profiles FOR SELECT USING (
    get_user_role() IN ('manager', 'super_admin')
  );

CREATE POLICY "Super admins can manage all profiles"
  ON profiles FOR ALL USING (get_user_role() = 'super_admin');

-- ACTIVITY EVENTS
CREATE POLICY "Users can view own activity"
  ON activity_events FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can view all activity"
  ON activity_events FOR SELECT USING (
    get_user_role() IN ('manager', 'super_admin')
  );

CREATE POLICY "Users can insert own activity"
  ON activity_events FOR INSERT WITH CHECK (user_id = auth.uid());

-- BUBBLE EVENTS
CREATE POLICY "Users see own bubble events"
  ON bubble_events FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers see all bubble events"
  ON bubble_events FOR SELECT USING (
    get_user_role() IN ('manager', 'super_admin', 'admin_ar', 'admin_ap')
  );

CREATE POLICY "Service can insert bubble events"
  ON bubble_events FOR INSERT WITH CHECK (true);

-- BUBBLE FINANCIAL EVENTS
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

-- GMAIL EVENTS
CREATE POLICY "Users see own gmail events"
  ON gmail_events FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers see all gmail events"
  ON gmail_events FOR SELECT USING (
    get_user_role() IN ('manager', 'super_admin')
  );

CREATE POLICY "Service can insert gmail events"
  ON gmail_events FOR INSERT WITH CHECK (true);

-- DIALPAD EVENTS
CREATE POLICY "Users see own dialpad events"
  ON dialpad_events FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers see all dialpad events"
  ON dialpad_events FOR SELECT USING (
    get_user_role() IN ('manager', 'super_admin')
  );

CREATE POLICY "Service can insert dialpad events"
  ON dialpad_events FOR INSERT WITH CHECK (true);

-- MELIO EVENTS
CREATE POLICY "AP roles see all melio events"
  ON melio_events FOR SELECT USING (
    get_user_role() IN ('admin_ap', 'manager', 'super_admin')
  );

CREATE POLICY "Service can insert melio events"
  ON melio_events FOR INSERT WITH CHECK (true);

-- SESSIONS
CREATE POLICY "Users see own sessions"
  ON sessions FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers see all sessions"
  ON sessions FOR SELECT USING (
    get_user_role() IN ('manager', 'super_admin')
  );

CREATE POLICY "Users can manage own sessions"
  ON sessions FOR ALL USING (user_id = auth.uid());
