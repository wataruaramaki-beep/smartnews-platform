'use client';

import { useState } from 'react';

interface SubscribersPanelProps {
  subscribers: any[];
  onRefresh: () => Promise<void>;
}

export function SubscribersPanel({ subscribers, onRefresh }: SubscribersPanelProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubscribers = subscribers.filter(subscriber => {
    // Status filter
    if (statusFilter !== 'all' && subscriber.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery && !subscriber.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'アクティブ' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '保留中' },
      unsubscribed: { bg: 'bg-gray-100', text: 'text-gray-800', label: '購読解除' },
      bounced: { bg: 'bg-red-100', text: 'text-red-800', label: 'エラー' },
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">購読者管理</h2>
          <button
            onClick={onRefresh}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            更新
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <label htmlFor="statusFilter" className="sr-only">
              ステータスでフィルター
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">すべて ({subscribers.length})</option>
              <option value="active">
                アクティブ ({subscribers.filter(s => s.status === 'active').length})
              </option>
              <option value="pending">
                保留中 ({subscribers.filter(s => s.status === 'pending').length})
              </option>
              <option value="unsubscribed">
                購読解除 ({subscribers.filter(s => s.status === 'unsubscribed').length})
              </option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              メールアドレスで検索
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="メールアドレスで検索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredSubscribers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? '条件に一致する購読者がいません'
                : '購読者がまだいません'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メールアドレス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  購読日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  確認日
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{subscriber.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(subscriber.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(subscriber.subscribed_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subscriber.verified_at
                      ? new Date(subscriber.verified_at).toLocaleDateString('ja-JP')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredSubscribers.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-500">
          {filteredSubscribers.length}件の購読者を表示中
        </div>
      )}
    </div>
  );
}
