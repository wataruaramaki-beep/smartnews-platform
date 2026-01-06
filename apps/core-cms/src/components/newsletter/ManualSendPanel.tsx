'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ManualSendPanelProps {
  unsentPosts: any[];
  onSend: (postIds: string[]) => Promise<{ success: boolean; error?: string }>;
}

export function ManualSendPanel({ unsentPosts, onSend }: ManualSendPanelProps) {
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTogglePost = (postId: string) => {
    setSelectedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === unsentPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(unsentPosts.map(post => post.id));
    }
  };

  const handleSend = async () => {
    if (selectedPosts.length === 0) {
      setMessage({ type: 'error', text: '送信する記事を選択してください' });
      return;
    }

    if (!confirm(`選択した${selectedPosts.length}件の記事をニュースレターとして送信しますか？`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await onSend(selectedPosts);

      if (result.success) {
        setMessage({ type: 'success', text: 'ニュースレターを送信しました' });
        setSelectedPosts([]);
      } else {
        setMessage({ type: 'error', text: result.error || '送信に失敗しました' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '送信に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  if (unsentPosts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">手動送信</h2>
        <div className="text-center py-8">
          <p className="text-gray-600">送信可能な記事がありません</p>
          <p className="text-sm text-gray-500 mt-2">公開済みの記事はすべて送信済みです</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">手動送信</h2>
        <p className="text-sm text-gray-600 mt-1">
          記事を選択してニュースレターとして送信します
        </p>
      </div>

      <div className="p-6">
        {/* Select All */}
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedPosts.length === unsentPosts.length && unsentPosts.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              すべて選択 ({selectedPosts.length}/{unsentPosts.length})
            </span>
          </label>
        </div>

        {/* Posts List */}
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {unsentPosts.map((post) => (
            <label
              key={post.id}
              className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedPosts.includes(post.id)}
                onChange={() => handleTogglePost(post.id)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{post.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {post.genre && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          {post.genre}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(post.published_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/posts/${post.id}/edit`}
                    className="text-xs text-indigo-600 hover:text-indigo-500 ml-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    編集
                  </Link>
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-3 rounded-md mb-4 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={loading || selectedPosts.length === 0}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '送信中...' : `選択した記事を送信 (${selectedPosts.length}件)`}
        </button>
      </div>
    </div>
  );
}
