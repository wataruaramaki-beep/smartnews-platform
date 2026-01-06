-- Add username column to profiles table
ALTER TABLE profiles
ADD COLUMN username TEXT UNIQUE;

-- Add constraint for username format (alphanumeric lowercase only)
ALTER TABLE profiles
ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,20}$');

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username) WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.username IS 'Unique username: 3-20 characters, alphanumeric lowercase and underscore only';
