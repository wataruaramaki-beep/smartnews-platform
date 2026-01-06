import Link from 'next/link';
import Image from 'next/image';
import { createPublicClient } from '@smartnews/database/server';

export async function Header() {
  const supabase = await createPublicClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-center items-center h-32">
          <Link
            href="/"
            className="block hover:opacity-80 transition-opacity"
          >
            <Image
              src="/sncore_logo.png"
              alt="SNCompass"
              width={450}
              height={100}
              priority
              style={{ height: '100px', width: 'auto' }}
            />
          </Link>

          <div className="absolute right-0 flex items-center">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-3 py-1 text-xs sm:px-6 sm:py-2 sm:text-sm font-medium rounded-md text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
              >
                ダッシュボード
              </Link>
            ) : (
              <div className="flex flex-col space-y-1.5 sm:space-y-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-3 py-1 text-xs sm:px-6 sm:py-2 sm:text-sm font-medium rounded-md text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                >
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-3 py-1 text-xs sm:px-6 sm:py-2 sm:text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                >
                  新規登録
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
