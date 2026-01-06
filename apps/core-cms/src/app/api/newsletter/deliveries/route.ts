import { NextResponse } from 'next/server';
import { createBrowserClient as createClient } from '@smartnews/database';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'プロフィールが見つかりません' },
        { status: 404 }
      );
    }

    // Check role
    if (!['admin', 'creator'].includes(profile.role)) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    // Get deliveries
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('newsletter_deliveries')
      .select('*')
      .eq('author_id', user.id)
      .order('sent_at', { ascending: false });

    if (deliveriesError) {
      console.error('Deliveries query error:', deliveriesError);
      return NextResponse.json(
        { error: '配信履歴の取得に失敗しました' },
        { status: 500 }
      );
    }

    // Get post titles for each delivery
    const deliveriesWithPosts = await Promise.all(
      (deliveries || []).map(async (delivery) => {
        if (delivery.post_ids && delivery.post_ids.length > 0) {
          const { data: posts } = await supabase
            .from('posts')
            .select('id, title, slug')
            .in('id', delivery.post_ids);

          return {
            ...delivery,
            posts: posts || [],
          };
        }
        return {
          ...delivery,
          posts: [],
        };
      })
    );

    return NextResponse.json({
      deliveries: deliveriesWithPosts,
    });
  } catch (error: any) {
    console.error('Newsletter deliveries GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
