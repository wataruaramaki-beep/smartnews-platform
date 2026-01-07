# Claude Code 使用ガイド - SmartNews Platform

> **⚠️ 重要：このドキュメントは Claude Code セッション開始時に必ず最初に読み込んでください**

## 🏗️ プロジェクト構造概要

このプロジェクトは **Turborepo + pnpm workspace によるモノレポ** です。

```
smartnews-platform/                    # ← GitHubリポジトリのルート
├── apps/
│   ├── core-cms/                      # CMS管理画面（Next.js 15）
│   ├── creators/                      # SmartNews for Creators 公開サイト
│   └── biz/                           # SmartNews Biz 公開サイト
├── packages/
│   ├── database/                      # Supabase型定義
│   ├── ui/                            # 共通UIコンポーネント
│   └── config/                        # 共通設定
├── supabase/                          # Supabaseマイグレーション
├── package.json                       # ルートpackage.json
├── pnpm-workspace.yaml                # pnpm workspace設定
├── turbo.json                         # Turborepo設定
└── CLAUDE_CODE_GUIDE.md              # ← このファイル
```

### 各アプリケーションの役割

- **core-cms**: 投稿作成・管理を行うCMS（管理者・クリエイター用）
- **creators**: 一般読者向けの SmartNews for Creators 公開サイト
- **biz**: 企業向けの SmartNews Biz 公開サイト

## 🔗 Git 連携情報

### リポジトリ情報
- **リポジトリ**: `https://github.com/wataruaramaki-beep/smartnews-platform.git`
- **メインブランチ**: `main`
- **Gitアカウント**:
  - ユーザー名: `wataruaramaki-beep`
  - メール: `wataru.aramaki@smartnews.com`

### ⚠️ 重大な警告：Force Push は絶対に避ける

**このプロジェクトはモノレポです。force push は全体のプロジェクト構造を破壊する危険性があります。**

#### 過去に発生した問題（2026年1月7日）
- ローカルの単一プロジェクト構造を force push してしまい、モノレポ構造全体を上書き
- `apps/core-cms`, `apps/creators`, `apps/biz` が全て消失
- Vercel デプロイが失敗（Root Directory `apps/core-cms` が見つからないエラー）
- 復旧に時間を要した

#### Git操作の原則
1. **force push は絶対に行わない**（`--force`, `-f` フラグを使用しない）
2. push 前に必ず `git status` でブランチ状態を確認
3. リモートとローカルで履歴が異なる場合は、ユーザーに確認してから操作
4. 不明な場合は操作を停止し、ユーザーに状況を説明

## 🚀 Vercel デプロイ設定

### core-cms のデプロイ
- **Vercelプロジェクト名**: `smartnews-platform-core-cms`
- **接続リポジトリ**: `wataruaramaki-beep/smartnews-platform`
- **Root Directory**: `apps/core-cms` ⚠️ **この設定は変更しないこと**
- **Framework**: Next.js
- **Build Command**: 自動検出（Vercelが自動的にTurborepoを認識）
- **Output Directory**: 自動検出

### デプロイフロー
1. `main` ブランチへ push すると自動的にデプロイ開始
2. Vercel は `apps/core-cms` をルートとして認識
3. ビルド・デプロイ完了後、本番環境に反映

### よくあるデプロイエラー
- **"Root Directory does not exist"**: モノレポ構造が壊れている可能性
  - → `apps/core-cms` ディレクトリが存在するか確認
  - → git履歴を確認し、force pushで上書きしていないか確認

## 📂 ローカル開発環境

### 現在の作業ディレクトリ
```bash
/Users/wataru.aramaki/SmartNews/arawata-cms
```
※ディレクトリ名は `arawata-cms` だが、中身は `smartnews-platform` モノレポ

### 開発サーバーの起動

**全アプリを起動:**
```bash
pnpm dev
```

**core-cmsのみ起動:**
```bash
cd apps/core-cms
npm run dev
# または
pnpm --filter @smartnews/core-cms dev
```

**デフォルトポート:**
- core-cms: `http://localhost:3000`
- ポート3000が使用中の場合: `http://localhost:3001`

### 環境変数
- **場所**: `/Users/wataru.aramaki/SmartNews/arawata-cms/.env.local`
- **Supabase設定**: プロジェクトルートの `.env.local` に記載
- **重要**: `.env.local` はgitにコミットしない（`.gitignore` に含まれている）

## 🔄 開発フロー

### 1. セッション開始時の確認
```bash
# 1. 現在のブランチとリモート状態を確認
git status
git remote -v

# 2. モノレポ構造が正しいか確認
ls apps/
# 期待される出力: biz  core-cms  creators

# 3. プロジェクト構造を確認
cat package.json | grep "smartnews-platform"
```

### 2. コード変更時
1. **変更対象を明確化**: どのアプリ（core-cms/creators/biz）を変更するか確認
2. **正しいパスで編集**: `apps/core-cms/src/...` など、必ず `apps/` 配下を編集
3. **開発サーバーで動作確認**: 変更後、ブラウザで確認

### 3. Commit & Push 前のチェックリスト
- [ ] `git status` で変更ファイルを確認
- [ ] 変更が `apps/core-cms/` 配下にあることを確認
- [ ] モノレポ構造（apps/, packages/ など）が保持されていることを確認
- [ ] **force push は絶対に使用しない**
- [ ] コミットメッセージに変更内容を明記

### 4. Commit & Push
```bash
# ファイルをステージング（ブラケットを含むパスはクォートで囲む）
git add "apps/core-cms/src/app/dashboard/posts/[id]/edit/page.tsx"

# コミット
git commit -m "適切なコミットメッセージ"

# Push（force は使用しない）
git push origin main
```

## 🎯 core-cms の主要ファイル

### 投稿フォーム（最近の変更対象）
- **新規投稿**: `apps/core-cms/src/app/dashboard/posts/new/page.tsx`
- **編集画面**: `apps/core-cms/src/app/dashboard/posts/[id]/edit/page.tsx`

### 配信先選択UIの仕様（2026年1月7日 更新）
- SmartNews for Creators（親）
  - ニュースレター（子、Creatorsが選択されている時のみ有効）
- SmartNews Biz（Creatorsと排他的）

## 🚨 トラブルシューティング

### Vercel デプロイが失敗する
**症状**: "Root Directory 'apps/core-cms' does not exist"

**原因**: モノレポ構造が壊れている（force push で上書きされた可能性）

**確認方法**:
```bash
ls apps/
# core-cms が存在するか確認

git log --oneline -5
# 最近のコミットに force-update がないか確認
```

**対処法**:
1. ユーザーに状況を報告
2. force push を行った場合は、`git reflog` で元の状態を確認
3. 必要に応じて `git reset --hard [commit-hash]` で復旧

### Git のリモートURLが間違っている
**確認**:
```bash
git remote -v
# 期待: https://github.com/wataruaramaki-beep/smartnews-platform.git
```

**修正**:
```bash
git remote set-url origin https://github.com/wataruaramaki-beep/smartnews-platform.git
```

### ポート3000が使用中
**確認**:
```bash
lsof -i :3000
```

**対処**:
- 既存プロセスを停止してから再起動
- または自動的に3001ポートで起動される

## 📋 セッション開始時のチェックリスト

Claude Code セッション開始時に以下を実行：

1. [ ] このドキュメント（CLAUDE_CODE_GUIDE.md）を読む
2. [ ] `git remote -v` でリポジトリを確認
3. [ ] `ls apps/` でモノレポ構造を確認
4. [ ] `git status` で現在の状態を確認
5. [ ] 変更予定のファイルパスを確認（必ず `apps/` 配下）

## 📝 最終更新

- **日付**: 2026年1月7日
- **更新内容**: 初版作成（force push による事故を受けて）
- **更新者**: Claude Sonnet 4.5

---

**⚠️ このドキュメントは定期的に更新してください。特にプロジェクト構造やデプロイ設定に変更があった場合は必ず反映すること。**
