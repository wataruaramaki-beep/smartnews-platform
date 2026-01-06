'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/database';

type Post = Database['public']['Tables']['posts']['Row'];

interface PostCardProps {
  post: Post;
  priority?: boolean;
}

export function PostCard({ post, priority = false }: PostCardProps) {
  const router = useRouter();

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const author = (post as any).author;

  const handleCardClick = () => {
    if (author?.username) {
      router.push(`/${author.username}/posts/${post.slug}`);
    }
  };

  return (
    <article
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
        {post.thumbnail_url && (
          <div className="relative w-full h-48">
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
            />
          </div>
        )}

        <div className="p-6">
          {/* Author Info */}
          {author && (
            <Link
              href={`/${author.username}`}
              className="flex items-center mb-3 hover:opacity-75 transition-opacity z-10 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {author.avatar_url ? (
                <Image
                  src={author.avatar_url}
                  alt={author.display_name || 'Author'}
                  width={32}
                  height={32}
                  className="rounded-full object-cover mr-2"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              <span className="text-sm text-gray-600">
                {author.display_name || author.username || '匿名'}
              </span>
            </Link>
          )}

          {post.genre && (
            <div className="mb-2">
              <Link
                href={`/genre/${post.genre}`}
                className="z-10 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors">
                  {post.genre}
                </span>
              </Link>
            </div>
          )}

          <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-indigo-600 transition-colors">
            {post.title}
          </h2>

          {formattedDate && (
            <p className="text-sm text-gray-600 mb-3">{formattedDate}</p>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="z-10 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors">
                    #{tag}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
    </article>
  );
}
