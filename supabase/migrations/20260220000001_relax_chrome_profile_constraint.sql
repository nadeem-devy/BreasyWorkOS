-- Remove the restrictive CHECK constraint on chrome_profile
-- Now stores the Chrome profile's Google account email (auto-detected by extension)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_chrome_profile_check;
