import { createBrowserClient as createClient } from '@smartnews/database';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. 認証チェック
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 2. プロフィール取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'creator'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: '権限がありません' },
        { status: 403 }
      );
    }

    // 3. リクエストボディからパスを取得
    const body = await request.json();
    const { path } = body;

    if (!path) {
      return NextResponse.json(
        { success: false, error: '削除する画像のパスが指定されていません' },
        { status: 400 }
      );
    }

    // 4. Storage から削除
    const { error: deleteError } = await supabase.storage
      .from('post-images')
      .remove([path]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: `削除に失敗しました: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Unexpected error in image deletion:', error);
    return NextResponse.json(
      { success: false, error: `予期しないエラーが発生しました: ${error.message}` },
      { status: 500 }
    );
  }
}
