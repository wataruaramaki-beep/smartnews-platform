'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';

export default function NewsletterConfirmPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const token = searchParams.get('token');
  const username = params.username as string;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('無効なリンクです');
      return;
    }

    const confirmSubscription = async () => {
      try {
        const response = await fetch('/api/newsletter/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '確認に失敗しました');
        }

        setStatus('success');
        setMessage('購読が確認されました！ニュースレターの配信が開始されます。');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || '確認に失敗しました');
      }
    };

    confirmSubscription();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                確認中...
              </h2>
            </>
          )}

          {status === 'success' && (
            <>
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
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                購読が確認されました
              </h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6">
                <Link
                  href={`/${username}`}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  {username} のページに戻る
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                確認に失敗しました
              </h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6">
                <Link
                  href={`/${username}`}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  {username} のページに戻る
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
