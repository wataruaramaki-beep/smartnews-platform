import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export async function GET(request: Request) {
  try {
    // Vercel cron secret 検証
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // newsletter_enabled かつ send_mode = 'digest' の authors を取得
    const { data: authors } = await supabase
      .from('profiles')
      .select('*')
      .eq('newsletter_enabled', true)
      .eq('newsletter_send_mode', 'digest')
      .is('deleted_at', null);

    if (!authors || authors.length === 0) {
      return NextResponse.json({
        message: 'No authors with digest mode enabled',
        results: [],
      });
    }

    const results = [];

    for (const author of authors) {
      try {
        // 頻度チェック
        const shouldSend = checkShouldSend(
          author.newsletter_frequency,
          author.newsletter_last_sent_at
        );

        if (!shouldSend) {
          results.push({
            authorId: author.id,
            authorName: author.display_name || author.username,
            skipped: true,
            reason: 'Not time to send yet',
          });
          continue;
        }

        // 未送信の posts を確認
        const { data: unsentPosts } = await supabase
          .from('posts')
          .select('id')
          .eq('author_id', author.id)
          .eq('status', 'published')
          .is('newsletter_sent_at', null)
          .is('deleted_at', null);

        if (!unsentPosts || unsentPosts.length === 0) {
          results.push({
            authorId: author.id,
            authorName: author.display_name || author.username,
            skipped: true,
            reason: 'No unsent posts',
          });
          continue;
        }

        // 送信API呼び出し
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/newsletter/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authorId: author.id,
            manual: false,
          }),
        });

        const result = await response.json();

        results.push({
          authorId: author.id,
          authorName: author.display_name || author.username,
          success: response.ok,
          ...result,
        });
      } catch (error: any) {
        results.push({
          authorId: author.id,
          authorName: author.display_name || author.username,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${authors.length} authors`,
      results,
    });
  } catch (error: any) {
    console.error('Newsletter cron error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

function checkShouldSend(frequency: string, lastSentAt: string | null): boolean {
  if (!lastSentAt) return true; // 初回送信

  const lastSent = new Date(lastSentAt);
  const now = new Date();
  const hoursSince = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

  switch (frequency) {
    case 'daily':
      return hoursSince >= 24;
    case 'weekly':
      return hoursSince >= 24 * 7;
    case 'monthly':
      return hoursSince >= 24 * 30;
    default:
      return false;
  }
}
