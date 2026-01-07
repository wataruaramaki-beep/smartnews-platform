'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createBrowserClient as createClient } from '@smartnews/database';
import type { UserRole } from '@/types/database';

export default function ChildAccountsPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  // Child accounts state
  const [childAccounts, setChildAccounts] = useState<any[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [childEmail, setChildEmail] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [childUsername, setChildUsername] = useState('');
  const [childDisplayName, setChildDisplayName] = useState('');
  const [childRole, setChildRole] = useState<UserRole>('reader');
  const [creatingChild, setCreatingChild] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createValidationErrors, setCreateValidationErrors] = useState<Record<string, string>>({});

  // Edit child state
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editingChildRole, setEditingChildRole] = useState<UserRole>('reader');

  // Fetch child accounts
  const fetchChildAccounts = async () => {
    if (!user) return;

    setLoadingChildren(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('parent_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setChildAccounts(data || []);
    } catch (error) {
      console.error('Error fetching child accounts:', error);
      setChildAccounts([]);
    } finally {
      setLoadingChildren(false);
    }
  };

  // Fetch child accounts when profile loads
  useEffect(() => {
    if (profile && (profile.role === 'admin' || profile.role === 'creator') && !profile.parent_id) {
      fetchChildAccounts();
    }
  }, [profile, user]);

  // Validate child form
  const validateChildForm = () => {
    const errors: Record<string, string> = {};

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!childEmail || !emailRegex.test(childEmail)) {
      errors.email = '有効なメールアドレスを入力してください';
    }

    // Password (min 6 chars)
    if (!childPassword || childPassword.length < 6) {
      errors.password = 'パスワードは6文字以上で入力してください';
    }

    // Username: 必須、3-20文字、英小文字・数字・アンダースコア
    if (!childUsername || childUsername.trim().length === 0) {
      errors.username = 'アカウント名を入力してください';
    } else {
      const usernameRegex = /^[a-z0-9_]{3,20}$/;
      if (!usernameRegex.test(childUsername)) {
        errors.username = 'アカウント名は3-20文字の英小文字、数字、アンダースコアのみ使用できます';
      }
    }

    // Display name: 任意、50文字以内
    if (childDisplayName && childDisplayName.length > 50) {
      errors.displayName = '公開用ユーザー名は50文字以内で入力してください';
    }

    setCreateValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create child account handler
  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateChildForm()) return;

    setCreateError('');
    setCreatingChild(true);

    try {
      const response = await fetch('/api/child-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: childEmail,
          password: childPassword,
          username: childUsername,
          display_name: childDisplayName || null,
          role: childRole,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Layer2（子アカウント）の作成に失敗しました');
      }

      // Success: reset form and refresh list
      setChildEmail('');
      setChildPassword('');
      setChildUsername('');
      setChildDisplayName('');
      setChildRole('reader');
      setShowCreateForm(false);
      setCreateValidationErrors({});

      await fetchChildAccounts();

    } catch (error: any) {
      setCreateError(error.message || 'Layer2（子アカウント）の作成に失敗しました');
    } finally {
      setCreatingChild(false);
    }
  };

  // Edit child role handler
  const handleEditChildRole = async (childId: string, newRole: UserRole) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', childId);

      if (error) throw error;

      // Update local state
      setChildAccounts(prev =>
        prev.map(child =>
          child.id === childId ? { ...child, role: newRole } : child
        )
      );

      setEditingChildId(null);
    } catch (error: any) {
      console.error('Error updating child role:', error);
      alert('役割の更新に失敗しました: ' + error.message);
    }
  };

  // Delete child account handler (soft delete)
  const handleDeleteChild = async (childId: string, childEmail: string) => {
    if (!confirm(`Layer2（子アカウント） ${childEmail} を削除してもよろしいですか？`)) {
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', childId);

      if (error) throw error;

      // Remove from local state
      setChildAccounts(prev => prev.filter(child => child.id !== childId));

    } catch (error: any) {
      console.error('Error deleting child account:', error);
      alert('削除に失敗しました: ' + error.message);
    }
  };

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

  // Redirect if user is Layer2 or not authorized
  if (profile.parent_id || (profile.role !== 'admin' && profile.role !== 'creator')) {
    router.push('/dashboard');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'creator':
        return 'bg-blue-100 text-blue-800';
      case 'reader':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理者';
      case 'creator':
        return 'クリエイター';
      case 'reader':
        return '読者';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="block hover:opacity-80 transition-opacity">
                <Image
                  src="/sncore_logo.png"
                  alt="SNCompass"
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
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                  profile.role
                )}`}
              >
                {getRoleLabel(profile.role)}
              </span>
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
            <h1 className="text-3xl font-bold text-gray-900">Layer2（子アカウント）管理</h1>
            <p className="mt-2 text-sm text-gray-600">
              Layer2（子アカウント）の作成、一覧表示、役割変更、削除を管理できます。
            </p>
          </div>

          {/* 作成セクション */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Layer2（子アカウント）作成</h2>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {showCreateForm ? 'キャンセル' : '新規作成'}
                </button>
              </div>

              {showCreateForm && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <form onSubmit={handleCreateChild}>
                    {createError && (
                      <div className="rounded-md bg-red-50 p-4 mb-4">
                        <div className="text-sm text-red-800">{createError}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          メールアドレス <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={childEmail}
                          onChange={(e) => setChildEmail(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {createValidationErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{createValidationErrors.email}</p>
                        )}
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          パスワード <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={childPassword}
                          onChange={(e) => setChildPassword(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {createValidationErrors.password && (
                          <p className="mt-1 text-sm text-red-600">{createValidationErrors.password}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">6文字以上</p>
                      </div>

                      {/* Username */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          アカウント名（半角英数字） <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={childUsername}
                          onChange={(e) => setChildUsername(e.target.value.toLowerCase())}
                          placeholder="username123"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {createValidationErrors.username && (
                          <p className="mt-1 text-sm text-red-600">{createValidationErrors.username}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">3-20文字の英小文字、数字、アンダースコアのみ</p>
                      </div>

                      {/* Display Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          公開用ユーザー名
                        </label>
                        <input
                          type="text"
                          value={childDisplayName}
                          onChange={(e) => setChildDisplayName(e.target.value)}
                          placeholder="未設定の場合はアカウント名が表示されます"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {createValidationErrors.displayName && (
                          <p className="mt-1 text-sm text-red-600">{createValidationErrors.displayName}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">任意。日本語や特殊文字も使用可能（50文字以内）</p>
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">役割</label>
                        <select
                          value={childRole}
                          onChange={(e) => setChildRole(e.target.value as UserRole)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="reader">読者</option>
                          <option value="creator">クリエイター</option>
                          <option value="admin">管理者</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={creatingChild}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creatingChild ? '作成中...' : '作成'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Layer2（子アカウント）一覧 */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Layer2（子アカウント）一覧</h2>

              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                {loadingChildren ? (
                  <div className="p-4 text-center text-gray-500">読み込み中...</div>
                ) : childAccounts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Layer2（子アカウント）がありません</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">表示名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">役割</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作成日</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {childAccounts.map((child: any) => (
                        <tr key={child.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {child.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {child.display_name || '未設定'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingChildId === child.id ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={editingChildRole}
                                  onChange={(e) => setEditingChildRole(e.target.value as UserRole)}
                                  className="text-sm rounded-md border-gray-300"
                                >
                                  <option value="reader">読者</option>
                                  <option value="creator">クリエイター</option>
                                  <option value="admin">管理者</option>
                                </select>
                                <button
                                  onClick={() => handleEditChildRole(child.id, editingChildRole)}
                                  className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                                >
                                  保存
                                </button>
                                <button
                                  onClick={() => setEditingChildId(null)}
                                  className="text-gray-600 hover:text-gray-900 text-xs font-medium"
                                >
                                  キャンセル
                                </button>
                              </div>
                            ) : (
                              <span
                                onClick={() => {
                                  setEditingChildId(child.id);
                                  setEditingChildRole(child.role);
                                }}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${getRoleBadgeColor(child.role)}`}
                              >
                                {getRoleLabel(child.role)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(child.created_at).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleDeleteChild(child.id, child.email)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
