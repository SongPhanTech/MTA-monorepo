import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    /* config options here */
    reactStrictMode: true,
    transpilePackages: [
        '@t3-oss/env-nextjs',
        '@t3-oss/env-core',
        '@workspace/db/client',
        '@workspace/router',
        '@workspace/ui',
    ],
    images: {
        unoptimized: true,
    },
    output: 'export',
    crossOrigin: 'anonymous',
}

export default nextConfig
