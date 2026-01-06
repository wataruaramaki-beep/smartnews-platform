'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageChange: (url: string | null, path: string | null) => void;
  label?: string;
  required?: boolean;
}

export default function ImageUpload({
  currentImageUrl,
  onImageChange,
  label = '画像',
  required = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // クライアント側検証
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setUploadError('ファイルサイズが5MBを超えています');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('JPEG、PNG、WebP、GIF形式の画像のみアップロード可能です');
      return;
    }

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // アップロード処理
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/posts/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '画像のアップロードに失敗しました');
      }

      setImagePath(data.path);
      onImageChange(data.url, data.path);
    } catch (error: any) {
      setUploadError(error.message || '画像のアップロードに失敗しました');
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!imagePath) {
      // 新規アップロード前の場合、プレビューのみクリア
      setPreviewUrl(null);
      onImageChange(null, null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);
    try {
      const response = await fetch('/api/posts/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: imagePath }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '画像の削除に失敗しました');
      }

      setPreviewUrl(null);
      setImagePath(null);
      onImageChange(null, null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setUploadError(error.message || '画像の削除に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {previewUrl ? (
        <div className="space-y-3">
          <div className="relative w-full h-48 border border-gray-300 rounded-md overflow-hidden">
            <Image
              src={previewUrl}
              alt="プレビュー"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
            >
              🗑️ 削除
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              📁 別の画像を選択
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex justify-center items-center px-4 py-12 border-2 border-gray-300 border-dashed rounded-md text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50"
          >
            📁 画像を選択
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploading && (
        <p className="mt-2 text-sm text-gray-600">アップロード中...</p>
      )}

      {uploadError && (
        <p className="mt-2 text-sm text-red-600">{uploadError}</p>
      )}

      <p className="mt-2 text-sm text-gray-500">
        推奨サイズ: 1200x630px • 最大5MB • JPEG/PNG/WebP/GIF
      </p>
    </div>
  );
}
