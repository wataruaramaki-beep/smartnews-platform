import { createPublicClient, createPublicClientForBuild } from '@smartnews/database/server';
import type { Database } from '@smartnews/database';

type Post = Database['public']['Tables']['posts']['Row'];

/**
 * 公開記事のフィルター条件を適用
 * - status が 'published'
 * - published_at が現在時刻以前
 * - deleted_at が null
 */
function applyPublicPostsFilter(query: any) {
  const now = new Date().toISOString();
  return query
    .eq('status', 'published')
    .lte('published_at', now)
    .is('deleted_at', null);
}

/**
 * トップページ用: 最新の公開記事を取得（著者情報を含む）
 */
export async function getLatestPosts(limit: number = 20): Promise<Post[]> {
  const supabase = await createPublicClient();

  const query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(id, username, display_name, avatar_url)
    `)
    .order('published_at', { ascending: false })
    .limit(limit);

  const { data, error } = await applyPublicPostsFilter(query);

  if (error) {
    console.error('Error fetching latest posts:', error);
    return [];
  }

  return data || [];
}

/**
 * 記事詳細ページ用: slugで記事を取得（著者情報を含む）
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = await createPublicClient();

  const query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(id, username, display_name, avatar_url)
    `)
    .eq('slug', slug)
    .single();

  const { data, error} = await applyPublicPostsFilter(query);

  if (error) {
    console.error(`Error fetching post with slug ${slug}:`, error);
    return null;
  }

  return data;
}

/**
 * ジャンル別一覧用: 指定ジャンルの公開記事を取得
 */
export async function getPostsByGenre(
  genre: string,
  limit: number = 20
): Promise<Post[]> {
  const supabase = await createPublicClient();

  const query = supabase
    .from('posts')
    .select('*')
    .eq('genre', genre)
    .order('published_at', { ascending: false })
    .limit(limit);

  const { data, error } = await applyPublicPostsFilter(query);

  if (error) {
    console.error(`Error fetching posts by genre ${genre}:`, error);
    return [];
  }

  return data || [];
}

/**
 * タグ別一覧用: 指定タグを含む公開記事を取得
 */
export async function getPostsByTag(
  tag: string,
  limit: number = 20
): Promise<Post[]> {
  const supabase = await createPublicClient();

  const query = supabase
    .from('posts')
    .select('*')
    .contains('tags', [tag])
    .order('published_at', { ascending: false })
    .limit(limit);

  const { data, error } = await applyPublicPostsFilter(query);

  if (error) {
    console.error(`Error fetching posts by tag ${tag}:`, error);
    return [];
  }

  return data || [];
}

/**
 * ユーザーごとのSmartFormatフィード用: 指定著者の公開記事を取得（過去2週間）
 */
export async function getPostsByAuthor(
  authorId: string,
  limit: number = 50
): Promise<Post[]> {
  const supabase = await createPublicClient();

  // Get posts from last 2 weeks (matching site-wide feed logic)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(id, display_name, username, avatar_url)
    `)
    .eq('author_id', authorId)
    .gte('published_at', twoWeeksAgo.toISOString())
    .order('published_at', { ascending: false })
    .limit(limit);

  const { data, error } = await applyPublicPostsFilter(query);

  if (error) {
    console.error(`Error fetching posts by author ${authorId}:`, error);
    return [];
  }

  return data || [];
}

/**
 * ユーザーページ用: usernameでユーザー情報を取得
 */
export async function getUserByUsername(username: string) {
  const supabase = await createPublicClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('username', username)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error(`Error fetching user ${username}:`, error);
    return null;
  }

  return data;
}

/**
 * ユーザーページ用: usernameで著者の全公開記事を取得
 */
export async function getPostsByUsername(
  username: string,
  limit: number = 50
): Promise<Post[]> {
  const supabase = await createPublicClient();

  // First, get the user's ID
  const user = await getUserByUsername(username);
  if (!user) {
    return [];
  }

  const query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(id, display_name, username, avatar_url)
    `)
    .eq('author_id', user.id)
    .order('published_at', { ascending: false })
    .limit(limit);

  const { data, error } = await applyPublicPostsFilter(query);

  if (error) {
    console.error(`Error fetching posts by username ${username}:`, error);
    return [];
  }

  return data || [];
}

/**
 * SSG用: 全公開記事のslugを取得
 * ビルド時に使用するため、createPublicClientForBuild()を使用
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const supabase = createPublicClientForBuild();

  const query = supabase
    .from('posts')
    .select('slug');

  const { data, error } = await applyPublicPostsFilter(query);

  if (error) {
    console.error('Error fetching all post slugs:', error);
    return [];
  }

  return (data || []).map((post: Post) => post.slug);
}

/**
 * SSG用: 全ジャンルを取得（重複排除）
 * ビルド時に使用するため、createPublicClientForBuild()を使用
 */
export async function getAllGenres(): Promise<string[]> {
  const supabase = createPublicClientForBuild();

  const query = supabase
    .from('posts')
    .select('genre');

  const { data, error } = await applyPublicPostsFilter(query);

  if (error) {
    console.error('Error fetching all genres:', error);
    return [];
  }

  // null を除外して重複を排除
  const genres = (data || [])
    .map((post: Post) => post.genre)
    .filter((genre: string | null): genre is string => genre !== null);

  return Array.from(new Set(genres));
}

/**
 * SSG用: 全タグを取得（重複排除）
 * ビルド時に使用するため、createPublicClientForBuild()を使用
 */
export async function getAllTags(): Promise<string[]> {
  const supabase = createPublicClientForBuild();

  const query = supabase
    .from('posts')
    .select('tags');

  const { data, error } = await applyPublicPostsFilter(query);

  if (error) {
    console.error('Error fetching all tags:', error);
    return [];
  }

  // 全タグを平坦化して重複を排除
  const allTags = (data || [])
    .flatMap((post: Post) => post.tags || []);

  return Array.from(new Set(allTags));
}

/**
 * SSG用: 記事を投稿している全ユーザーのusernameを取得
 * ビルド時に使用するため、createPublicClientForBuild()を使用
 */
export async function getAllUsernames(): Promise<string[]> {
  const supabase = createPublicClientForBuild();

  // Get all published posts with author info
  const query = supabase
    .from('posts')
    .select('author_id');

  const { data, error } = await applyPublicPostsFilter(query);

  if (error) {
    console.error('Error fetching posts for usernames:', error);
    return [];
  }

  // Get unique author IDs
  const authorIds: string[] = Array.from(new Set(
    (data || []).map((post: Post) => post.author_id)
  ));

  if (authorIds.length === 0) {
    return [];
  }

  // Fetch usernames for these authors
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('username')
    .in('id', authorIds)
    .is('deleted_at', null);

  if (profileError) {
    console.error('Error fetching usernames:', profileError);
    return [];
  }

  return (profiles || []).map((profile: any) => profile.username);
}
