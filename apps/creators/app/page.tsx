import { createServerClient } from '@smartnews/database/server';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createServerClient();

  // Fetch published posts for Creators channel
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      slug,
      published_at,
      thumbnail_url,
      seo_description,
      author:profiles!posts_author_id_fkey(username, display_name)
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .lte('published_at', new Date().toISOString())
    .contains('distribution_channels', { smartNewsCreators: true })
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Failed to fetch posts:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            SmartNews for Creators
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!posts || posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">まだ記事がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: any) => (
                <article
                  key={post.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {post.thumbnail_url && (
                    <img
                      src={post.thumbnail_url}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-2">
                      <Link
                        href={`/${post.author?.username}/posts/${post.slug}`}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    {post.seo_description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.seo_description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{post.author?.display_name || post.author?.username}</span>
                      <time dateTime={post.published_at}>
                        {new Date(post.published_at).toLocaleDateString('ja-JP')}
                      </time>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
