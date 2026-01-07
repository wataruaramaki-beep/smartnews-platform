import { createServerClient, createPublicClientForBuild } from '@smartnews/database/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArticleRenderer } from '@smartnews/ui';

type PageProps = {
  params: Promise<{ username: string; slug: string }>;
};

export async function generateStaticParams() {
  const supabase = createPublicClientForBuild();

  const { data: posts } = await supabase
    .from('posts')
    .select('slug, author:profiles!posts_author_id_fkey(username)')
    .eq('status', 'published')
    .is('deleted_at', null)
    .lte('published_at', new Date().toISOString())
    .contains('distribution_channels', { smartNewsCreators: true });

  return posts?.map((post: any) => ({
    username: post.author?.username,
    slug: post.slug,
  })) || [];
}

export default async function PostPage({ params }: PageProps) {
  const { username, slug } = await params;
  const supabase = await createServerClient();

  // First, verify the author exists
  const { data: author, error: authorError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('username', username)
    .is('deleted_at', null)
    .single();

  if (authorError || !author) {
    notFound();
  }

  // Fetch the post and verify it belongs to this author
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
      author_id
    `)
    .eq('slug', slug)
    .eq('author_id', author.id)
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
            href={`/${username}`}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            ← {author.display_name || author.username} のページに戻る
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
              {author.avatar_url && (
                <img
                  src={author.avatar_url}
                  alt={author.display_name || author.username}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">
                  {author.display_name || author.username}
                </p>
                {post.published_at && (
                  <time className="text-sm text-gray-500" dateTime={post.published_at}>
                    {new Date(post.published_at).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                )}
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
