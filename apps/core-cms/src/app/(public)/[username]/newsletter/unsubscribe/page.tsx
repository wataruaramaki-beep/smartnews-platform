'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function NewsletterUnsubscribePage() {
  const params = useParams();
  const username = params.username as string;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          authorUsername: username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '購読解除に失敗しました');
      }

      setStatus('success');
      setMessage('購読を解除しました');
      setEmail('');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || '購読解除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ニュースレター購読解除
          </h2>
          <p className="text-gray-600">
            {username} のニュースレターを購読解除します
          </p>
        </div>

        {status === 'idle' || status === 'error' ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                登録したメールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="your@email.com"
              />
            </div>

            {status === 'error' && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '処理中...' : '購読を解除'}
            </button>

            <div className="text-center">
              <Link
                href={`/${username}`}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                キャンセル
              </Link>
            </div>
          </form>
        ) : (
          <div className="text-center mt-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              購読を解除しました
            </h3>
            <p className="text-gray-600 mb-6">
              今後、ニュースレターは配信されません。
            </p>
            <Link
              href={`/${username}`}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              {username} のページに戻る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
