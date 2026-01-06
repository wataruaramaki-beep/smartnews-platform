import { Resend } from 'resend';

// Resendクライアントはビルド時ではなく実行時に初期化
// 開発環境ではダミーキーを使用してビルドを通す
const apiKey = process.env.RESEND_API_KEY || 'dummy-key-for-build';
export const resend = new Resend(apiKey);

// デフォルトの送信元アドレス（開発環境用）
export const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev';
export const DEFAULT_FROM_NAME = 'Media Tech Compass';

// 実際にメール送信する際にAPIキーをチェックするヘルパー関数
export function validateResendConfig() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not defined in environment variables');
  }
}
