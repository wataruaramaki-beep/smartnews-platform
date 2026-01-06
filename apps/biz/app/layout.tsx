import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartNews Biz',
  description: 'SmartNews Biz - PR content platform',
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
