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
      .select('*')
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

    // Get subscriber stats
    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('status')
      .eq('author_id', user.id);

    const stats = {
      total: subscribers?.length || 0,
      active: subscribers?.filter(s => s.status === 'active').length || 0,
      pending: subscribers?.filter(s => s.status === 'pending').length || 0,
      unsubscribed: subscribers?.filter(s => s.status === 'unsubscribed').length || 0,
    };

    return NextResponse.json({
      settings: {
        newsletter_enabled: profile.newsletter_enabled,
        newsletter_send_mode: profile.newsletter_send_mode || 'digest',
        newsletter_frequency: profile.newsletter_frequency,
        newsletter_title: profile.newsletter_title,
        newsletter_description: profile.newsletter_description,
        newsletter_from_name: profile.newsletter_from_name,
        newsletter_from_email: profile.newsletter_from_email,
        newsletter_last_sent_at: profile.newsletter_last_sent_at,
      },
      stats,
    });
  } catch (error: any) {
    console.error('Newsletter settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      newsletter_enabled,
      newsletter_send_mode,
      newsletter_frequency,
      newsletter_title,
      newsletter_description,
      newsletter_from_name,
      newsletter_from_email,
    } = body;

    // Validate
    if (newsletter_send_mode && !['immediate', 'digest'].includes(newsletter_send_mode)) {
      return NextResponse.json(
        { error: '無効な送信モードです' },
        { status: 400 }
      );
    }

    if (newsletter_frequency && !['daily', 'weekly', 'monthly'].includes(newsletter_frequency)) {
      return NextResponse.json(
        { error: '無効な配信頻度です' },
        { status: 400 }
      );
    }

    if (newsletter_from_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newsletter_from_email)) {
        return NextResponse.json(
          { error: '無効なメールアドレスです' },
          { status: 400 }
        );
      }
    }

    // Update settings
    const updateData: any = {};
    if (newsletter_enabled !== undefined) updateData.newsletter_enabled = newsletter_enabled;
    if (newsletter_send_mode) updateData.newsletter_send_mode = newsletter_send_mode;
    if (newsletter_frequency) updateData.newsletter_frequency = newsletter_frequency;
    if (newsletter_title !== undefined) updateData.newsletter_title = newsletter_title;
    if (newsletter_description !== undefined) updateData.newsletter_description = newsletter_description;
    if (newsletter_from_name !== undefined) updateData.newsletter_from_name = newsletter_from_name;
    if (newsletter_from_email !== undefined) updateData.newsletter_from_email = newsletter_from_email;

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: '設定の更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: {
        newsletter_enabled: profile.newsletter_enabled,
        newsletter_send_mode: profile.newsletter_send_mode,
        newsletter_frequency: profile.newsletter_frequency,
        newsletter_title: profile.newsletter_title,
        newsletter_description: profile.newsletter_description,
        newsletter_from_name: profile.newsletter_from_name,
        newsletter_from_email: profile.newsletter_from_email,
        newsletter_last_sent_at: profile.newsletter_last_sent_at,
      },
    });
  } catch (error: any) {
    console.error('Newsletter settings PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
