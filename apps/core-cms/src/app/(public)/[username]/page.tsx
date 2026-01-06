import { getUserByUsername, getPostsByUsername, getAllUsernames } from '@/lib/content/posts';
import { PostCard } from '@/components/public/PostCard';
import { SubscribeForm } from '@/components/newsletter/SubscribeForm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { createBrowserClient as createClient } from '@smartnews/database';

interface UserPageProps {
  params: Promise<{
    username: string;
  }>;
}

// ISR: 1時間ごとに再生成
export const revalidate = 3600;

// SSG: ビルド時に全ユーザーページを生成
export async function generateStaticParams() {
  const usernames = await getAllUsernames();
  return usernames.map((username) => ({
    username,
  }));
}

// メタデータ生成
export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: 'ユーザーが見つかりません',
    };
  }

  const displayName = user.display_name || user.username;

  return {
    title: `${displayName}の記事一覧`,
    description: `${displayName}が投稿した記事の一覧ページです。`,
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  const posts = await getPostsByUsername(username);
  const displayName = user.display_name || user.username;

  // Get newsletter settings
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('newsletter_enabled, newsletter_title, newsletter_description')
    .eq('username', username)
    .single();

  const newsletterEnabled = profile?.newsletter_enabled || false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* User Profile Section */}
      <div className="mb-12">
        <Link href={`/${username}`} className="flex items-center gap-6 hover:opacity-80 transition-opacity">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
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

      {/* Main Content - 2 Column Layout */}
      <div className="border-t border-gray-200 pt-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Posts Section - Main Column */}
          <div className="lg:col-span-2">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">まだ記事が投稿されていません。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {posts.map((post, index) => (
                  <PostCard key={post.id} post={post} priority={index === 0} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="mt-8 lg:mt-0">
            {newsletterEnabled && (
              <div className="sticky top-8">
                <SubscribeForm
                  authorUsername={username}
                  authorName={displayName}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
