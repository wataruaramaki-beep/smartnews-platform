'use client';

import { useState } from 'react';

interface DeliveryHistoryPanelProps {
  deliveries: any[];
  onRefresh: () => Promise<void>;
}

export function DeliveryHistoryPanel({ deliveries, onRefresh }: DeliveryHistoryPanelProps) {
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);

  const toggleExpand = (deliveryId: string) => {
    setExpandedDelivery(expandedDelivery === deliveryId ? null : deliveryId);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      sending: { bg: 'bg-blue-100', text: 'text-blue-800', label: '送信中' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: '完了' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: '失敗' },
    };

    const badge = badges[status] || badges.sending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">配信履歴</h2>
        <button
          onClick={onRefresh}
          className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
        >
          更新
        </button>
      </div>

      <div className="overflow-x-auto">
        {deliveries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">配信履歴がありません</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  送信日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  件名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  記事数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  購読者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  成功/失敗
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  詳細
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveries.map((delivery) => (
                <>
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(delivery.sent_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{delivery.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {delivery.post_ids.length}件
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {delivery.subscriber_count}人
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="text-green-600 font-medium">{delivery.sent_count}</span>
                      {' / '}
                      <span className="text-red-600 font-medium">{delivery.failed_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(delivery.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleExpand(delivery.id)}
                        className="text-indigo-600 hover:text-indigo-500 font-medium"
                      >
                        {expandedDelivery === delivery.id ? '閉じる' : '詳細'}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Details */}
                  {expandedDelivery === delivery.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-3">
                          {/* Posts */}
                          {delivery.posts && delivery.posts.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">
                                送信した記事:
                              </h4>
                              <ul className="list-disc list-inside space-y-1">
                                {delivery.posts.map((post: any) => (
                                  <li key={post.id} className="text-sm text-gray-700">
                                    {post.title}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Error Message */}
                          {delivery.error_message && (
                            <div>
                              <h4 className="text-sm font-medium text-red-900 mb-2">
                                エラー:
                              </h4>
                              <pre className="text-xs text-red-700 bg-red-50 p-2 rounded overflow-x-auto">
                                {delivery.error_message}
                              </pre>
                            </div>
                          )}

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-4 pt-2">
                            <div>
                              <div className="text-xs text-gray-500">送信対象</div>
                              <div className="text-sm font-medium text-gray-900">
                                {delivery.subscriber_count}人
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">送信成功</div>
                              <div className="text-sm font-medium text-green-600">
                                {delivery.sent_count}人
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">送信失敗</div>
                              <div className="text-sm font-medium text-red-600">
                                {delivery.failed_count}人
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deliveries.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-500">
          {deliveries.length}件の配信履歴
        </div>
      )}
    </div>
  );
}
