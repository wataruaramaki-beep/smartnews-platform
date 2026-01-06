import { getPostsByTag, getAllTags } from '@/lib/content/posts';
import { PostCard } from '@/components/public/PostCard';
import type { Metadata } from 'next';

// ISR: 1時間ごとに再生成
export const revalidate = 3600;

interface PageProps {
  params: Promise<{
    tag: string;
  }>;
}

// SSG: ビルド時に全タグでページを生成
export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag }));
}

// 動的にメタデータを生成
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag}の記事一覧`,
    description: `#${tag}タグが付いた記事を一覧で表示`,
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const posts = await getPostsByTag(tag, 20);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">#{tag}</h1>
      <p className="text-gray-600 mb-8">このタグが付いた記事一覧</p>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            このタグが付いた公開記事はまだありません。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
