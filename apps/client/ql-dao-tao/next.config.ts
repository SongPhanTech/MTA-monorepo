import type { NextConfig } from 'next'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || ''
const nextConfig: NextConfig = {
    basePath,
    assetPrefix,
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
