import type { NextConfig } from 'next'
import TerserPlugin from 'terser-webpack-plugin'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const nextConfig: NextConfig = {
    basePath,
    assetPrefix: 'https://mta.swantech.vn/lms/cdn',
    /* config options here */
    reactStrictMode: true,
    transpilePackages: [
        '@t3-oss/env-nextjs',
        '@t3-oss/env-core',
        '@workspace/db',
        '@workspace/router',
        '@workspace/ui',
    ],
    images: {
        unoptimized: true,
    },
    output: 'export',
    crossOrigin: 'anonymous',
    webpack: (config) => {
        config.optimization.minimize = true
        config.optimization.minimizer = [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    keep_fnames: true,
                },
                extractComments: false,
            }),
        ]
        return {
            ...config,
        }
    },
}

export default nextConfig
