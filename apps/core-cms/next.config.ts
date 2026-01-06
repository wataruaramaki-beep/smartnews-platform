import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@smartnews/database', '@smartnews/ui'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'thhvsrkaiwutxjvdopzc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/post-images/**',
      },
      {
        protocol: 'https',
        hostname: 'thhvsrkaiwutxjvdopzc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/avatars/**',
      },
    ],
  },
  env: {
    // Public site URL
    // Vercel: 自動的に https://arawata-cms.vercel.app
    // ローカル: http://localhost:3000
    NEXT_PUBLIC_SITE_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
}

export default nextConfig
