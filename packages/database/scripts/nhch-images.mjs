/**
 * Extract question text with {img_N} placeholders and upload images to MinIO
 * (or embed data URLs if MINIO_* is not set).
 */
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  openSync,
  readSync,
  closeSync,
  rmSync,
} from "node:fs"
import { join, basename, dirname, extname } from "node:path"
import { execFileSync, execSync } from "node:child_process"
import { createHash, createHmac, randomUUID } from "node:crypto"
import { NHCH_TMP_CONVERT } from "./nhch-paths.mjs"

const TMP_DIR = NHCH_TMP_CONVERT
const WORD_HTML_SCRIPT = join(import.meta.dir || ".", "word-extract-html.applescript")
const IMG_TOKEN = (n) => `{img_${n}}`

let wordChain = Promise.resolve()
function withWordLock(fn) {
  const next = wordChain.then(fn, fn)
  wordChain = next.then(
    () => {},
    () => {}
  )
  return next
}

function decodeXml(s) {
  return String(s || "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(Number.parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

export function isZipContainer(filePath) {
  const fd = openSync(filePath, "r")
  try {
    const buf = Buffer.alloc(4)
    readSync(fd, buf, 0, 4, 0)
    return buf[0] === 0x50 && buf[1] === 0x4b
  } finally {
    closeSync(fd)
  }
}

export function oleMayHavePictures(filePath) {
  const fd = openSync(filePath, "r")
  try {
    const chunk = Buffer.alloc(1024 * 1024)
    let pos = 0
    const needles = [
      Buffer.from("Word.Picture"),
      Buffer.from("\x89PNG"),
      Buffer.from("JFIF"),
      Buffer.from("GIF89"),
      Buffer.from("GIF87"),
    ]
    while (true) {
      const n = readSync(fd, chunk, 0, chunk.length, pos)
      if (n <= 0) return false
      const slice = n === chunk.length ? chunk : chunk.subarray(0, n)
      for (const needle of needles) {
        if (slice.includes(needle)) return true
      }
      if (n < chunk.length) return false
      pos += n - 64
    }
  } finally {
    closeSync(fd)
  }
}

export function zipHasMedia(filePath) {
  try {
    const out = execFileSync("unzip", ["-l", filePath], {
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 8 * 1024 * 1024,
    })
    return /word\/media\//i.test(out)
  } catch {
    return false
  }
}

function parseRels(relsXml) {
  const map = new Map()
  const tags = relsXml.match(/<Relationship\b[^>]*>/g) || []
  for (const tag of tags) {
    const id = tag.match(/\bId="([^"]+)"/)?.[1]
    const target = tag.match(/\bTarget="([^"]+)"/)?.[1]
    if (id && target) map.set(id, target.replace(/^\.\//, ""))
  }
  return map
}

export function extractDocxTextAndImages(docPath) {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  const tmp = join(TMP_DIR, `docx_${id}`)
  mkdirSync(tmp, { recursive: true })
  try {
    execFileSync("unzip", ["-q", "-o", docPath, "-d", tmp], {
      timeout: 60000,
      stdio: "pipe",
    })
    const xmlPath = join(tmp, "word/document.xml")
    const relsPath = join(tmp, "word/_rels/document.xml.rels")
    if (!existsSync(xmlPath)) {
      throw new Error("docx missing word/document.xml")
    }
    const xml = readFileSync(xmlPath, "utf8")
    const rels = existsSync(relsPath) ? parseRels(readFileSync(relsPath, "utf8")) : new Map()

    const parts = xml.split(
      /(<w:drawing[\s\S]*?<\/w:drawing>|<w:pict[\s\S]*?<\/w:pict>|<w:t\b[\s\S]*?<\/w:t>|<\/w:p>|<w:tab\/>|<w:br\b[^/]*\/>)/
    )
    let text = ""
    const images = []
    let imgIndex = 0
    const fileCache = new Map()

    const emuToPx = (emu) => {
      const n = Number(emu)
      if (!Number.isFinite(n) || n <= 0) return null
      return Math.max(1, Math.round((n * 96) / 914400))
    }

    const parseDrawingSize = (drawingXml) => {
      const m1 = drawingXml.match(/\bcx="(\d+)"/)
      const m2 = drawingXml.match(/\bcy="(\d+)"/)
      if (m1 && m2) return { widthPx: emuToPx(m1[1]), heightPx: emuToPx(m2[1]) }
      return { widthPx: null, heightPx: null }
    }

    const pushImage = (relId, size = {}) => {
      const target = rels.get(relId)
      if (!target) return
      const abs = join(tmp, "word", target)
      if (!existsSync(abs)) return
      imgIndex += 1
      const name = IMG_TOKEN(imgIndex)
      text += name
      if (!fileCache.has(abs)) {
        fileCache.set(abs, readFileSync(abs))
      }
      images.push({
        name,
        buffer: fileCache.get(abs),
        ext: extname(target).replace(".", "").toLowerCase() || "png",
        widthPx: size.widthPx || null,
        heightPx: size.heightPx || null,
      })
    }

    for (const part of parts) {
      if (!part) continue
      if (part === "</w:p>" || /^<w:br\b/.test(part)) {
        text += "\n"
        continue
      }
      if (part === "<w:tab/>") {
        text += "\t"
        continue
      }
      if (part.startsWith("<w:t")) {
        const m = part.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/)
        if (m) text += decodeXml(m[1])
        continue
      }
      if (part.startsWith("<w:drawing") || part.startsWith("<w:pict")) {
        const embed = part.match(/r:embed="([^"]+)"/) || part.match(/r:id="([^"]+)"/)
        if (embed) pushImage(embed[1], parseDrawingSize(part))
      }
    }

    text = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .normalize("NFC")

    return { text, images }
  } finally {
    try {
      rmSync(tmp, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
  }
}

function htmlToTextAndImages(html, htmlPath) {
  const baseDir = dirname(htmlPath)
  const images = []
  let imgIndex = 0
  let s = String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h[1-6]|li|table|section)>/gi, "\n")

  s = s.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1]
    if (!src || src.startsWith("data:")) return ""
    const decoded = decodeXml(src).replace(/file:\/\//i, "")
    const abs = decoded.startsWith("/") ? decoded : join(baseDir, decoded)
    if (!existsSync(abs)) return ""
    imgIndex += 1
    const name = IMG_TOKEN(imgIndex)
    const wAttr = tag.match(/\bwidth=["']?(\d+)/i)?.[1]
    const hAttr = tag.match(/\bheight=["']?(\d+)/i)?.[1]
    const wStyle = tag.match(/width\s*:\s*([\d.]+)px/i)?.[1]
    const hStyle = tag.match(/height\s*:\s*([\d.]+)px/i)?.[1]
    images.push({
      name,
      buffer: readFileSync(abs),
      ext: extname(abs).replace(".", "").toLowerCase() || "png",
      widthPx: Number(wAttr || wStyle) || null,
      heightPx: Number(hAttr || hStyle) || null,
    })
    return `\n${name}\n`
  })

  s = s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\u00A0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .normalize("NFC")

  return { text: decodeXml(s), images }
}

function resetWord() {
  try {
    execSync(`osascript -e 'tell application "Microsoft Word" to quit'`, {
      timeout: 20000,
      stdio: "pipe",
    })
  } catch {
    try {
      execSync(`pkill -9 "Microsoft Word"`, { stdio: "pipe" })
    } catch {
      /* ignore */
    }
  }
}

export async function docToHtmlViaWord(docPath) {
  if (!existsSync(WORD_HTML_SCRIPT)) {
    throw new Error(`Missing Word HTML script: ${WORD_HTML_SCRIPT}`)
  }
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })

  return withWordLock(async () => {
    const ext = basename(docPath).toLowerCase().includes(".docx") ? ".docx" : ".doc"
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const tmpDoc = join(TMP_DIR, `word_in_${id}${ext}`)
    const tmpHtml = join(TMP_DIR, `word_out_${id}.html`)
    try {
      execFileSync("cp", [docPath, tmpDoc], { timeout: 60000, stdio: "pipe" })
    } catch (e) {
      throw new Error(`Cannot copy for Word HTML: ${e.message.split("\n")[0]}`)
    }

    try {
      execFileSync("osascript", [WORD_HTML_SCRIPT, tmpDoc, tmpHtml], {
        timeout: 320000,
        maxBuffer: 4 * 1024 * 1024,
        encoding: "utf8",
      })
      const htmlFile = [tmpHtml, tmpHtml.replace(/\.html$/i, ".htm"), `${tmpHtml}.htm`].find((p) =>
        existsSync(p)
      )
      if (!htmlFile) {
        const extras = readdirSync(TMP_DIR).filter((n) => n.includes(`word_out_${id}`))
        throw new Error(`Word did not write HTML (${extras.join(",") || "none"})`)
      }
      const html = readFileSync(htmlFile, "utf8")
      const result = htmlToTextAndImages(html, htmlFile)
      if (!result.text.trim() && result.images.length === 0) {
        throw new Error("Word HTML was empty")
      }
      return result
    } catch (e) {
      resetWord()
      throw new Error(`Word HTML convert failed: ${e.message.split("\n")[0]}`)
    } finally {
      try {
        execFileSync("rm", ["-f", tmpDoc], { stdio: "pipe" })
      } catch {
        /* ignore */
      }
      try {
        for (const name of readdirSync(TMP_DIR)) {
          if (!name.includes(`word_out_${id}`)) continue
          rmSync(join(TMP_DIR, name), { recursive: true, force: true })
        }
      } catch {
        /* ignore */
      }
    }
  })
}

function hmac(key, data) {
  return createHmac("sha256", key).update(data).digest()
}

function sha256Hex(data) {
  return createHash("sha256").update(data).digest("hex")
}

async function minioPutObject(objectKey, buffer, contentType) {
  const endpoint = process.env.MINIO_ENDPOINT
  const accessKey = process.env.MINIO_ACCESS_KEY
  const secretKey = process.env.MINIO_SECRET_KEY
  const bucket = process.env.MINIO_BUCKET || "mta"
  const region = process.env.MINIO_REGION || "vn"
  if (!endpoint || !accessKey || !secretKey) {
    throw new Error("MINIO env missing")
  }

  const origin = endpoint.replace(/\/$/, "")
  const url = new URL(origin)
  const host = url.host
  const canonicalUri = `/${bucket}/${objectKey
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/")}`
  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "")
  const amz = `${dateStamp}T${now.toISOString().slice(11, 19).replace(/:/g, "")}Z`
  const payloadHash = sha256Hex(buffer)
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date"
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amz}\n`
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")
  const scope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = ["AWS4-HMAC-SHA256", amz, scope, sha256Hex(canonicalRequest)].join("\n")
  const kDate = hmac(`AWS4${secretKey}`, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, "s3")
  const kSigning = hmac(kService, "aws4_request")
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex")
  const auth = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(`${origin}${canonicalUri}`, {
    method: "PUT",
    headers: {
      Host: host,
      Authorization: auth,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amz,
      "Content-Type": contentType,
    },
    body: buffer,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`MinIO PUT ${res.status} ${body.slice(0, 180)}`)
  }
  const publicBase = (process.env.MINIO_PUBLIC_ENDPOINT || origin).replace(/\/$/, "")
  return `${publicBase}/${bucket}/${objectKey}`
}

const MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
}

function toPngIfNeeded(img) {
  const ext = (img.ext || "png").toLowerCase()
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return img
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })
  const id = randomUUID()
  const src = join(TMP_DIR, `img_${id}.${ext || "bin"}`)
  const dest = join(TMP_DIR, `img_${id}.png`)
  try {
    writeFileSync(src, img.buffer)
    execFileSync("sips", ["-s", "format", "png", src, "--out", dest], {
      timeout: 20000,
      stdio: "pipe",
    })
    if (existsSync(dest)) {
      return { ...img, buffer: readFileSync(dest), ext: "png" }
    }
  } catch {
    /* keep original */
  } finally {
    try {
      rmSync(src, { force: true })
      rmSync(dest, { force: true })
    } catch {
      /* ignore */
    }
  }
  return img
}

let warnedNoMinio = false

/** When true (or NHCH_REQUIRE_MINIO=1), refuse data-URL fallback. */
export function requireMinioOrThrow() {
  const hasMinio =
    process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY
  if (!hasMinio) {
    throw new Error(
      "MINIO_ENDPOINT / MINIO_ACCESS_KEY / MINIO_SECRET_KEY required (data URL fallback disabled)"
    )
  }
}

export async function uploadImageList(images, { requireMinio = false } = {}) {
  const urlByName = {}
  if (!images?.length) return urlByName

  const forceMinio = requireMinio || process.env.NHCH_REQUIRE_MINIO === "1"
  const hasMinio =
    process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY
  if (!hasMinio) {
    if (forceMinio) requireMinioOrThrow()
    if (!warnedNoMinio) {
      warnedNoMinio = true
      console.warn(
        "MINIO_ENDPOINT / MINIO_ACCESS_KEY / MINIO_SECRET_KEY chưa set — nhúng ảnh dạng data URL. Muốn URL MinIO thì export các biến này rồi chạy lại."
      )
    }
  }

  const day = new Date().toISOString().slice(0, 10)
  const uploadedByHash = new Map()
  /** Keep display size from original image object keyed by token name */
  const metaByName = new Map(images.map((i) => [i.name, i]))

  for (const raw of images) {
    const img = toPngIfNeeded(raw)
    const hash = sha256Hex(img.buffer)
    if (uploadedByHash.has(hash)) {
      urlByName[img.name] = uploadedByHash.get(hash)
      continue
    }
    let url
    if (hasMinio) {
      const ext = img.ext || "png"
      const objectKey = `question-images/${day}/${randomUUID()}.${ext}`
      url = await minioPutObject(objectKey, img.buffer, MIME[ext] || "application/octet-stream")
    } else {
      const ext = img.ext || "png"
      const mime = MIME[ext] || "image/png"
      url = `data:${mime};base64,${img.buffer.toString("base64")}`
    }
    uploadedByHash.set(hash, url)
    urlByName[img.name] = url
  }

  // Attach size meta onto urlByName via side map for replaceImgTokens
  urlByName.__meta = metaByName
  return urlByName
}

export function replaceImgTokens(text, urlByName) {
  if (!text || !urlByName || Object.keys(urlByName).length === 0) return text
  const meta = urlByName.__meta
  return String(text).replace(/\{img_\d+\}/g, (token) => {
    const url = urlByName[token]
    if (!url || typeof url !== "string") return token
    const m = meta?.get?.(token)
    const w = m?.widthPx
    if (w && Number.isFinite(w) && w > 0) {
      const h = m?.heightPx && Number.isFinite(m.heightPx) ? m.heightPx : null
      const wh = h ? ` width="${w}" height="${h}"` : ` width="${w}"`
      return `<img src="${url}"${wh} style="width: ${w}px; height: auto; max-width: 100%;" />`
    }
    return `<img src="${url}" style="max-width: 100%;" />`
  })
}

export function applyImgTokensToQuestions(questions, urlByName) {
  if (!urlByName || Object.keys(urlByName).length === 0) return questions
  for (const q of questions) {
    q.content = replaceImgTokens(q.content, urlByName)
    q.explanation = replaceImgTokens(q.explanation, urlByName)
    if (q.options?.length) {
      for (const o of q.options) {
        o.content = replaceImgTokens(o.content, urlByName)
      }
    }
  }
  return questions
}
