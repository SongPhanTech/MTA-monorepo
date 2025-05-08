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
        return {
            ...config,
            optimization: {
                minimize: true,
                minimizer: [
                    new TerserPlugin({
                        terserOptions: {
                            keep_classnames: true,
                            keep_fnames: true,
                        },
                    }),
                ],
            },
        }
    },
}

export default nextConfig
