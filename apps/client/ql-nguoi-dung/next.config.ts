import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    /* config options here */
    reactStrictMode: true,
    transpilePackages: ['@workspace/db', '@workspace/router', '@workspace/ui'],
}

export default nextConfig
