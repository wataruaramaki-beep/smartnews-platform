import { createServerClient } from '@smartnews/database/server';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createServerClient();

  // Fetch published posts for Biz channel
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
    .contains('distribution_channels', { smartNewsBiz: true })
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Failed to fetch posts:', error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="bg-gray-900 shadow-xl">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">
            SmartNews Biz
          </h1>
          <p className="text-sm text-gray-400 mt-2">PR・スポンサードコンテンツ</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!posts || posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">まだ記事がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: any) => (
                <article
                  key={post.id}
                  className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-700"
                >
                  <div className="relative">
                    {post.thumbnail_url && (
                      <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="absolute top-2 right-2 bg-yellow-500 text-gray-900 text-xs font-bold px-2 py-1 rounded">
                      PR
                    </div>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-2">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="hover:text-yellow-400 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    {post.seo_description && (
                      <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                        {post.seo_description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-400">
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
