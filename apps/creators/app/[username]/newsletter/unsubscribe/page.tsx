'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function NewsletterUnsubscribePage() {
  const params = useParams();
  const username = params.username as string;

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

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
      setMessage('購読を解除しました。');
      setEmail('');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || '購読解除に失敗しました');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            ニュースレターの購読解除
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {username} のニュースレターから購読解除します
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
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
            <p className="mt-4 text-gray-600">{message}</p>
            <div className="mt-6">
              <Link
                href={`/${username}`}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                {username} のページに戻る
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="メールアドレス"
              />
            </div>

            {status === 'error' && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{message}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? '処理中...' : '購読解除'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href={`/${username}`}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                キャンセル
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
