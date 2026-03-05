-- Allow all authenticated users to read all event tables
-- This is an internal operations tool — all employees can see each other's work activity

CREATE POLICY "All authenticated users can view activity events"
  ON activity_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated users can view dialpad events"
  ON dialpad_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated users can view bubble events"
  ON bubble_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated users can view bubble financial events"
  ON bubble_financial_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated users can view gmail events"
  ON gmail_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated users can view melio events"
  ON melio_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated users can view sessions"
  ON sessions FOR SELECT TO authenticated USING (true);
