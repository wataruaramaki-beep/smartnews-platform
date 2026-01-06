'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createBrowserClient as createClient } from '@smartnews/database';
import type { UserRole } from '@/types/database';

export default function DashboardPage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedDisplayName, setEditedDisplayName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedRole, setEditedRole] = useState<UserRole>('reader');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Parent account state (for Layer2 users)
  const [parentAccount, setParentAccount] = useState<any>(null);

  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Initialize edit state when entering edit mode
  useEffect(() => {
    if (profile && isEditing) {
      setEditedUsername(profile.username || '');
      setEditedDisplayName(profile.display_name || '');
      setEditedEmail(profile.email);
      setEditedRole(profile.role);
    }
  }, [isEditing, profile]);

  // Check if user can edit roles
  const canEditRole = useMemo(() => {
    if (!profile) return false;
    return profile.role === 'admin';
    // TODO: Add parent_id check for parent-child relationships
  }, [profile]);

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Username: 必須、3-20文字、英小文字・数字・アンダースコア
    if (!editedUsername || editedUsername.trim().length === 0) {
      errors.username = 'アカウント名（半角英数字）を入力してください';
    } else {
      const usernameRegex = /^[a-z0-9_]{3,20}$/;
      if (!usernameRegex.test(editedUsername)) {
        errors.username = 'アカウント名（半角英数字）は3-20文字の英小文字、数字、アンダースコアのみ使用できます';
      }
    }

    // Display name: 任意、50文字以内
    if (editedDisplayName && editedDisplayName.length > 50) {
      errors.displayName = '公開用ユーザー名は50文字以内で入力してください';
    }

    // Email: 必須、有効な形式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editedEmail || !emailRegex.test(editedEmail)) {
      errors.email = '有効なメールアドレスを入力してください';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save handler
  const handleSave = async () => {
    if (!validateForm()) return;

    setError('');
    setSaving(true);

    try {
      const supabase = createClient();

      const updateData: {
        username: string;
        display_name: string | null;
        email: string;
        role?: UserRole;
      } = {
        username: editedUsername,
        display_name: editedDisplayName || null,
        email: editedEmail,
      };

      // 権限がある場合のみroleを更新
      if (canEditRole && editedRole !== profile?.role) {
        updateData.role = editedRole;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData as any)
        .eq('id', user!.id);

      if (updateError) {
        // ユニーク制約違反のエラーハンドリング
        if (updateError.message.includes('username')) {
          setError('このアカウント名は既に使用されています');
        } else if (updateError.message.includes('email')) {
          setError('このメールアドレスは既に使用されています');
        } else {
          setError('保存に失敗しました: ' + updateError.message);
        }
        return;
      }

      // プロフィール再取得
      await refreshProfile();

      // 編集モード終了
      setIsEditing(false);
      setError('');
    } catch (err: any) {
      setError('予期しないエラーが発生しました');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Cancel handler
  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setValidationErrors({});
  };

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'アップロードに失敗しました');
      }

      // Refresh profile to get new avatar URL
      await refreshProfile();
    } catch (error: any) {
      setAvatarError(error.message || 'アップロードに失敗しました');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Avatar delete handler
  const handleAvatarDelete = async () => {
    if (!confirm('アバター画像を削除してもよろしいですか？')) {
      return;
    }

    setAvatarError('');
    setUploadingAvatar(true);

    try {
      const response = await fetch('/api/avatar', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '削除に失敗しました');
      }

      // Refresh profile to remove avatar URL
      await refreshProfile();
    } catch (error: any) {
      setAvatarError(error.message || '削除に失敗しました');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Fetch parent account info for Layer2 users
  const fetchParentAccount = async () => {
    if (!profile || !profile.parent_id) return;

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.parent_id)
        .single();

      if (error) throw error;

      setParentAccount(data);
    } catch (error) {
      console.error('Error fetching parent account:', error);
      setParentAccount(null);
    }
  };

  // Fetch parent account for Layer2 users
  useEffect(() => {
    if (profile && profile.parent_id) {
      fetchParentAccount();
    }
  }, [profile]);

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

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
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
          <div className="relative flex justify-center items-center h-32">
            <Link href="/" className="block hover:opacity-80 transition-opacity">
              <Image
                src="/sncore_logo.png"
                alt="SNCompass"
                width={450}
                height={100}
                priority
                style={{ height: '100px', width: 'auto' }}
              />
            </Link>

            <div className="absolute right-0 flex items-center">
              <div className="flex flex-col space-y-1.5 sm:space-y-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-3 py-1 text-xs sm:px-6 sm:py-2 sm:text-sm font-medium rounded-md text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                >
                  TOP
                </Link>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center justify-center px-3 py-1 text-xs sm:px-6 sm:py-2 sm:text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ようこそ、{profile.display_name || profile.username || 'ユーザー'}さん
              </h2>
              {/* 2-column layout: Profile info (left) + Quick Actions (right) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Information */}
                <div className="lg:col-span-2 space-y-6">
                  {!isEditing ? (
                    // View Mode
                    <div>
                      <div className="flex justify-start mb-4">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          編集
                        </button>
                      </div>

                      {/* プロフィール Section */}
                      <div className="border border-gray-200 rounded-lg p-6 mb-6">
                        <h4 className="text-base font-semibold text-gray-900 mb-4">プロフィール</h4>

                        {/* Avatar */}
                        <div className="mb-6 flex flex-col items-start">
                          <div className="relative mb-4">
                            {profile.avatar_url ? (
                              <Image
                                src={profile.avatar_url}
                                alt={profile.display_name || 'Avatar'}
                                width={100}
                                height={100}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="w-full">
                            <label className="block">
                              <span className="sr-only">アバター画像を選択</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                disabled={uploadingAvatar}
                                className="block w-full text-sm text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-md file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-indigo-50 file:text-indigo-700
                                  hover:file:bg-indigo-100
                                  disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </label>
                            {profile.avatar_url && (
                              <button
                                onClick={handleAvatarDelete}
                                disabled={uploadingAvatar}
                                className="mt-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                アバターを削除
                              </button>
                            )}
                            {avatarError && (
                              <p className="mt-2 text-sm text-red-600">{avatarError}</p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">
                              JPG、PNG、WebP、GIF（最大2MB）
                            </p>
                          </div>
                        </div>

                        {/* Profile Information */}
                        <dl className="space-y-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">公開用ユーザー名</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {profile.display_name || profile.username}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">アカウント名（半角英数字）</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {profile.username || '未設定'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                            <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">役割</dt>
                            <dd className="mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                profile.role === 'admin' ? 'bg-red-100 text-red-800' :
                                profile.role === 'creator' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {getRoleLabel(profile.role)}
                              </span>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              アカウント層
                              <span className="block text-xs font-normal text-gray-400 mt-0.5">
                                ＊Layer1は、Layer2のユーザーアカウントを発行することができます
                              </span>
                            </dt>
                            <dd className="mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                profile.parent_id ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {profile.parent_id ? 'Layer2' : 'Layer1'}
                              </span>
                            </dd>
                          </div>
                          {profile.parent_id && parentAccount && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">親アカウント</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {parentAccount.display_name || parentAccount.email}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          プロフィール編集
                        </h3>
                      </div>

                      {error && (
                        <div className="rounded-md bg-red-50 p-4 mb-4">
                          <div className="text-sm text-red-800">{error}</div>
                        </div>
                      )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Username Field */}
                      <div>
                        <label
                          htmlFor="username"
                          className="block text-sm font-medium text-gray-700"
                        >
                          アカウント名（半角英数字） <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="username"
                          type="text"
                          value={editedUsername}
                          onChange={(e) => setEditedUsername(e.target.value.toLowerCase())}
                          placeholder="username123"
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                            validationErrors.username ? 'border-red-300' : ''
                          }`}
                        />
                        {validationErrors.username && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors.username}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          3-20文字の英小文字、数字、アンダースコアのみ
                        </p>
                      </div>

                      {/* Display Name Field */}
                      <div>
                        <label
                          htmlFor="displayName"
                          className="block text-sm font-medium text-gray-700"
                        >
                          公開用ユーザー名
                        </label>
                        <input
                          id="displayName"
                          type="text"
                          value={editedDisplayName}
                          onChange={(e) => setEditedDisplayName(e.target.value)}
                          placeholder="未設定の場合はアカウント名が表示されます"
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                            validationErrors.displayName ? 'border-red-300' : ''
                          }`}
                        />
                        {validationErrors.displayName && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors.displayName}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          任意。日本語や特殊文字も使用可能（50文字以内）
                        </p>
                      </div>

                      {/* Email Field */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700"
                        >
                          メールアドレス <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                            validationErrors.email ? 'border-red-300' : ''
                          }`}
                        />
                        {validationErrors.email && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors.email}
                          </p>
                        )}
                      </div>

                      {/* Role Field */}
                      <div>
                        <label
                          htmlFor="role"
                          className="block text-sm font-medium text-gray-700"
                        >
                          役割
                        </label>
                        <select
                          id="role"
                          value={editedRole}
                          onChange={(e) => setEditedRole(e.target.value as UserRole)}
                          disabled={!canEditRole}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                            !canEditRole ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="reader">読者</option>
                          <option value="creator">クリエイター</option>
                          <option value="admin">管理者</option>
                        </select>
                        {!canEditRole && (
                          <p className="mt-1 text-xs text-gray-500">
                            役割の変更には管理者権限が必要です
                          </p>
                        )}
                      </div>
                    </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={saving}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          キャンセル
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? '保存中...' : '保存'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SmartFormat Feed Section */}
                  {profile.feed_enabled && (
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        あなたのSmartFormatフィード
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">フィードURL</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-500 font-mono break-all flex-1">
                              {`https://arawata-cms.vercel.app/api/feed/${profile.username}.xml`}
                            </p>
                            <button
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(`https://arawata-cms.vercel.app/api/feed/${profile.username}.xml`);
                                  alert('URLをコピーしました！');
                                } catch (error) {
                                  console.error('Failed to copy:', error);
                                }
                              }}
                              className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                            >
                              コピー
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3 border-t border-gray-200 pt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">フィードタイトル</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {profile.feed_title || `${profile.display_name || profile.username} - Media Tech Compass`}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">フィード説明</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {profile.feed_description || `${profile.display_name || profile.username}の記事`}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 pt-2">
                            ※ フィードの設定を変更したい場合は、管理者にお問い合わせください
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Quick Actions */}
                {(profile.role === 'admin' || profile.role === 'creator') && (
                  <div className="lg:col-span-1">
                    <div className="space-y-4">
                      {/* 記事一覧 Card */}
                      <Link
                        href="/dashboard/posts"
                        className="flex items-center justify-center px-6 py-8 border-2 border-gray-200 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all"
                      >
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-lg font-semibold">記事一覧</span>
                        </div>
                      </Link>

                      {/* 新規投稿作成 Card */}
                      <Link
                        href="/dashboard/posts/new"
                        className="flex items-center justify-center px-6 py-8 border-2 border-indigo-200 rounded-lg shadow-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 transition-all"
                      >
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-lg font-semibold">新規投稿作成</span>
                        </div>
                      </Link>

                      {/* ニュースレター管理 Card */}
                      <Link
                        href="/dashboard/newsletter"
                        className="flex items-center justify-center px-6 py-8 border-2 border-purple-200 rounded-lg shadow-sm text-purple-600 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-all"
                      >
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-lg font-semibold">ニュースレター管理</span>
                        </div>
                      </Link>

                      {/* SmartFormatフィード管理 Card (admin only) */}
                      {profile.role === 'admin' && (
                        <Link
                          href="/dashboard/admin/rss-feeds"
                          className="flex items-center justify-center px-6 py-8 border-2 border-green-200 rounded-lg shadow-sm text-green-600 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all"
                        >
                          <div className="text-center">
                            <svg className="mx-auto h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                            <span className="text-lg font-semibold">SmartFormatフィード管理</span>
                          </div>
                        </Link>
                      )}

                      {/* Layer2管理 Card (Layer1 users only) */}
                      {!profile.parent_id && (
                        <Link
                          href="/dashboard/child-accounts"
                          className="flex items-center justify-center px-6 py-8 border-2 border-blue-200 rounded-lg shadow-sm text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all"
                        >
                          <div className="text-center">
                            <svg className="mx-auto h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-lg font-semibold">Layer2（子アカウント）管理</span>
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
