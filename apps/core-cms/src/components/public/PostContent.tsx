import Image from 'next/image';
import Link from 'next/link';
import type { Database } from '@/types/database';
import { TiptapRenderer } from './TiptapRenderer';

type Post = Database['public']['Tables']['posts']['Row'];

interface PostContentProps {
  post: Post;
  currentUserId?: string;
}

export function PostContent({ post, currentUserId }: PostContentProps) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // Check if current user is the author
  const isAuthor = currentUserId && currentUserId === post.author_id;

  // Support both old text format and new Tiptap JSON format
  const isLegacyTextFormat = post.content?.text && typeof post.content.text === 'string';
  const hasContent = post.content && Object.keys(post.content).length > 0;

  return (
    <article className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            {post.genre && (
              <Link
                href={`/genre/${post.genre}`}
                className="inline-block px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors"
              >
                {post.genre}
              </Link>
            )}
          </div>

          {/* Edit button for author */}
          {isAuthor && (
            <Link
              href={`/dashboard/posts/${post.id}/edit`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              編集
            </Link>
          )}
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        {formattedDate && (
          <time className="text-gray-600" dateTime={post.published_at || ''}>
            {formattedDate}
          </time>
        )}
      </header>

      {/* Thumbnail */}
      {post.thumbnail_url && (
        <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
          <Image
            src={post.thumbnail_url}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      {hasContent && post.content && (
        <div className="prose prose-lg max-w-none mb-8">
          {isLegacyTextFormat ? (
            // Legacy plain text format
            <div className="whitespace-pre-wrap">{post.content.text}</div>
          ) : (
            // New Tiptap JSON format
            <TiptapRenderer content={post.content} />
          )}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">タグ:</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${tag}`}
                className="inline-block px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
