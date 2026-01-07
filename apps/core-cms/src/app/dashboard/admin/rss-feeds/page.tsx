'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createBrowserClient as createClient } from '@smartnews/database';

type UserProfile = {
  id: string;
  username: string;
  display_name: string | null;
  email: string;
  role: string;
  feed_enabled: boolean;
  feed_title: string | null;
  feed_description: string | null;
  created_at: string;
};

export default function RSSFeedsManagementPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  // State for users list
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // State for editing feed settings
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    feed_enabled: false,
    feed_title: '',
    feed_description: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Copy to clipboard state
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Fetch all users
  const fetchUsers = async () => {
    if (!user) return;

    setLoadingUsers(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, email, role, feed_enabled, feed_title, feed_description, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (profile && profile.role === 'admin') {
      fetchUsers();
    }
  }, [profile, user]);

  // Toggle feed enabled
  const handleToggleFeedEnabled = async (userId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('profiles')
        .update({ feed_enabled: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, feed_enabled: !currentStatus } : u
        )
      );
    } catch (error: any) {
      console.error('Error toggling feed:', error);
      alert('フィードの切り替えに失敗しました: ' + error.message);
    }
  };

  // Open edit modal
  const handleOpenEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditFormData({
      feed_enabled: user.feed_enabled,
      feed_title: user.feed_title || '',
      feed_description: user.feed_description || '',
    });
    setEditError('');
  };

  // Save feed settings
  const handleSaveFeedSettings = async () => {
    if (!editingUserId) return;

    setSavingEdit(true);
    setEditError('');

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('profiles')
        .update({
          feed_enabled: editFormData.feed_enabled,
          feed_title: editFormData.feed_title || null,
          feed_description: editFormData.feed_description || null,
        })
        .eq('id', editingUserId);

      if (error) throw error;

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.id === editingUserId
            ? { ...u, ...editFormData }
            : u
        )
      );

      setEditingUserId(null);
    } catch (error: any) {
      setEditError('保存に失敗しました: ' + error.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Copy feed URL to clipboard
  const handleCopyFeedUrl = async (username: string) => {
    const feedUrl = `https://arawata-cms.vercel.app/api/feed/${username}.xml`;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopiedUrl(feedUrl);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Auth checks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  // Redirect if not admin
  if (profile.role !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesSearch = searchQuery === '' ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="block hover:opacity-80 transition-opacity">
                <Image
                  src="/sncore_logo.png"
                  alt="SmartNews Core"
                  width={180}
                  height={40}
                  priority
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                ダッシュボード
              </Link>
              <span className="text-sm text-gray-700">{profile.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">SmartFormatフィード管理</h1>
            <p className="mt-2 text-sm text-gray-600">
              ユーザーごとのSmartFormatフィード設定を管理できます。
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ユーザー検索
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ユーザー名、表示名、メールで検索"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  役割フィルター
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">すべて</option>
                  <option value="admin">管理者</option>
                  <option value="creator">クリエイター</option>
                  <option value="reader">読者</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                ユーザー一覧 ({filteredUsers.length}人)
              </h2>

              {loadingUsers ? (
                <div className="p-4 text-center text-gray-500">読み込み中...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">該当するユーザーがいません</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">表示名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">役割</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">フィード有効</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">フィードURL</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.username || '未設定'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.display_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'creator' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role === 'admin' ? '管理者' : user.role === 'creator' ? 'クリエイター' : '読者'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleFeedEnabled(user.id, user.feed_enabled)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                user.feed_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                              }`}
                              aria-label={user.feed_enabled ? 'フィードを無効化' : 'フィードを有効化'}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                user.feed_enabled ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {user.username ? (
                              <button
                                onClick={() => handleCopyFeedUrl(user.username)}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                              >
                                {copiedUrl === `https://arawata-cms.vercel.app/api/feed/${user.username}.xml` ? (
                                  <>
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    コピー済み
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    URLコピー
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-gray-400">ユーザー名未設定</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              編集
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingUserId && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              SmartFormatフィード設定編集
            </h3>

            {editError && (
              <div className="rounded-md bg-red-50 p-4 mb-4">
                <div className="text-sm text-red-800">{editError}</div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editFormData.feed_enabled}
                    onChange={(e) => setEditFormData({ ...editFormData, feed_enabled: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">フィードを有効にする</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  フィードタイトル
                </label>
                <input
                  type="text"
                  value={editFormData.feed_title}
                  onChange={(e) => setEditFormData({ ...editFormData, feed_title: e.target.value })}
                  placeholder="未設定の場合は表示名が使用されます"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500">最大200文字</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  フィード説明
                </label>
                <textarea
                  value={editFormData.feed_description}
                  onChange={(e) => setEditFormData({ ...editFormData, feed_description: e.target.value })}
                  placeholder="フィードの説明を入力してください"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-gray-500">最大500文字</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingUserId(null)}
                disabled={savingEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveFeedSettings}
                disabled={savingEdit}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingEdit ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
