import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@smartnews/database', '@smartnews/ui'],
};

export default nextConfig;
