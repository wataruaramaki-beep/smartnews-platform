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
    .contains('distribution_channels', { smartNewsCreators: true });

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
    .contains('distribution_channels', { smartNewsCreators: true })
    .single();

  if (error || !post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            ← 記事一覧に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {post.thumbnail_url && (
            <img
              src={post.thumbnail_url}
              alt={post.title}
              className="w-full h-96 object-cover"
            />
          )}

          <div className="p-8">
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

            <div className="flex items-center space-x-4 mb-8 pb-8 border-b">
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
                <time className="text-sm text-gray-500" dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <ArticleRenderer content={post.content} />
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
