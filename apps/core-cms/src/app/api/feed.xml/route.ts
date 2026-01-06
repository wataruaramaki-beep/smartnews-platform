import { createBrowserClient as createClient } from '@smartnews/database';
import { tiptapToHtml } from '@/lib/content/tiptap-to-html';
import { toRFC822Date, escapeXml, wrapCDATA } from '@/lib/content/rss-utils';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get published posts from the last 2 weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(username, display_name, avatar_url)
      `)
      .eq('status', 'published')
      .gte('published_at', twoWeeksAgo.toISOString())
      .is('deleted_at', null)
      .contains('distribution_channels', { smartNews: true })
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    // Get site URL from environment
    const siteUrl = 'https://arawata-cms.vercel.app';
    const siteName = 'Media Tech Compass';
    const siteDescription = 'テクノロジーとビジネスの最新情報';
    const siteLogo = `${siteUrl}/sncompass_logo_sn.png`;

    // Get latest post date for channel pubDate
    const latestPubDate = posts?.[0]?.published_at
      ? toRFC822Date(posts[0].published_at)
      : toRFC822Date(new Date());

    // Generate RSS XML
    const rssItems = posts?.map((post) => {
      const authorUsername = post.author?.username || '';
      const postUrl = `${siteUrl}/${authorUsername}/posts/${post.slug}`;
      const authorName = post.author?.display_name || post.author?.username || '匿名';
      const htmlContent = tiptapToHtml(post.content);
      const categories = [
        ...(post.genre ? [post.genre] : []),
        ...(post.tags || []),
      ];

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${toRFC822Date(post.published_at!)}</pubDate>
      <dc:creator>${escapeXml(authorName)}</dc:creator>
      ${post.thumbnail_url ? `<media:thumbnail url="${escapeXml(post.thumbnail_url)}" />` : ''}
      ${categories.map(cat => `<category>${escapeXml(cat)}</category>`).join('\n      ')}
      <description>${wrapCDATA(post.title)}</description>
      <content:encoded>${wrapCDATA(htmlContent)}</content:encoded>
    </item>`;
    }).join('') || '';

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:snf="http://www.smartnews.be/snf">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>ja</language>
    <pubDate>${latestPubDate}</pubDate>
    <lastBuildDate>${toRFC822Date(new Date())}</lastBuildDate>
    <snf:logo><url>${siteLogo}</url></snf:logo>
    <ttl>15</ttl>
    ${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('RSS feed generation error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
