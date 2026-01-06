-- Allow anonymous users to view profiles (for displaying author names on posts)
-- This makes username, display_name, and avatar_url publicly accessible

CREATE POLICY "Anyone can view profiles"
  ON profiles
  FOR SELECT
  USING (true);
