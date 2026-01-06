import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartNews for Creators',
  description: 'SmartNews for Creators - Share your stories',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
