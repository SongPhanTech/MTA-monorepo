import type { NextConfig } from 'next'
import TerserPlugin from 'terser-webpack-plugin'

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
        return config
    },
}

export default nextConfig
