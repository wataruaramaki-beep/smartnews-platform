'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { EditorWithPreview } from './EditorWithPreview';

interface AutoSaveEditorProps {
  postId?: string;
  initialContent: any;
  initialTitle: string;
  initialSlug: string;
  initialThumbnailUrl: string | null;
  initialGenre: string | null;
  initialTags: string[];
  initialStatus: 'draft' | 'published' | 'scheduled';
  initialPublishedAt: string | null;
  initialSeoTitle: string | null;
  initialSeoDescription: string | null;
  initialSeoImageUrl: string | null;
  placeholder?: string;
  onSave?: () => void;
}

type SaveStatus = 'saved' | 'saving' | 'error' | 'idle';

export function AutoSaveEditor({
  postId,
  initialContent,
  initialTitle,
  initialSlug,
  initialThumbnailUrl,
  initialGenre,
  initialTags,
  initialStatus,
  initialPublishedAt,
  initialSeoTitle,
  initialSeoDescription,
  initialSeoImageUrl,
  placeholder,
  onSave,
}: AutoSaveEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveCountRef = useRef(0);

  const performAutoSave = useCallback(async () => {
    if (!postId) return; // 新規投稿の場合は自動保存しない

    setSaveStatus('saving');

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: initialTitle,
          slug: initialSlug,
          content,
          thumbnail_url: initialThumbnailUrl,
          genre: initialGenre,
          tags: initialTags,
          status: initialStatus,
          published_at: initialPublishedAt,
          seo_title: initialSeoTitle,
          seo_description: initialSeoDescription,
          seo_image_url: initialSeoImageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('自動保存に失敗しました');
      }

      setSaveStatus('saved');
      setLastSaved(new Date());
      saveCountRef.current += 1;

      if (onSave) {
        onSave();
      }

      // 2秒後に "saved" を "idle" に戻す
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('自動保存エラー:', error);
      setSaveStatus('error');

      // 5秒後に "error" を "idle" に戻す
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    }
  }, [
    postId,
    content,
    initialTitle,
    initialSlug,
    initialThumbnailUrl,
    initialGenre,
    initialTags,
    initialStatus,
    initialPublishedAt,
    initialSeoTitle,
    initialSeoDescription,
    initialSeoImageUrl,
    onSave,
  ]);

  useEffect(() => {
    // コンテンツが変更されたら、30秒後に自動保存
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (postId) {
      timeoutRef.current = setTimeout(() => {
        performAutoSave();
      }, 30000); // 30秒
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, postId, performAutoSave]);

  const formatLastSaved = () => {
    if (!lastSaved) return null;

    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000); // 秒数

    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;

    return lastSaved.toLocaleString('ja-JP');
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return '保存中...';
      case 'saved':
        return '保存完了';
      case 'error':
        return '保存失敗';
      default:
        return '';
    }
  };

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-blue-600';
      case 'saved':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Auto-save Status */}
      {postId && (
        <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${getSaveStatusColor()}`}>
              {getSaveStatusText()}
            </span>
            {lastSaved && saveStatus === 'idle' && (
              <span className="text-sm text-gray-500">
                最終保存: {formatLastSaved()}
              </span>
            )}
          </div>
          {saveStatus === 'saving' && (
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          )}
          {saveStatus === 'saved' && (
            <span className="text-green-600">✓</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600">✗</span>
          )}
        </div>
      )}

      {/* Editor with Preview */}
      <EditorWithPreview
        content={content}
        onChange={setContent}
        placeholder={placeholder}
      />
    </div>
  );
}
