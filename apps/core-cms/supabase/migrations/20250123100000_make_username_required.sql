-- Make username required and display_name optional

-- Step 1: Update existing profiles to have usernames if they don't have one
-- Generate username from email for profiles without username
UPDATE profiles
SET username = LOWER(REPLACE(SPLIT_PART(email, '@', 1), '.', '_'))
WHERE username IS NULL OR username = '';

-- Step 2: Make username column NOT NULL
ALTER TABLE profiles
ALTER COLUMN username SET NOT NULL;

-- Step 3: display_name is already nullable, but let's make it explicit
ALTER TABLE profiles
ALTER COLUMN display_name DROP NOT NULL;

-- Add comment to clarify the behavior
COMMENT ON COLUMN profiles.username IS 'Required: Unique identifier for user profile URLs (3-20 chars, lowercase alphanumeric + underscore)';
COMMENT ON COLUMN profiles.display_name IS 'Optional: Public display name. Falls back to username if not set';
