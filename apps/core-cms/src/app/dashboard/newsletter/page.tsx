'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createBrowserClient as createClient } from '@smartnews/database';
import { NewsletterSettingsPanel } from '@/components/newsletter/NewsletterSettingsPanel';
import { ManualSendPanel } from '@/components/newsletter/ManualSendPanel';
import { SubscribersPanel } from '@/components/newsletter/SubscribersPanel';
import { DeliveryHistoryPanel } from '@/components/newsletter/DeliveryHistoryPanel';

export default function NewsletterPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [unsentPosts, setUnsentPosts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    if (profile && ['admin', 'creator'].includes(profile.role)) {
      fetchAllData();
    }
  }, [profile]);

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      await Promise.all([
        fetchSettings(),
        fetchSubscribers(),
        fetchDeliveries(),
        fetchUnsentPosts(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/newsletter/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/newsletter/subscribers');
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const response = await fetch('/api/newsletter/deliveries');
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  const fetchUnsentPosts = async () => {
    try {
      if (!profile?.id) return;

      const supabase = createClient();
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', profile.id)
        .eq('status', 'published')
        .is('newsletter_sent_at', null)
        .is('deleted_at', null)
        .contains('distribution_channels', { newsletter: true })
        .order('published_at', { ascending: false })
        .limit(20);

      setUnsentPosts(posts || []);
    } catch (error) {
      console.error('Error fetching unsent posts:', error);
    }
  };

  const handleUpdateSettings = async (newSettings: any) => {
    try {
      const response = await fetch('/api/newsletter/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        await fetchSettings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  const handleManualSend = async (postIds: string[]) => {
    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: profile?.id,
          postIds,
          manual: true,
        }),
      });

      if (response.ok) {
        await Promise.all([fetchDeliveries(), fetchUnsentPosts()]);
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error('Error sending newsletter:', error);
      return { success: false, error: error.message };
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!profile || !['admin', 'creator'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">アクセスが拒否されました</h2>
          <p className="text-gray-600 mb-4">この機能にアクセスする権限がありません</p>
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
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
                onClick={signOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ニュースレター管理</h1>
          <p className="text-gray-600">購読者へ記事を配信し、ニュースレターの設定を管理します</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">総購読者数</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">アクティブ</div>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">保留中</div>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">未送信記事</div>
              <div className="text-3xl font-bold text-indigo-600">{unsentPosts.length}</div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        <div className="mb-8">
          <NewsletterSettingsPanel
            settings={settings}
            onUpdate={handleUpdateSettings}
          />
        </div>

        {/* Manual Send Panel */}
        {settings?.newsletter_enabled && unsentPosts.length > 0 && (
          <div className="mb-8">
            <ManualSendPanel
              unsentPosts={unsentPosts}
              onSend={handleManualSend}
            />
          </div>
        )}

        {/* Subscribers Panel */}
        <div className="mb-8">
          <SubscribersPanel
            subscribers={subscribers}
            onRefresh={fetchSubscribers}
          />
        </div>

        {/* Delivery History Panel */}
        <div className="mb-8">
          <DeliveryHistoryPanel
            deliveries={deliveries}
            onRefresh={fetchDeliveries}
          />
        </div>
      </main>
    </div>
  );
}
