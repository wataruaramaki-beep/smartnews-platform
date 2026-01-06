-- ============================================
-- 次世代型Headless CMS - 初期スキーマ
-- ============================================

-- Role Enum（ロール定義）
CREATE TYPE user_role AS ENUM ('admin', 'creator', 'reader');

-- Post Status Enum（投稿ステータス定義）
CREATE TYPE post_status AS ENUM ('draft', 'published', 'scheduled');

-- ============================================
-- Profiles テーブル（統合アカウント管理）
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    role user_role NOT NULL DEFAULT 'reader',
    parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Stripe連携（将来の収益化対応）
    stripe_customer_id TEXT UNIQUE,

    -- ニュースレター購読管理
    is_subscribed BOOLEAN NOT NULL DEFAULT false,

    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- インデックス用制約
    CONSTRAINT parent_not_self CHECK (id != parent_id)
);

-- Profilesテーブルのインデックス
CREATE INDEX idx_profiles_parent_id ON profiles(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_role ON profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_email ON profiles(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at);

-- ============================================
-- Posts テーブル（コンテンツ管理）
-- ============================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- 基本情報
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}', -- Tiptap用のリッチテキスト（JSON形式）
    thumbnail_url TEXT,

    -- 分類
    genre TEXT, -- カテゴリ
    tags TEXT[] DEFAULT '{}', -- タグ配列

    -- ステータス管理
    status post_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,

    -- SEO/OGP対応
    seo_title TEXT,
    seo_description TEXT,
    seo_image_url TEXT,

    -- ニュースレター配信管理
    newsletter_sent_at TIMESTAMP WITH TIME ZONE,

    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- 制約: 公開済み・予約投稿の場合は公開日時が必須
    CONSTRAINT published_at_required CHECK (
        (status = 'draft') OR
        (status IN ('published', 'scheduled') AND published_at IS NOT NULL)
    )
);

-- Postsテーブルのインデックス
CREATE INDEX idx_posts_author_id ON posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_status ON posts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_published_at ON posts(published_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_genre ON posts(genre) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_tags ON posts USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_deleted_at ON posts(deleted_at);
CREATE INDEX idx_posts_newsletter_sent_at ON posts(newsletter_sent_at) WHERE deleted_at IS NULL;

-- ============================================
-- Updated_at自動更新用トリガー関数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profilesテーブルにトリガーを設定
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Postsテーブルにトリガーを設定
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 新規ユーザー登録時にprofilesレコードを自動作成
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'reader');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.usersテーブルにトリガーを設定
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Row Level Security (RLS) ポリシー
-- ============================================

-- Profilesテーブル
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 誰でも自分のプロフィールは読める
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- 管理者は全てのプロフィールを閲覧可能
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin' AND deleted_at IS NULL
        )
    );

-- 親アカウントは自分の子アカウントを閲覧可能
CREATE POLICY "Parents can view their children profiles"
    ON profiles FOR SELECT
    USING (
        parent_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'creator') AND deleted_at IS NULL
        )
    );

-- ユーザーは自分のプロフィールを更新可能
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 管理者とクリエイターは子アカウントを作成可能
CREATE POLICY "Admins and creators can create child accounts"
    ON profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'creator') AND deleted_at IS NULL
        )
    );

-- Postsテーブル
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 公開済み投稿は誰でも閲覧可能（削除されていないもの）
CREATE POLICY "Published posts are viewable by everyone"
    ON posts FOR SELECT
    USING (
        status = 'published'
        AND published_at <= NOW()
        AND deleted_at IS NULL
    );

-- 著者は自分の投稿を全て閲覧可能
CREATE POLICY "Authors can view their own posts"
    ON posts FOR SELECT
    USING (author_id = auth.uid());

-- 管理者は全ての投稿を閲覧可能
CREATE POLICY "Admins can view all posts"
    ON posts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin' AND deleted_at IS NULL
        )
    );

-- クリエイターと管理者は投稿を作成可能
CREATE POLICY "Creators and admins can create posts"
    ON posts FOR INSERT
    WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'creator') AND deleted_at IS NULL
        )
    );

-- 著者は自分の投稿を更新可能
CREATE POLICY "Authors can update their own posts"
    ON posts FOR UPDATE
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- 著者は自分の投稿を削除可能（論理削除）
CREATE POLICY "Authors can delete their own posts"
    ON posts FOR UPDATE
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- 管理者は全ての投稿を更新・削除可能
CREATE POLICY "Admins can update all posts"
    ON posts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin' AND deleted_at IS NULL
        )
    );
