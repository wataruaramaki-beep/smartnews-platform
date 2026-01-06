import { createBrowserClient as createClient } from '@smartnews/database';
import { getPostsByAuthor } from '@/lib/content/posts';
import { tiptapToHtml } from '@/lib/content/tiptap-to-html';
import { toRFC822Date, escapeXml, wrapCDATA } from '@/lib/content/rss-utils';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient();
    const { username: rawUsername } = await params;

    // Remove .xml extension if present
    const username = rawUsername.replace(/\.xml$/, '');

    // 1. Look up user by username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, feed_enabled, feed_title, feed_description')
      .eq('username', username)
      .is('deleted_at', null)
      .single();

    // 2. Handle not found or feed disabled
    if (profileError || !profile) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (!profile.feed_enabled) {
      return new NextResponse('Feed not enabled for this user', { status: 404 });
    }

    // 3. Get user's published posts
    const posts = await getPostsByAuthor(profile.id);

    // 4. Build RSS feed with user's custom metadata
    const siteUrl = 'https://arawata-cms.vercel.app';
    const feedTitle = profile.feed_title || `${profile.display_name || profile.username} - Media Tech Compass`;
    const feedDescription = profile.feed_description || `${profile.display_name || profile.username}の記事`;
    const siteLogo = `${siteUrl}/sncompass_logo_sn.png`;

    // 5. Generate RSS items (reuse logic from site-wide feed)
    const rssItems = posts?.map((post) => {
      const postUrl = `${siteUrl}/${username}/posts/${post.slug}`;
      const authorName = (post as any).author?.display_name || (post as any).author?.username || '匿名';
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

    // 6. Get latest post date for channel pubDate
    const latestPubDate = posts?.[0]?.published_at
      ? toRFC822Date(posts[0].published_at)
      : toRFC822Date(new Date());

    // 7. Generate SmartFormat compliant RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:snf="http://www.smartnews.be/snf">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(feedDescription)}</description>
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
    console.error('Per-user RSS feed generation error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
