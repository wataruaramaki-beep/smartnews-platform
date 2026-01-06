import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Media Tech Compass',
    template: '%s | Media Tech Compass',
  },
  description: 'テクノロジーとビジネスの最新情報',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
