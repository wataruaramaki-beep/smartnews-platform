import { NextResponse } from 'next/server';
import { createBrowserClient as createClient } from '@smartnews/database';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  sendNewsletterBatch,
  createDeliveryRecord,
  updateDeliveryRecord,
  markPostsAsSent,
  updateLastSentAt,
} from '@/lib/newsletter/sender';

export async function POST(request: Request) {
  try {
    // 1. 認証・認可チェック
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 2. リクエストボディ取得
    const body = await request.json();
    const { authorId, postIds, manual } = body;

    // Validate authorId
    if (!authorId) {
      return NextResponse.json(
        { error: 'authorIdが必要です' },
        { status: 400 }
      );
    }

    // Authorization: ユーザーは自分のニュースレターのみ送信可能（またはadmin）
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (user.id !== authorId && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    // 3. author の newsletter 設定取得
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authorId)
      .single();

    if (authorError || !author) {
      return NextResponse.json(
        { error: 'Authorが見つかりません' },
        { status: 404 }
      );
    }

    if (!author.newsletter_enabled) {
      return NextResponse.json(
        { error: 'ニュースレターが有効になっていません' },
        { status: 400 }
      );
    }

    // 4. 送信する posts を取得
    const supabaseAdmin = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    let posts;
    if (postIds && postIds.length > 0) {
      // 手動送信: 指定された posts
      const { data, error } = await supabaseAdmin
        .from('posts')
        .select('*')
        .in('id', postIds)
        .eq('status', 'published')
        .is('deleted_at', null);

      if (error) throw error;
      posts = data || [];
    } else {
      // 自動送信: newsletter_sent_at が null の published posts
      const { data, error } = await supabaseAdmin
        .from('posts')
        .select('*')
        .eq('author_id', authorId)
        .eq('status', 'published')
        .is('newsletter_sent_at', null)
        .is('deleted_at', null)
        .order('published_at', { ascending: false })
        .limit(10); // 最大10件

      if (error) throw error;
      posts = data || [];
    }

    if (posts.length === 0) {
      return NextResponse.json(
        { message: '送信する記事がありません' },
        { status: 200 }
      );
    }

    // 5. active な subscribers 取得
    const { data: subscribers, error: subscribersError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*')
      .eq('author_id', authorId)
      .eq('status', 'active');

    if (subscribersError) throw subscribersError;

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { message: 'アクティブな購読者がいません' },
        { status: 200 }
      );
    }

    // 6. 配信レコード作成
    const subject = author.newsletter_title || `${author.display_name || author.username}の最新記事`;
    const deliveryId = await createDeliveryRecord({
      authorId,
      postIds: posts.map(p => p.id),
      subscriberCount: subscribers.length,
      subject,
    });

    // 7. メール送信（バッチ処理）
    const result = await sendNewsletterBatch(author, posts, subscribers, deliveryId);

    // 8. 配信レコード更新
    await updateDeliveryRecord(deliveryId, {
      status: 'completed',
      sent_count: result.successCount,
      failed_count: result.failureCount,
      error_message: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
    });

    // 9. posts の newsletter_sent_at 更新
    await markPostsAsSent(posts.map(p => p.id));

    // 10. author の newsletter_last_sent_at 更新
    await updateLastSentAt(authorId);

    return NextResponse.json({
      success: true,
      deliveryId,
      sentCount: result.successCount,
      failedCount: result.failureCount,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('Newsletter send error:', error);
    return NextResponse.json(
      { error: `送信エラー: ${error.message}` },
      { status: 500 }
    );
  }
}
