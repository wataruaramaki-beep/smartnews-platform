'use client';

import { useState, useEffect } from 'react';

interface NewsletterSettingsPanelProps {
  settings: any;
  onUpdate: (settings: any) => Promise<boolean>;
}

export function NewsletterSettingsPanel({ settings, onUpdate }: NewsletterSettingsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [sendMode, setSendMode] = useState('digest');
  const [frequency, setFrequency] = useState('weekly');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');

  useEffect(() => {
    if (settings) {
      setEnabled(settings.newsletter_enabled || false);
      setSendMode(settings.newsletter_send_mode || 'digest');
      setFrequency(settings.newsletter_frequency || 'weekly');
      setTitle(settings.newsletter_title || '');
      setDescription(settings.newsletter_description || '');
      setFromName(settings.newsletter_from_name || '');
      setFromEmail(settings.newsletter_from_email || '');
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const success = await onUpdate({
        newsletter_enabled: enabled,
        newsletter_send_mode: sendMode,
        newsletter_frequency: frequency,
        newsletter_title: title,
        newsletter_description: description,
        newsletter_from_name: fromName,
        newsletter_from_email: fromEmail,
      });

      if (success) {
        setMessage({ type: 'success', text: '設定を保存しました' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: '設定の保存に失敗しました' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '設定の保存に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (settings) {
      setEnabled(settings.newsletter_enabled || false);
      setSendMode(settings.newsletter_send_mode || 'digest');
      setFrequency(settings.newsletter_frequency || 'weekly');
      setTitle(settings.newsletter_title || '');
      setDescription(settings.newsletter_description || '');
      setFromName(settings.newsletter_from_name || '');
      setFromEmail(settings.newsletter_from_email || '');
    }
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">ニュースレター設定</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            編集
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">
              ニュースレター機能
            </label>
            <p className="text-sm text-gray-500">
              ニュースレターの配信を有効にします
            </p>
          </div>
          <button
            type="button"
            disabled={!isEditing}
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-indigo-600' : 'bg-gray-200'
            } ${!isEditing && 'opacity-50 cursor-not-allowed'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Send Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            送信モード
          </label>
          <div className="space-y-2">
            <label className="flex items-start">
              <input
                type="radio"
                value="immediate"
                checked={sendMode === 'immediate'}
                onChange={(e) => setSendMode(e.target.value)}
                disabled={!isEditing}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">即座に送信</span>
                <p className="text-sm text-gray-500">記事を公開すると同時にニュースレターを送信します</p>
              </div>
            </label>
            <label className="flex items-start">
              <input
                type="radio"
                value="digest"
                checked={sendMode === 'digest'}
                onChange={(e) => setSendMode(e.target.value)}
                disabled={!isEditing}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">ダイジェスト送信</span>
                <p className="text-sm text-gray-500">設定した頻度で複数の記事をまとめて送信します</p>
              </div>
            </label>
          </div>
        </div>

        {/* Frequency (only for digest mode) */}
        {sendMode === 'digest' && (
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-900 mb-2">
              配信頻度
            </label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="daily">毎日</option>
              <option value="weekly">毎週</option>
              <option value="monthly">毎月</option>
            </select>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
            ニュースレタータイトル
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isEditing}
            placeholder="例: Tech Newsダイジェスト"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-gray-500">
            空欄の場合、ユーザー名が使用されます
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
            説明
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isEditing}
            rows={3}
            placeholder="ニュースレターの説明を入力してください"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* From Name */}
        <div>
          <label htmlFor="fromName" className="block text-sm font-medium text-gray-900 mb-2">
            送信者名（オプション）
          </label>
          <input
            type="text"
            id="fromName"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            disabled={!isEditing}
            placeholder="例: Tech News 編集部"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* From Email */}
        <div>
          <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-900 mb-2">
            送信元メールアドレス（オプション）
          </label>
          <input
            type="email"
            id="fromEmail"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            disabled={!isEditing}
            placeholder="例: newsletter@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-gray-500">
            Resendで認証されたドメインのメールアドレスを使用してください
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-3 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Buttons */}
        {isEditing && (
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              キャンセル
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
