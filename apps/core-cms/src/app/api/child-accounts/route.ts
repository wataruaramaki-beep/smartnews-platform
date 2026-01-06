import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database';
import { createBrowserClient as createClient } from '@smartnews/database';

// Admin client with service role key
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

export async function POST(request: Request) {
  try {
    // 1. Verify authentication using server-side client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 2. Get user profile and verify permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, parent_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'プロフィールの取得に失敗しました' },
        { status: 500 }
      );
    }

    // Type assertion to help TypeScript understand the shape
    type ProfileData = { role: string; parent_id: string | null };
    const userProfile = profile as ProfileData;

    // 3. Check if user has permission to create child accounts
    if (!['admin', 'creator'].includes(userProfile.role)) {
      return NextResponse.json(
        { success: false, error: '子アカウントを作成する権限がありません' },
        { status: 403 }
      );
    }

    // 4. Check if user is Layer1 (only Layer1 can create child accounts)
    if (userProfile.parent_id) {
      return NextResponse.json(
        { success: false, error: 'Layer2アカウントは子アカウントを作成できません' },
        { status: 403 }
      );
    }

    // 5. Parse request body
    const body = await request.json();
    const { email, password, username, display_name, role = 'reader' } = body;

    // 6. Validate required fields
    if (!email || !password || !username) {
      return NextResponse.json(
        { success: false, error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // 6b. Validate username format
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { success: false, error: 'アカウント名は3-20文字の英小文字、数字、アンダースコアのみ使用できます' },
        { status: 400 }
      );
    }

    // 7. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // 8. Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'パスワードは6文字以上で入力してください' },
        { status: 400 }
      );
    }

    // 9. Validate role
    if (!['reader', 'creator', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: '無効な役割が指定されました' },
        { status: 400 }
      );
    }

    // 10. Create auth user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        display_name
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);

      // Handle duplicate email error
      if (createError.message.includes('already registered')) {
        return NextResponse.json(
          { success: false, error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: `アカウント作成エラー: ${createError.message}` },
        { status: 400 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { success: false, error: 'ユーザーの作成に失敗しました' },
        { status: 500 }
      );
    }

    // 11. Wait for profile creation trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // 12. Update profile with parent_id, username, display_name, and role
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        parent_id: user.id,
        username,
        display_name: display_name || null,
        role
      })
      .eq('id', newUser.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { success: false, error: `プロフィール更新エラー: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 13. Return success response
    return NextResponse.json({
      success: true,
      child: updatedProfile
    });

  } catch (error: any) {
    console.error('Unexpected error in child account creation:', error);
    return NextResponse.json(
      { success: false, error: `予期しないエラーが発生しました: ${error.message}` },
      { status: 500 }
    );
  }
}
