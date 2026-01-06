-- ============================================
-- Distribution Channels Feature
-- ============================================
-- This migration adds support for multi-channel distribution
-- allowing posts to be published to SmartNews, Creators, Biz, and Newsletter

-- Add distribution_channels column with default values
ALTER TABLE posts
ADD COLUMN distribution_channels JSONB NOT NULL
DEFAULT '{"smartNews": false, "smartNewsCreators": false, "smartNewsBiz": false, "newsletter": false}'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX idx_posts_distribution_channels
  ON posts USING GIN (distribution_channels);

-- Create functional index for SmartNews Biz channel
CREATE INDEX idx_posts_smartnews_biz
  ON posts ((distribution_channels->>'smartNewsBiz'))
  WHERE (distribution_channels->>'smartNewsBiz')::boolean = true
    AND deleted_at IS NULL;

-- Create functional index for SmartNews Creators channel
CREATE INDEX idx_posts_smartnews_creators
  ON posts ((distribution_channels->>'smartNewsCreators'))
  WHERE (distribution_channels->>'smartNewsCreators')::boolean = true
    AND deleted_at IS NULL;

-- Create functional index for Newsletter channel
CREATE INDEX idx_posts_newsletter
  ON posts ((distribution_channels->>'newsletter'))
  WHERE (distribution_channels->>'newsletter')::boolean = true
    AND deleted_at IS NULL;

-- ============================================
-- Backward Compatibility: Update existing posts
-- ============================================
-- Set existing posts to be visible in SmartNews, Creators, and Newsletter
-- (but not Biz since that's a new monetization channel)
UPDATE posts
SET distribution_channels = '{"smartNews": true, "smartNewsCreators": true, "smartNewsBiz": false, "newsletter": true}'::jsonb
WHERE distribution_channels = '{"smartNews": false, "smartNewsCreators": false, "smartNewsBiz": false, "newsletter": false}'::jsonb;

COMMENT ON COLUMN posts.distribution_channels IS 'JSONB controlling which channels this post is distributed to. Fields: smartNews, smartNewsCreators, smartNewsBiz, newsletter';
