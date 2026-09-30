#!/usr/bin/env node
/**
 * Tải toàn bộ prefix tai-lieu/ từ MinIO bucket mta, rồi đóng zip.
 *
 * Usage:
 *   node scripts/download-minio-tai-lieu.mjs
 *   ./scripts/download-minio-tai-lieu.sh
 *   OUT_DIR=~/Downloads KEEP_RAW=1 node scripts/download-minio-tai-lieu.mjs
 *
 * Env:
 *   MINIO_ENDPOINT   mặc định http://192.168.100.138:9000
 *   MINIO_ACCESS_KEY mặc định minioadmin
 *   MINIO_SECRET_KEY mặc định 123456654321
 *   MINIO_BUCKET     mặc định mta
 *   MINIO_PREFIX     mặc định tai-lieu
 *   OUT_DIR          mặc định ./tmp-minio-download
 *   CONCURRENCY      mặc định 6
 *   KEEP_RAW         set 1 để giữ thư mục raw sau khi zip
 */
import { createRequire } from "node:module"
import { mkdir, rm, stat } from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

function loadMinio() {
  const candidates = [
    path.join(repoRoot, "apps/backend/be-model/node_modules/minio"),
    path.join(repoRoot, "node_modules/minio"),
    path.join(repoRoot, "tmp-minio/node_modules/minio"),
  ]
  const require = createRequire(import.meta.url)
  for (const c of candidates) {
    try {
      return require(c)
    } catch {
      /* try next */
    }
  }
  throw new Error(
    "Không tìm thấy package `minio`. Chạy: cd apps/backend/be-model && bun install (hoặc pnpm/npm install)"
  )
}

const { Client } = loadMinio()

const ENDPOINT = process.env.MINIO_ENDPOINT || "http://192.168.100.138:9000"
const ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "minioadmin"
const SECRET_KEY = process.env.MINIO_SECRET_KEY || "123456654321"
const BUCKET = process.env.MINIO_BUCKET || "mta"
const PREFIX = (process.env.MINIO_PREFIX || "tai-lieu").replace(/^\/+|\/+$/g, "")
const OUT_DIR = path.resolve(process.env.OUT_DIR || path.join(repoRoot, "tmp-minio-download"))
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY || 6))
const KEEP_RAW = process.env.KEEP_RAW === "1" || process.argv.includes("--keep")

function parseEndpoint(raw) {
  const u = new URL(raw.includes("://") ? raw : `http://${raw}`)
  const useSSL = u.protocol === "https:"
  const port = u.port ? Number(u.port) : useSSL ? 443 : 80
  return { endPoint: u.hostname, port, useSSL }
}

function listObjects(client, bucket, prefix) {
  return new Promise((resolve, reject) => {
    const items = []
    const stream = client.listObjectsV2(bucket, `${prefix}/`, true)
    stream.on("data", (obj) => {
      if (obj?.name && !obj.name.endsWith("/")) items.push(obj)
    })
    stream.on("error", reject)
    stream.on("end", () => resolve(items))
  })
}

async function mapPool(items, limit, fn) {
  let i = 0
  let done = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      const item = items[idx]
      await fn(item, idx)
      done++
      if (done % 25 === 0 || done === items.length) {
        process.stdout.write(`\r==> Đã tải ${done}/${items.length}`)
      }
    }
  })
  await Promise.all(workers)
  if (items.length) process.stdout.write("\n")
}

function runZip(zipPath, rawDir) {
  return new Promise((resolve, reject) => {
    const parent = path.dirname(rawDir)
    const base = path.basename(rawDir)
    const child = spawn("zip", ["-r", "-q", zipPath, base], {
      cwd: parent,
      stdio: "inherit",
    })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`zip exited ${code}`))
    })
  })
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}

async function main() {
  const { endPoint, port, useSSL } = parseEndpoint(ENDPOINT)
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const rawDir = path.join(OUT_DIR, `${PREFIX}-${stamp}`)
  const zipPath = path.join(OUT_DIR, `${PREFIX}-${stamp}.zip`)

  console.log(`==> Endpoint : ${ENDPOINT} (${endPoint}:${port}, ssl=${useSSL})`)
  console.log(`==> Bucket   : ${BUCKET}`)
  console.log(`==> Prefix   : ${PREFIX}/`)
  console.log(`==> Raw dir  : ${rawDir}`)
  console.log(`==> Zip out  : ${zipPath}`)
  console.log()

  const client = new Client({
    endPoint,
    port,
    useSSL,
    accessKey: ACCESS_KEY,
    secretKey: SECRET_KEY,
    pathStyle: true,
  })

  console.log("==> Đang list objects...")
  const objects = await listObjects(client, BUCKET, PREFIX)
  const totalBytes = objects.reduce((s, o) => s + (o.size || 0), 0)
  console.log(`==> ${objects.length} file, ~${formatBytes(totalBytes)}`)
  if (!objects.length) {
    console.error("Không có object nào. Kiểm tra prefix / credential / endpoint (API :9000).")
    process.exit(1)
  }

  await mkdir(rawDir, { recursive: true })

  console.log(`==> Đang tải (concurrency=${CONCURRENCY})...`)
  await mapPool(objects, CONCURRENCY, async (obj) => {
    const rel = obj.name.startsWith(`${PREFIX}/`)
      ? obj.name.slice(PREFIX.length + 1)
      : obj.name
    const dest = path.join(rawDir, rel)
    await mkdir(path.dirname(dest), { recursive: true })
    await client.fGetObject(BUCKET, obj.name, dest)
  })

  console.log("==> Đang zip...")
  await runZip(zipPath, rawDir)

  if (!KEEP_RAW) {
    console.log("==> Xóa thư mục raw...")
    await rm(rawDir, { recursive: true, force: true })
  }

  const z = await stat(zipPath)
  console.log()
  console.log(`Xong. Zip: ${zipPath} (${formatBytes(z.size)})`)
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
