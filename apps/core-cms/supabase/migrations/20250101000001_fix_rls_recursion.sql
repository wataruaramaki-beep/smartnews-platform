-- ============================================
-- RLS無限再帰問題を修正
-- ============================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can view their children profiles" ON profiles;
DROP POLICY IF EXISTS "Admins and creators can create child accounts" ON profiles;
DROP POLICY IF EXISTS "Admins can view all posts" ON posts;
DROP POLICY IF EXISTS "Creators and admins can create posts" ON posts;
DROP POLICY IF EXISTS "Admins can update all posts" ON posts;

-- ============================================
-- ヘルパー関数：現在のユーザーのロールを取得（RLSをバイパス）
-- ============================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ============================================
-- Profiles テーブルの修正されたRLSポリシー
-- ============================================

-- 管理者は全てのプロフィールを閲覧可能（修正版）
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (public.get_my_role() = 'admin');

-- 親アカウントは自分の子アカウントを閲覧可能（修正版）
CREATE POLICY "Parents can view their children profiles"
    ON profiles FOR SELECT
    USING (
        parent_id = auth.uid() OR
        public.get_my_role() IN ('admin', 'creator')
    );

-- 管理者とクリエイターは子アカウントを作成可能（修正版）
CREATE POLICY "Admins and creators can create child accounts"
    ON profiles FOR INSERT
    WITH CHECK (public.get_my_role() IN ('admin', 'creator'));

-- ============================================
-- Posts テーブルの修正されたRLSポリシー
-- ============================================

-- 管理者は全ての投稿を閲覧可能（修正版）
CREATE POLICY "Admins can view all posts"
    ON posts FOR SELECT
    USING (public.get_my_role() = 'admin');

-- クリエイターと管理者は投稿を作成可能（修正版）
CREATE POLICY "Creators and admins can create posts"
    ON posts FOR INSERT
    WITH CHECK (
        auth.uid() = author_id AND
        public.get_my_role() IN ('admin', 'creator')
    );

-- 管理者は全ての投稿を更新・削除可能（修正版）
CREATE POLICY "Admins can update all posts"
    ON posts FOR UPDATE
    USING (public.get_my_role() = 'admin');
