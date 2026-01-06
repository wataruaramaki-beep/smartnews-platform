import { createServerClient, createPublicClientForBuild } from '@smartnews/database/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArticleRenderer } from '@smartnews/ui';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const supabase = createPublicClientForBuild();

  const { data: posts } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published')
    .is('deleted_at', null)
    .lte('published_at', new Date().toISOString())
    .contains('distribution_channels', { smartNewsBiz: true });

  return posts?.map((post) => ({ slug: post.slug })) || [];
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createServerClient();

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      slug,
      content,
      published_at,
      thumbnail_url,
      seo_title,
      seo_description,
      author:profiles!posts_author_id_fkey(username, display_name, avatar_url)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .contains('distribution_channels', { smartNewsBiz: true })
    .single();

  if (error || !post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="bg-gray-900 shadow-xl">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
          >
            ← 記事一覧に戻る
          </Link>
          <span className="bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded">
            スポンサード
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <article className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-700">
          {post.thumbnail_url && (
            <img
              src={post.thumbnail_url}
              alt={post.title}
              className="w-full h-96 object-cover"
            />
          )}

          <div className="p-8">
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

            <div className="flex items-center space-x-4 mb-8 pb-8 border-b border-gray-700">
              {post.author?.avatar_url && (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.display_name || post.author.username}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">
                  {post.author?.display_name || post.author?.username}
                </p>
                <time className="text-sm text-gray-400" dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
            </div>

            <div className="prose prose-lg prose-invert max-w-none">
              <ArticleRenderer content={post.content} />
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
