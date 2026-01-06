-- Add RSS feed configuration columns to profiles table
-- Allows admins to enable per-user RSS feeds with custom titles and descriptions

ALTER TABLE profiles
  ADD COLUMN feed_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN feed_title TEXT,
  ADD COLUMN feed_description TEXT;

-- Add index for fast feed lookups by username
-- Only indexes enabled feeds that are not deleted
CREATE INDEX idx_profiles_feed_enabled
  ON profiles(username, feed_enabled)
  WHERE deleted_at IS NULL AND feed_enabled = true;

-- Add column comments for documentation
COMMENT ON COLUMN profiles.feed_enabled IS 'Whether the user RSS feed is enabled and publicly accessible';
COMMENT ON COLUMN profiles.feed_title IS 'Custom RSS feed title (falls back to display_name or username if not set)';
COMMENT ON COLUMN profiles.feed_description IS 'Custom RSS feed description';
