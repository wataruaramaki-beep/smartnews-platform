import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'マイページ｜Media Tech Compass',
  description: 'ユーザーダッシュボード',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
