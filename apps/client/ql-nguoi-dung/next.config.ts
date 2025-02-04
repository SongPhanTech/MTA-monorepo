import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    /* config options here */
    reactStrictMode: true,
    transpilePackages: ['@workspace/db', '@workspace/router', '@workspace/ui'],
    output: 'standalone',
    crossOrigin: 'anonymous',
}

export default nextConfig
