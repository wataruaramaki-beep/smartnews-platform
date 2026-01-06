import { NextResponse } from 'next/server';
import { createBrowserClient as createClient } from '@smartnews/database';
import type { SubscriberStatus } from '@/types/database';

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

    // Get query params
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';

    // Build query
    let query = supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as SubscriberStatus);
    }

    const { data: subscribers, error: subscribersError } = await query;

    if (subscribersError) {
      console.error('Subscribers query error:', subscribersError);
      return NextResponse.json(
        { error: '購読者の取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscribers: subscribers || [],
    });
  } catch (error: any) {
    console.error('Newsletter subscribers GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
