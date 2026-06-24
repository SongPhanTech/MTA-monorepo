import type { NextConfig } from "next"

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || ""
const isDev = process.env.NODE_ENV === "development"

const cdnPath = assetPrefix.startsWith(basePath) ? assetPrefix.slice(basePath.length) : assetPrefix
const nextConfig: NextConfig = {
  basePath,
  assetPrefix,
  /* config options here */
  ...(isDev && cdnPath
    ? {
        async rewrites() {
          return [
            { source: `${cdnPath}/fonts/:path*`, destination: "/fonts/:path*" },
            { source: `${cdnPath}/mta-components.css`, destination: "/mta-components.css" },
            { source: `${cdnPath}/mta-components.umd.js`, destination: "/mta-components.umd.js" },
          ]
        },
      }
    : {}),
  reactStrictMode: true,
  transpilePackages: [
    "@t3-oss/env-nextjs",
    "@t3-oss/env-core",
    "@workspace/db/client",
    "@workspace/router",
    "@workspace/ui",
  ],
  images: {
    unoptimized: true,
  },
  output: "export",
  crossOrigin: "anonymous",
}

export default nextConfig
