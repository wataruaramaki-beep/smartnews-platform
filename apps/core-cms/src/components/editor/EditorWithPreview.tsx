'use client';

import { useState } from 'react';
import { TiptapEditor } from './TiptapEditor';
import { TiptapRenderer } from '../public/TiptapRenderer';

interface EditorWithPreviewProps {
  content: any;
  onChange: (content: any) => void;
  placeholder?: string;
  title?: string;
  thumbnailUrl?: string | null;
  authorName?: string;
  publishedAt?: string;
}

type ViewMode = 'edit' | 'preview';

export function EditorWithPreview({
  content,
  onChange,
  placeholder,
  title = '（タイトル未設定）',
  thumbnailUrl,
  authorName = '執筆者',
  publishedAt
}: EditorWithPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [previewContent, setPreviewContent] = useState(content);

  const handleChange = (newContent: any) => {
    setPreviewContent(newContent);
    onChange(newContent);
  };

  const ViewModeButton = ({ mode, label }: { mode: ViewMode; label: string }) => (
    <button
      type="button"
      onClick={() => setViewMode(mode)}
      className={`px-4 py-2 text-sm font-medium rounded-md ${
        viewMode === mode
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  // Format published date
  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString('ja-JP');
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  return (
    <div className="space-y-4">
      {/* View Mode Selector */}
      <div className="flex gap-2">
        <ViewModeButton mode="edit" label="編集" />
        <ViewModeButton mode="preview" label="プレビュー" />
      </div>

      {/* Editor and Preview */}
      <div>
        {/* Editor */}
        {viewMode === 'edit' && (
          <div className="space-y-2">
            <TiptapEditor
              content={content}
              onChange={handleChange}
              placeholder={placeholder}
            />
          </div>
        )}

        {/* SmartNews Preview */}
        {viewMode === 'preview' && (
          <div className="space-y-2">
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg max-w-md mx-auto">
              {/* SmartNews App Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">S</span>
                  </div>
                  <span className="text-white font-semibold text-sm">SmartNews</span>
                </div>
                <div className="text-white text-xs opacity-75">プレビュー</div>
              </div>

              {/* Article Content */}
              <div className="bg-white">
                {/* Thumbnail */}
                {thumbnailUrl && (
                  <div className="w-full aspect-video bg-gray-200 overflow-hidden">
                    <img
                      src={thumbnailUrl}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Article Header */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                    {title}
                  </h1>
                  <div className="flex items-center text-xs text-gray-500 space-x-3">
                    <span>{authorName}</span>
                    <span>•</span>
                    <span>{formatDate(publishedAt)}</span>
                  </div>
                </div>

                {/* Article Body */}
                <div className="px-4 py-4 min-h-[300px]">
                  <div className="prose prose-sm max-w-none">
                    <TiptapRenderer content={previewContent} />
                  </div>
                </div>

                {/* SmartNews App Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Media Tech Compass</span>
                    <span>SmartFormat 経由</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
