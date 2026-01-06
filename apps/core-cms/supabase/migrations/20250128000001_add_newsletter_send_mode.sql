-- ============================================
-- ニュースレター機能 - profiles テーブル拡張
-- ============================================

-- 送信モードENUMの作成（immediate: 即座送信、digest: ダイジェスト送信）
-- 既に存在する場合はスキップ
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'newsletter_send_mode') THEN
        CREATE TYPE newsletter_send_mode AS ENUM ('immediate', 'digest');
    END IF;
END $$;

-- newsletter_send_mode カラムを追加
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS newsletter_send_mode newsletter_send_mode NOT NULL DEFAULT 'digest';

-- 既存のnewsletter関連カラムが存在しない場合は追加
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS newsletter_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS newsletter_frequency TEXT NOT NULL DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS newsletter_title TEXT,
  ADD COLUMN IF NOT EXISTS newsletter_description TEXT,
  ADD COLUMN IF NOT EXISTS newsletter_from_name TEXT,
  ADD COLUMN IF NOT EXISTS newsletter_from_email TEXT,
  ADD COLUMN IF NOT EXISTS newsletter_last_sent_at TIMESTAMP WITH TIME ZONE;
