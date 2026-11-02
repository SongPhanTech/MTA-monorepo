import type { NextConfig } from "next"
import { config as loadDotenv } from "dotenv"

loadDotenv({
  path: process.env.NODE_ENV === "development" ? ".env.develop" : ".env.prod",
})

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || ""
const nextConfig: NextConfig = {
  basePath,
  assetPrefix,
  /* config options here */
  reactStrictMode: true,
  transpilePackages: [
    "@t3-oss/env-nextjs",
    "@t3-oss/env-core",
    "@workspace/db",
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
