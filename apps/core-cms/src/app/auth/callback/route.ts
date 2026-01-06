import { createBrowserClient as createClient } from '@smartnews/database';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/login?error=${error.message}`);
    }

    // パスワードリセットの場合は専用ページにリダイレクト
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    // メール確認の場合は確認完了ページにリダイレクト
    if (type === 'signup') {
      return NextResponse.redirect(`${origin}/auth/confirm`);
    }

    // その他の場合はダッシュボードにリダイレクト
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // コードがない場合はログインページにリダイレクト
  return NextResponse.redirect(`${origin}/login`);
}
