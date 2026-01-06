-- Add slug column to posts table for SEO-friendly URLs
ALTER TABLE posts ADD COLUMN slug TEXT;

-- Create unique index on slug (excluding soft-deleted posts)
CREATE UNIQUE INDEX idx_posts_slug_unique
  ON posts(slug)
  WHERE deleted_at IS NULL;

-- Create performance index for slug lookups
CREATE INDEX idx_posts_slug
  ON posts(slug)
  WHERE deleted_at IS NULL;

-- Generate slugs for existing posts using their ID
-- This ensures no conflicts and provides a temporary slug
UPDATE posts
SET slug = id::text
WHERE slug IS NULL;

-- Make slug column required for future inserts
ALTER TABLE posts ALTER COLUMN slug SET NOT NULL;
