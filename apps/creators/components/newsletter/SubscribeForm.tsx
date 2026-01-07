'use client';

import { useState } from 'react';

interface SubscribeFormProps {
  authorUsername: string;
  authorName: string;
}

export function SubscribeForm({ authorUsername, authorName }: SubscribeFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          authorUsername,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '購読に失敗しました');
      }

      setMessage({
        type: 'success',
        text: '確認メールを送信しました。メールをご確認ください。',
      });
      setEmail('');
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || '購読に失敗しました',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        ニュースレターを購読
      </h3>
      <p className="text-gray-600 mb-4">
        {authorName} の最新記事をメールで受け取る
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            required
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '送信中...' : '購読する'}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-3 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500">
        購読すると、{authorName} からニュースレターが届きます。いつでも購読解除できます。
      </p>
    </div>
  );
}
