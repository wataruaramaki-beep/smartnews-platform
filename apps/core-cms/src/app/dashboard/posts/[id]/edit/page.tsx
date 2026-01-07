'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { createBrowserClient as createClient } from '@smartnews/database';
import type { PostStatus } from '@/types/database';
import ImageUpload from '@/components/ImageUpload';
import { EditorWithPreview } from '@/components/editor/EditorWithPreview';

export default function EditPostPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState<any>(null);
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<PostStatus>('draft');
  const [publishedAt, setPublishedAt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailPath, setThumbnailPath] = useState<string | null>(null);
  const [distributionChannels, setDistributionChannels] = useState({
    smartNews: false,
    smartNewsCreators: false,
    smartNewsBiz: false,
    newsletter: false,
  });
  const [authorUsername, setAuthorUsername] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingPost, setFetchingPost] = useState(true);

  const handleImageChange = (url: string | null, path: string | null) => {
    setThumbnailUrl(url);
    setThumbnailPath(path);
  };

  const handleDistributionChange = (channel: keyof typeof distributionChannels) => {
    setDistributionChannels((prev) => {
      const updated = { ...prev, [channel]: !prev[channel] };

      // SmartNews Bizを選択した場合、SmartNews for Creatorsとニュースレターを無効化
      if (channel === 'smartNewsBiz' && updated.smartNewsBiz) {
        updated.smartNewsCreators = false;
        updated.newsletter = false;
      }

      // SmartNews for Creatorsを選択した場合、SmartNews Bizを無効化
      if (channel === 'smartNewsCreators' && updated.smartNewsCreators) {
        updated.smartNewsBiz = false;
      }

      // SmartNews for Creatorsを解除した場合、ニュースレターも自動的に解除
      if (channel === 'smartNewsCreators' && !updated.smartNewsCreators) {
        updated.newsletter = false;
      }

      return updated;
    });
  };

  useEffect(() => {
    if (user && profile && postId) {
      fetchPost();
    }
  }, [user, profile, postId]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, author:profiles!posts_author_id_fkey(username)')
        .eq('id', postId)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('投稿が見つかりません');
      }

      // Check if user has permission to edit this post
      if (profile?.role !== 'admin' && data.author_id !== user!.id) {
        throw new Error('この投稿を編集する権限がありません');
      }

      // Load data into form
      setTitle(data.title);
      setSlug(data.slug);
      setAuthorUsername((data as any).author?.username || '');
      // Support both old text format and new Tiptap JSON format
      setContent(data.content?.text ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: data.content.text }] }] } : data.content || null);
      setGenre(data.genre || '');
      setTags(data.tags?.join(', ') || '');
      setStatus(data.status);
      setSeoTitle(data.seo_title || '');
      setSeoDescription(data.seo_description || '');
      setThumbnailUrl(data.thumbnail_url || null);

      // Load distribution channels or use defaults for old posts
      if (data.distribution_channels) {
        setDistributionChannels(data.distribution_channels);
      } else {
        // Default for old posts without distribution_channels
        setDistributionChannels({
          smartNews: true,
          smartNewsCreators: true,
          smartNewsBiz: false,
          newsletter: true,
        });
      }

      if (data.published_at) {
        // Convert ISO string to datetime-local format
        const date = new Date(data.published_at);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        setPublishedAt(localDate.toISOString().slice(0, 16));
      }
    } catch (error: any) {
      setError(error.message || '投稿の取得に失敗しました');
    } finally {
      setFetchingPost(false);
    }
  };

  if (!profile || (profile.role !== 'admin' && profile.role !== 'creator')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            アクセス権限がありません
          </h2>
          <p className="text-gray-600 mb-4">
            投稿を編集するには、管理者またはクリエイターである必要があります。
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  if (fetchingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error && fetchingPost === false && !title) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">エラー</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard/posts"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            投稿一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const validateSlug = (slug: string): boolean => {
    const slugRegex = /^[a-z0-9-_]+$/;
    return slugRegex.test(slug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) throw new Error('ユーザーが認証されていません');

      // Slug生成または検証
      let finalSlug = slug.trim();

      if (!finalSlug) {
        // 空欄の場合は自動生成（タイムスタンプ + ランダム文字列）
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        finalSlug = `post-${timestamp}-${randomStr}`;
      } else {
        // Slug検証（入力がある場合のみ）
        if (!validateSlug(finalSlug)) {
          throw new Error('Slugは英小文字、数字、ハイフン、アンダースコアのみ使用できます');
        }
      }

      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const postData: any = {
        title,
        slug: finalSlug,
        content: content || {},
        thumbnail_url: thumbnailUrl,
        genre: genre || null,
        tags: tagsArray,
        status,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        distribution_channels: distributionChannels,
      };

      if (status === 'published' || status === 'scheduled') {
        if (!publishedAt) {
          throw new Error('公開日時を設定してください');
        }
        postData.published_at = new Date(publishedAt).toISOString();
      } else {
        // If status is draft, clear published_at
        postData.published_at = null;
      }

      const { error } = await supabase
        .from('posts')
        .update(postData)
        .eq('id', postId);

      if (error) throw error;

      router.push('/dashboard/posts');
      router.refresh();
    } catch (error: any) {
      setError(error.message || '投稿の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-center items-center h-32">
            <Link
              href="/"
              className="block hover:opacity-80 transition-opacity"
            >
              <img
                src="/sncore_logo.png"
                alt="Media Tech Compass"
                style={{ height: '100px', width: 'auto' }}
              />
            </Link>

            <div className="absolute right-0 flex items-center">
              <Link
                href={authorUsername ? `/${authorUsername}/posts/${slug}` : '/dashboard/posts'}
                className="inline-flex items-center justify-center px-3 py-1 text-xs sm:px-6 sm:py-2 sm:text-sm font-medium rounded-md text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
              >
                キャンセル
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Information Note */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800 mb-4 space-y-1">
              <p>＊このCMSから、「SmartNews for Creators」「SmartNews Biz」いずれかへ無料でコンテンツ配信することができます。</p>
              <p>＊「SmartNews for Creators」「SmartNews Biz」に配信すると、自動的に「SmartNewsに」にも配信されます。</p>
              <p>＊「SmartNews Biz」に投稿されるコンテンツにはPR表記が付きます。</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">配信先:</p>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={distributionChannels.smartNewsCreators}
                    onChange={() => handleDistributionChange('smartNewsCreators')}
                    disabled={distributionChannels.smartNewsBiz}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className={`ml-2 text-sm ${distributionChannels.smartNewsBiz ? 'text-gray-400' : 'text-blue-800'}`}>
                    SmartNews for Creators
                  </span>
                </label>
                <label className="flex items-center ml-8">
                  <input
                    type="checkbox"
                    checked={distributionChannels.newsletter}
                    onChange={() => handleDistributionChange('newsletter')}
                    disabled={!distributionChannels.smartNewsCreators}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className={`ml-2 text-sm ${!distributionChannels.smartNewsCreators ? 'text-gray-400' : 'text-blue-800'}`}>
                    ニュースレター
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={distributionChannels.smartNewsBiz}
                    onChange={() => handleDistributionChange('smartNewsBiz')}
                    disabled={distributionChannels.smartNewsCreators}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className={`ml-2 text-sm ${distributionChannels.smartNewsCreators ? 'text-gray-400' : 'text-blue-800'}`}>
                    SmartNews Biz
                  </span>
                </label>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div className="bg-white shadow rounded-lg p-6 space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  タイトル *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="投稿のタイトルを入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  本文 *
                </label>
                <EditorWithPreview
                  content={content}
                  onChange={setContent}
                  placeholder="投稿の本文を入力..."
                  title={title}
                  thumbnailUrl={thumbnailUrl}
                  authorName={profile?.display_name || profile?.username}
                  publishedAt={publishedAt}
                />
              </div>

              <div>
                <ImageUpload
                  currentImageUrl={thumbnailUrl}
                  onImageChange={handleImageChange}
                  label="サムネイル画像"
                />
                <p className="mt-2 text-sm text-gray-500">
                  この画像はOGP画像としても使用されます
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="genre"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    ジャンル
                  </label>
                  <input
                    type="text"
                    id="genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="テクノロジー、ビジネスなど"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    タグ
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="タグ1, タグ2, タグ3"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    カンマ区切りで入力
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    ステータス *
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PostStatus)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="draft">下書き</option>
                    <option value="published">公開</option>
                    <option value="scheduled">予約投稿</option>
                  </select>
                </div>

                {(status === 'published' || status === 'scheduled') && (
                  <div>
                    <label
                      htmlFor="publishedAt"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      公開日時 *
                    </label>
                    <input
                      type="datetime-local"
                      id="publishedAt"
                      required
                      value={publishedAt}
                      onChange={(e) => setPublishedAt(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                SEO設定（オプション）
              </h3>

              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  URL Slug (SEO用)
                </label>
                <input
                  type="text"
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="nextjs-15-release-notes（空欄の場合は自動生成）"
                />
                <p className="mt-1 text-xs text-gray-500">
                  英小文字、数字、ハイフン、アンダースコアのみ使用できます。空欄の場合は自動的に連番URLを生成します。
                </p>
              </div>

              <div>
                <label
                  htmlFor="seoTitle"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  SEOタイトル
                </label>
                <input
                  type="text"
                  id="seoTitle"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="検索エンジンに表示されるタイトル"
                />
              </div>

              <div>
                <label
                  htmlFor="seoDescription"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  SEO説明文
                </label>
                <textarea
                  id="seoDescription"
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="検索エンジンに表示される説明文"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href={authorUsername ? `/${authorUsername}/posts/${slug}` : '/dashboard/posts'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '更新中...' : '投稿を更新'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
