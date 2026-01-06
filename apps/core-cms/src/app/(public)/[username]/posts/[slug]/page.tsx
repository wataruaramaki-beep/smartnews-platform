import { notFound } from 'next/navigation';
import { PostContent } from '@/components/public/PostContent';
import { generateArticleJsonLd } from '@/lib/content/seo';
import { createBrowserClient as createClient } from '@smartnews/database';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

// ISR: 1時間ごとに再生成
export const revalidate = 3600;

interface PageProps {
  params: Promise<{
    username: string;
    slug: string;
  }>;
}

// SSG: ビルド時に全記事のslugでページを生成
export async function generateStaticParams() {
  // Use service role key for build-time data fetching
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all published posts with author username
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, author:profiles!posts_author_id_fkey(username)')
    .eq('status', 'published')
    .is('deleted_at', null);

  if (!posts) return [];

  return posts.map((post: any) => ({
    username: post.author?.username || '',
    slug: post.slug,
  }));
}

// 動的にメタデータを生成（SEO/OGP対応）
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug } = await params;
  // Use service role key for build-time data fetching
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get post with author check
  const { data: post } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(username)')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single();

  if (!post || (post as any).author?.username !== username) {
    return {
      title: '記事が見つかりません',
    };
  }

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.title,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.title,
      images: post.thumbnail_url ? [post.thumbnail_url] : [],
      type: 'article',
      publishedTime: post.published_at || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo_title || post.title,
      description: post.seo_description || post.title,
      images: post.thumbnail_url ? [post.thumbnail_url] : [],
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { username, slug } = await params;
  const supabase = await createClient();

  // Get post with author check
  const { data: post } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single();

  if (!post || (post as any).author?.username !== username) {
    notFound();
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  const jsonLd = generateArticleJsonLd(post);

  const author = (post as any).author;
  const displayName = author?.display_name || author?.username || '匿名';

  return (
    <>
      {/* JSON-LD構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* User Profile Section */}
        <div className="mb-12">
          <Link href={`/${username}`} className="flex items-center gap-6 hover:opacity-80 transition-opacity">
            {author?.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={displayName}
                width={120}
                height={120}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
            <h1 className="text-5xl font-bold text-gray-900">{displayName}</h1>
          </Link>
        </div>

        <PostContent post={post} currentUserId={user?.id} />
      </div>
    </>
  );
}
