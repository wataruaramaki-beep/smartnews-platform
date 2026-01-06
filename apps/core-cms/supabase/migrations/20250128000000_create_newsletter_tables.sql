-- ============================================
-- ニュースレター機能 - テーブル作成
-- ============================================

-- ENUMの作成
CREATE TYPE subscriber_status AS ENUM ('pending', 'active', 'unsubscribed', 'bounced');
CREATE TYPE delivery_status AS ENUM ('sending', 'completed', 'failed');

-- ============================================
-- newsletter_subscribers テーブル
-- ============================================
CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status subscriber_status NOT NULL DEFAULT 'pending',
    verification_token TEXT UNIQUE,
    verified_at TIMESTAMP WITH TIME ZONE,
    subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(author_id, email)
);

-- インデックス
CREATE INDEX idx_newsletter_subscribers_author_id ON newsletter_subscribers(author_id);
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(status);

-- updated_at トリガー
CREATE TRIGGER update_newsletter_subscribers_updated_at
    BEFORE UPDATE ON newsletter_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can view their own subscribers"
    ON newsletter_subscribers FOR SELECT
    USING (author_id = auth.uid() OR public.get_my_role() = 'admin');

CREATE POLICY "Public can subscribe"
    ON newsletter_subscribers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Authors can update their subscribers"
    ON newsletter_subscribers FOR UPDATE
    USING (author_id = auth.uid() OR public.get_my_role() = 'admin');

-- ============================================
-- newsletter_deliveries テーブル
-- ============================================
CREATE TABLE newsletter_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    post_ids UUID[] NOT NULL DEFAULT '{}',
    subscriber_count INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    status delivery_status NOT NULL DEFAULT 'sending',
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_newsletter_deliveries_author_id ON newsletter_deliveries(author_id);
CREATE INDEX idx_newsletter_deliveries_sent_at ON newsletter_deliveries(sent_at);

-- RLS
ALTER TABLE newsletter_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can view their own deliveries"
    ON newsletter_deliveries FOR SELECT
    USING (author_id = auth.uid() OR public.get_my_role() = 'admin');
