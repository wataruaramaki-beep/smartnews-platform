import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'マイページ｜SmartNews Core',
  description: 'ユーザーダッシュボード',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
