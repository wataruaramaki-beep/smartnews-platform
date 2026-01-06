import { createBrowserClient as createClient } from '@smartnews/database';
import { NextResponse } from 'next/server';
import { validateImageFile, generateSafeFilename } from '@/lib/validation/image-validation';

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

    // 2. プロフィール取得と権限チェック
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'プロフィールの取得に失敗しました' },
        { status: 500 }
      );
    }

    if (!['admin', 'creator'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: '画像をアップロードする権限がありません' },
        { status: 403 }
      );
    }

    // 3. FormDataからファイル取得
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // 4. 画像ファイルの厳密な検証
    const validation = await validateImageFile(file, 'postImage');

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 5. 安全なファイル名の生成
    const filePath = `thumbnails/${generateSafeFilename(user.id, validation.metadata!.extension)}`;

    // 6. ファイルをBufferに変換（再度読み込み）
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 7. Supabase Storageへアップロード
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `アップロードに失敗しました: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 8. 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      metadata: validation.metadata,
    });

  } catch (error: any) {
    console.error('Unexpected error in image upload:', error);
    return NextResponse.json(
      { success: false, error: `予期しないエラーが発生しました: ${error.message}` },
      { status: 500 }
    );
  }
}
