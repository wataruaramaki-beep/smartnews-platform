-- ============================================
-- 既存のステータスカラムをENUM型に変換
-- ============================================

-- newsletter_subscribers の status を ENUM に変換
-- ステップ1: すべてのRLSポリシーを削除
DROP POLICY IF EXISTS "Authors can view their own subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public can subscribe" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Authors can update their subscribers" ON newsletter_subscribers;

-- ステップ2: インデックスを削除
DROP INDEX IF EXISTS idx_newsletter_subscribers_status;

-- ステップ3: RLSを無効化
ALTER TABLE newsletter_subscribers DISABLE ROW LEVEL SECURITY;

-- ステップ4: 新しいカラムを追加（ENUM型）
ALTER TABLE newsletter_subscribers ADD COLUMN status_new subscriber_status NOT NULL DEFAULT 'pending'::subscriber_status;

-- ステップ5: データをコピー（既存データがある場合）
UPDATE newsletter_subscribers SET status_new = status::subscriber_status WHERE status IS NOT NULL;

-- ステップ6: 古いカラムを削除
ALTER TABLE newsletter_subscribers DROP COLUMN status;

-- ステップ7: 新しいカラムをリネーム
ALTER TABLE newsletter_subscribers RENAME COLUMN status_new TO status;

-- ステップ8: インデックスを再作成
CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(status);

-- ステップ9: RLSを再有効化
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- ステップ10: ポリシーを再作成
CREATE POLICY "Authors can view their own subscribers"
    ON newsletter_subscribers FOR SELECT
    USING (author_id = auth.uid() OR public.get_my_role() = 'admin');

CREATE POLICY "Public can subscribe"
    ON newsletter_subscribers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Authors can update their subscribers"
    ON newsletter_subscribers FOR UPDATE
    USING (author_id = auth.uid() OR public.get_my_role() = 'admin');


-- newsletter_deliveries の status を ENUM に変換
-- ステップ1: すべてのRLSポリシーを削除
DROP POLICY IF EXISTS "Authors can view their own deliveries" ON newsletter_deliveries;

-- ステップ2: RLSを無効化
ALTER TABLE newsletter_deliveries DISABLE ROW LEVEL SECURITY;

-- ステップ3: 新しいカラムを追加（ENUM型）
ALTER TABLE newsletter_deliveries ADD COLUMN status_new delivery_status NOT NULL DEFAULT 'sending'::delivery_status;

-- ステップ4: データをコピー（既存データがある場合）
UPDATE newsletter_deliveries SET status_new = status::delivery_status WHERE status IS NOT NULL;

-- ステップ5: 古いカラムを削除
ALTER TABLE newsletter_deliveries DROP COLUMN status;

-- ステップ6: 新しいカラムをリネーム
ALTER TABLE newsletter_deliveries RENAME COLUMN status_new TO status;

-- ステップ7: RLSを再有効化
ALTER TABLE newsletter_deliveries ENABLE ROW LEVEL SECURITY;

-- ステップ8: ポリシーを再作成
CREATE POLICY "Authors can view their own deliveries"
    ON newsletter_deliveries FOR SELECT
    USING (author_id = auth.uid() OR public.get_my_role() = 'admin');
