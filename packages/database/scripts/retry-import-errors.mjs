/**
 * Retry the failed files listed in import-errors.json.
 *
 * 1) Open each .doc/.docx in Microsoft Word → Save As clean .docx (ASCII path under /tmp)
 * 2) Write a patched catalog pointing those entries at the repaired files
 * 3) Re-run bulk-import-questions with --via-word --with-images
 *
 * Usage (from packages/database):
 *   bun scripts/retry-import-errors.mjs
 *   bun scripts/retry-import-errors.mjs --resave-only
 *   bun scripts/retry-import-errors.mjs --import-only
 *   bun scripts/retry-import-errors.mjs --limit 5 --dry-run
 *   bun scripts/retry-import-errors.mjs --skip-large-mb 50
 *   bun scripts/retry-import-errors.mjs --errors import-errors.json
 *
 * Requires Microsoft Word (macOS). Sequential — one document at a time.
 * Files >80MB skipped by default (Word hangs). Override with --skip-large-mb.
 */
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  unlinkSync,
  statSync,
} from "node:fs"
import { join, basename, dirname } from "node:path"
import { execFileSync, execSync, spawnSync } from "node:child_process"

const SCRIPT_DIR = import.meta.dir || dirname(new URL(import.meta.url).pathname)
const RESAVE_SCRIPT = join(SCRIPT_DIR, "word-resave-docx.applescript")
const CATALOG_PATH = join(SCRIPT_DIR, "import-catalog.json")
const TMP_DIR = "/tmp/nhch-repaired"
const MANIFEST_PATH = join(SCRIPT_DIR, "import-errors-repaired.json")
const PATCHED_CATALOG = join(TMP_DIR, "import-catalog-repaired.json")

const dryRun = process.argv.includes("--dry-run")
const resaveOnly = process.argv.includes("--resave-only")
const importOnly = process.argv.includes("--import-only")
const limitArg = process.argv.indexOf("--limit")
const limit = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : Infinity
const skipLargeArg = process.argv.indexOf("--skip-large-mb")
const SKIP_LARGE_MB = skipLargeArg !== -1 ? Number(process.argv[skipLargeArg + 1]) : 80
const errorsArg = process.argv.indexOf("--errors")
const errorsPath =
  errorsArg !== -1
    ? (process.argv[errorsArg + 1].startsWith("/")
        ? process.argv[errorsArg + 1]
        : join(SCRIPT_DIR, process.argv[errorsArg + 1]))
    : join(SCRIPT_DIR, "import-errors.json")

function resetWord() {
  try {
    execSync(`osascript -e 'tell application "Microsoft Word" to quit'`, {
      timeout: 15000,
      stdio: "pipe",
    })
  } catch {
    /* ignore */
  }
  try {
    execSync(`pkill -9 "Microsoft Word"`, { stdio: "pipe" })
  } catch {
    /* ignore */
  }
  // Clear Word lock files under TMP that block re-open
  try {
    execSync(`rm -f "${TMP_DIR}"/~$* "${TMP_DIR}"/in_* "${TMP_DIR}"/out_*`, {
      stdio: "pipe",
      shell: "/bin/zsh",
    })
  } catch {
    /* ignore */
  }
  // Give macOS a moment before relaunch
  try {
    execSync(`sleep 1.5`, { stdio: "pipe" })
  } catch {
    /* ignore */
  }
}

function safeId(relativePath) {
  let h = 0
  for (let i = 0; i < relativePath.length; i++) {
    h = (h * 31 + relativePath.charCodeAt(i)) >>> 0
  }
  const base = basename(relativePath)
    .replace(/\.docx?\.docx?$/i, "")
    .replace(/\.docx?$/i, "")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 40)
  return `${h.toString(16)}_${base || "doc"}`
}

function detectInExt(filePath) {
  const name = basename(filePath).toLowerCase()
  if (name.endsWith(".docx") || name.includes(".docx.")) return ".docx"
  return ".doc"
}

function resaveViaWord(srcPath, outDocxPath) {
  if (!existsSync(RESAVE_SCRIPT)) {
    throw new Error(`Missing ${RESAVE_SCRIPT}`)
  }
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })

  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  const tmpIn = join(TMP_DIR, `in_${id}${detectInExt(srcPath)}`)
  const tmpOut = join(TMP_DIR, `out_${id}.docx`)

  try {
    copyFileSync(srcPath, tmpIn)
  } catch (e) {
    throw new Error(`Cannot copy: ${e.message.split("\n")[0]}`)
  }

  try {
    execFileSync("osascript", [RESAVE_SCRIPT, tmpIn, tmpOut], {
      timeout: 960000,
      maxBuffer: 2 * 1024 * 1024,
      encoding: "utf8",
    })
    if (!existsSync(tmpOut) || statSync(tmpOut).size < 200) {
      throw new Error("Word did not write a usable .docx")
    }
    // Sanity: OOXML is a ZIP (PK…)
    const fd = readFileSync(tmpOut)
    if (fd[0] !== 0x50 || fd[1] !== 0x4b) {
      throw new Error("Output is not OOXML/docx (missing PK zip header)")
    }
    copyFileSync(tmpOut, outDocxPath)
    return outDocxPath
  } catch (e) {
    resetWord()
    throw new Error(`Word Save As failed: ${e.message.split("\n")[0]}`)
  } finally {
    for (const f of [tmpIn, tmpOut]) {
      try {
        if (existsSync(f)) unlinkSync(f)
      } catch {
        /* ignore */
      }
    }
  }
}

async function main() {
  if (!existsSync(errorsPath)) {
    console.error(`Missing ${errorsPath}`)
    process.exit(1)
  }
  if (!existsSync(CATALOG_PATH)) {
    console.error(`Missing ${CATALOG_PATH}`)
    process.exit(1)
  }

  const errors = JSON.parse(readFileSync(errorsPath, "utf8"))
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"))
  const byRel = new Map(catalog.matched.map((e) => [e.relativePath, e]))

  let entries = errors
    .map((e) => {
      const cat = byRel.get(e.file)
      if (!cat) return null
      const size = existsSync(cat.filePath) ? statSync(cat.filePath).size : 0
      return {
        relativePath: e.file,
        filePath: cat.filePath,
        entry: cat,
        prevError: e.error,
        size,
      }
    })
    .filter(Boolean)
    // Small files first — huge OLE docs hang Word for minutes
    .sort((a, b) => a.size - b.size)

  if (Number.isFinite(limit)) entries = entries.slice(0, limit)

  console.log(`Retry targets: ${entries.length} (from ${basename(errorsPath)})`)
  console.log(`Skip files larger than ${SKIP_LARGE_MB} MB (override with --skip-large-mb N)`)
  if (entries.length === 0) {
    console.log("Nothing to do.")
    return
  }

  mkdirSync(TMP_DIR, { recursive: true })
  // Start from a clean Word process
  if (!dryRun && !importOnly) resetWord()

  /** @type {{ relativePath: string, repairedPath: string, ok: boolean, error?: string }[]} */
  let manifest = []
  if (importOnly && existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
    console.log(`--import-only: loaded ${manifest.length} repaired entries from manifest`)
  } else if (!importOnly) {
    console.log(`\n=== Phase 1: Word Save As .docx → ${TMP_DIR} ===`)
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]
      const out = join(TMP_DIR, `${safeId(e.relativePath)}.docx`)
      const pct = `[${i + 1}/${entries.length}]`
      const sizeMb = (e.size / 1024 / 1024).toFixed(1)
      if (!existsSync(e.filePath)) {
        console.log(`${pct} MISSING: ${e.relativePath}`)
        manifest.push({
          relativePath: e.relativePath,
          repairedPath: out,
          ok: false,
          error: "source file missing",
        })
        continue
      }
      if (e.size > SKIP_LARGE_MB * 1024 * 1024) {
        console.log(`${pct} SKIP large (${sizeMb}MB): ${e.relativePath}`)
        manifest.push({
          relativePath: e.relativePath,
          repairedPath: out,
          ok: false,
          error: `file too large (${sizeMb}MB > ${SKIP_LARGE_MB}MB)`,
        })
        continue
      }
      if (dryRun) {
        console.log(`${pct} DRY-RUN resave (${sizeMb}MB): ${e.relativePath}`)
        manifest.push({
          relativePath: e.relativePath,
          repairedPath: out,
          ok: true,
        })
        continue
      }
      try {
        if (existsSync(out) && statSync(out).size > 200) {
          const fd = readFileSync(out)
          if (fd[0] === 0x50 && fd[1] === 0x4b) {
            console.log(`${pct} SKIP (already repaired): ${e.relativePath}`)
            manifest.push({ relativePath: e.relativePath, repairedPath: out, ok: true })
            continue
          }
        }
        console.log(`${pct} Resaving (${sizeMb}MB): ${e.relativePath}`)
        resaveViaWord(e.filePath, out)
        console.log(`${pct} OK → ${basename(out)}`)
        manifest.push({ relativePath: e.relativePath, repairedPath: out, ok: true })
        // Periodically reset Word to avoid memory bloat
        if ((i + 1) % 10 === 0) resetWord()
      } catch (err) {
        console.log(`${pct} FAIL resave: ${e.relativePath} — ${err.message}`)
        manifest.push({
          relativePath: e.relativePath,
          repairedPath: out,
          ok: false,
          error: err.message,
        })
        resetWord()
      }
    }
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8")
    console.log(`Manifest saved: ${MANIFEST_PATH}`)
    console.log(`Resaved: ${manifest.filter((m) => m.ok).length}/${manifest.length}`)
  }

  if (resaveOnly) {
    console.log("\n--resave-only: stop before import.")
    return
  }

  const okManifest = dryRun
    ? manifest.filter((m) => m.ok)
    : manifest.filter((m) => m.ok && existsSync(m.repairedPath))
  if (okManifest.length === 0) {
    console.error("No repaired files to import.")
    process.exit(1)
  }

  console.log(`\n=== Phase 2: Import ${okManifest.length} repaired files via Word ===`)

  const repairedMatched = []
  for (const m of okManifest) {
    const cat = byRel.get(m.relativePath)
    if (!cat) continue
    repairedMatched.push({
      ...cat,
      filePath: m.repairedPath,
    })
  }

  const patched = {
    ...catalog,
    generatedAt: new Date().toISOString(),
    note: "Patched by retry-import-errors.mjs — filePath points to Word-repaired .docx",
    matched: repairedMatched,
    summary: {
      ...(catalog.summary || {}),
      matched: repairedMatched.length,
    },
  }
  writeFileSync(PATCHED_CATALOG, JSON.stringify(patched, null, 2), "utf8")
  console.log(`Patched catalog: ${PATCHED_CATALOG} (${repairedMatched.length} entries)`)

  if (dryRun) {
    console.log(
      "DRY-RUN: would run bulk-import-questions.mjs --catalog ... --via-word --with-images"
    )
    return
  }

  const importScript = join(SCRIPT_DIR, "bulk-import-questions.mjs")
  const args = [
    importScript,
    "--catalog",
    PATCHED_CATALOG,
    "--via-word",
    "--with-images",
    "--errors-out",
    join(SCRIPT_DIR, "import-errors-retry.json"),
  ]
  console.log(`\n> bun ${args.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ")}\n`)
  const r = spawnSync("bun", args, {
    cwd: join(SCRIPT_DIR, ".."),
    stdio: "inherit",
    env: process.env,
  })
  process.exit(r.status ?? 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
