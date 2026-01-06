import type { Database } from '@/types/database';

type Post = Database['public']['Tables']['posts']['Row'];

/**
 * 記事用のJSON-LD構造化データを生成
 * Google等の検索エンジンがコンテンツを理解しやすくする
 */
export function generateArticleJsonLd(post: Post, authorName?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seo_description || post.title,
    image: post.thumbnail_url || post.seo_image_url || undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: authorName || '不明',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Media Tech Compass',
      logo: {
        '@type': 'ImageObject',
        url: 'https://arawata-cms.vercel.app/sncore_logo.png',
      },
    },
  };
}

/**
 * WebSite用のJSON-LD構造化データを生成
 * サイト全体の検索機能等を定義
 */
export function generateWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Media Tech Compass',
    description: 'テクノロジーとビジネスの最新情報',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://arawata-cms.vercel.app',
  };
}

/**
 * BreadcrumbList用のJSON-LD構造化データを生成
 * パンくずリストを検索結果に表示
 */
export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
