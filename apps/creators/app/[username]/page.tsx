import { createServerClient } from '@smartnews/database/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SubscribeForm } from '@/components/newsletter/SubscribeForm';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function CreatorPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerClient();

  // Fetch creator profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Fetch creator's published posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      slug,
      published_at,
      thumbnail_url,
      seo_description
    `)
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .lte('published_at', new Date().toISOString())
    .contains('distribution_channels', { smartNewsCreators: true })
    .order('published_at', { ascending: false })
    .limit(20);

  if (postsError) {
    console.error('Failed to fetch posts:', postsError);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-sm text-indigo-600 hover:text-indigo-500 mb-2 inline-block"
          >
            ← SmartNews for Creators トップへ
          </Link>
          <div className="flex items-center mt-4">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || profile.username}
                className="h-16 w-16 rounded-full mr-4"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.display_name || profile.username}
              </h1>
              {profile.bio && (
                <p className="text-gray-600 mt-1">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Posts Section */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">記事一覧</h2>
              {!posts || posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500">まだ記事がありません</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post: any) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="md:flex">
                        {post.thumbnail_url && (
                          <div className="md:flex-shrink-0">
                            <img
                              src={post.thumbnail_url}
                              alt={post.title}
                              className="h-48 w-full md:w-48 object-cover"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="text-xl font-semibold mb-2">
                            <Link
                              href={`/${username}/posts/${post.slug}`}
                              className="hover:text-indigo-600 transition-colors"
                            >
                              {post.title}
                            </Link>
                          </h3>
                          {post.seo_description && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                              {post.seo_description}
                            </p>
                          )}
                          <time
                            className="text-sm text-gray-500"
                            dateTime={post.published_at}
                          >
                            {new Date(post.published_at).toLocaleDateString('ja-JP')}
                          </time>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Newsletter Subscription Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <SubscribeForm
                  authorUsername={profile.username}
                  authorName={profile.display_name || profile.username}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
