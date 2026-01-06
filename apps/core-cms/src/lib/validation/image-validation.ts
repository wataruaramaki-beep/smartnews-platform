import sharp from 'sharp';

// 許可される画像タイプ
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

// ファイルサイズ制限
export const IMAGE_SIZE_LIMITS = {
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    minSize: 100, // 100バイト
  },
  postImage: {
    maxSize: 5 * 1024 * 1024, // 5MB
    minSize: 100, // 100バイト
  },
};

// 画像寸法制限
export const MAX_IMAGE_DIMENSIONS = {
  width: 4000,
  height: 4000,
};

// アスペクト比の制限
export const ASPECT_RATIO_LIMITS = {
  min: 0.1, // 1:10 (極端に細い画像)
  max: 10,  // 10:1 (極端に横長の画像)
};

/**
 * ファイルのマジックナンバーをチェックして、実際の画像タイプを検証
 */
export function isValidImageType(bytes: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return true;
  }
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return true;
  }
  // WebP: 52 49 46 46 (RIFF)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    // WebPはRIFFコンテナなので、8バイト目以降で"WEBP"を確認
    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return true;
    }
  }
  // GIF: 47 49 46 38 (GIF8)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return true;
  }
  return false;
}

/**
 * ファイル拡張子を検証
 */
export function validateFileExtension(filename: string): { valid: boolean; extension: string | null } {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, extension: ext || null };
  }

  return { valid: true, extension: ext };
}

/**
 * 画像ファイルを検証する総合関数
 */
export async function validateImageFile(
  file: File,
  type: 'avatar' | 'postImage' = 'postImage'
): Promise<{ valid: boolean; error?: string; metadata?: any }> {
  // 1. MIMEタイプのチェック
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: '画像ファイル（JPEG、PNG、WebP、GIF）のみ許可されています',
    };
  }

  // 2. ファイルサイズのチェック
  const sizeLimit = IMAGE_SIZE_LIMITS[type];
  if (file.size < sizeLimit.minSize || file.size > sizeLimit.maxSize) {
    return {
      valid: false,
      error: `ファイルサイズは${sizeLimit.minSize}バイトから${sizeLimit.maxSize / 1024 / 1024}MBの間である必要があります`,
    };
  }

  // 3. 拡張子のチェック
  const { valid: extValid, extension } = validateFileExtension(file.name);
  if (!extValid) {
    return {
      valid: false,
      error: '許可されていないファイル拡張子です',
    };
  }

  // 4. バイナリデータを取得
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // 5. マジックナンバーのチェック（実際のファイルタイプを検証）
  if (!isValidImageType(bytes)) {
    return {
      valid: false,
      error: '無効な画像ファイルです。ファイルが破損しているか、画像ファイルではありません',
    };
  }

  // 6. sharpで画像として読み込めるか検証 + メタデータ取得
  let metadata;
  try {
    const image = sharp(Buffer.from(buffer));
    metadata = await image.metadata();
  } catch (error) {
    return {
      valid: false,
      error: '画像ファイルとして処理できません。ファイルが破損している可能性があります',
    };
  }

  // 7. 画像サイズ（寸法）のチェック
  if (!metadata.width || !metadata.height) {
    return {
      valid: false,
      error: '画像の寸法を取得できません',
    };
  }

  if (metadata.width > MAX_IMAGE_DIMENSIONS.width || metadata.height > MAX_IMAGE_DIMENSIONS.height) {
    return {
      valid: false,
      error: `画像サイズは${MAX_IMAGE_DIMENSIONS.width}x${MAX_IMAGE_DIMENSIONS.height}px以下にしてください（現在: ${metadata.width}x${metadata.height}px）`,
    };
  }

  // 8. アスペクト比のチェック
  const aspectRatio = metadata.width / metadata.height;
  if (aspectRatio < ASPECT_RATIO_LIMITS.min || aspectRatio > ASPECT_RATIO_LIMITS.max) {
    return {
      valid: false,
      error: '画像のアスペクト比が不正です。極端に細長いまたは横長の画像はアップロードできません',
    };
  }

  // すべての検証に合格
  return {
    valid: true,
    metadata: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: file.size,
      extension,
    },
  };
}

/**
 * 安全なファイル名を生成
 */
export function generateSafeFilename(userId: string, extension: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${userId}/${timestamp}-${randomStr}.${extension}`;
}
