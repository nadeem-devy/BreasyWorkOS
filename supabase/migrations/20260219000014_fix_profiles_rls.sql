-- Allow all authenticated users to view profiles (needed for dropdowns, user cards)
CREATE POLICY "All authenticated users can view profiles"
  ON profiles FOR SELECT TO authenticated USING (true);
