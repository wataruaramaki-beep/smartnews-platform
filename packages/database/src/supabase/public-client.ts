import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '../types/database';

/**
 * 公開サイト用のSupabaseクライアント
 * 認証なしでも公開記事にアクセス可能
 * Server Componentで使用
 */
export async function createPublicClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component内での呼び出しの場合は無視
          }
        },
      },
    }
  );
}

/**
 * ビルド時用のSupabaseクライアント
 * generateStaticParams等、リクエストコンテキストがない場合に使用
 */
export function createPublicClientForBuild() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
