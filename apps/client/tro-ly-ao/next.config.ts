import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    /* config options here */
    reactStrictMode: true,
    transpilePackages: [
        '@t3-oss/env-nextjs',
        '@t3-oss/env-core',
        '@workspace/db',
        '@workspace/router',
        '@workspace/ui',
    ],
    output: 'standalone',
    crossOrigin: 'anonymous',
}

export default nextConfig
