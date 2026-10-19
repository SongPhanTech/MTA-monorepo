/**
 * Priority-wave NHCH convert pipeline:
 *  1) Remap catalog filePaths to local NHCH_ROOT
 *  2) Match schedule Excel → catalog entries (wave by exam date)
 *  3) Word Save As .docx for .doc files
 *  4) Soft-delete existing questions in those banks
 *  5) Import with --with-images
 *
 * Usage (cwd: packages/database):
 *   bun --env-file=.env scripts/nhch-run-wave.mjs --wave 0
 *   bun --env-file=.env scripts/nhch-run-wave.mjs --wave 0 --dry-run
 *   bun --env-file=.env scripts/nhch-run-wave.mjs --wave 0 --skip-resave
 *   bun --env-file=.env scripts/nhch-run-wave.mjs --wave 0 --skip-soft-delete
 *   bun --env-file=.env scripts/nhch-run-wave.mjs --wave 0 --limit-files 5
 *
 * Wave windows (from today):
 *   0 = 0–14 days, 1 = 15–30, 2 = 31–end of schedule, 3 = all matched catalog
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { basename, join } from "node:path"
import { execFileSync, execSync, spawnSync } from "node:child_process"
import { homedir } from "node:os"
import { PrismaClient } from "../generated/prisma-client/index.js"
import {
  NHCH_TMP_REPAIRED,
  printNhchPathConfig,
  resolveNhchRoot,
  resolveNhchSchedule,
} from "./nhch-paths.mjs"
import { requireMinioOrThrow } from "./nhch-images.mjs"

const SCRIPT_DIR = import.meta.dir
const RESAVE_SCRIPT = join(SCRIPT_DIR, "word-resave-docx.applescript")
const CATALOG_PATH = join(SCRIPT_DIR, "import-catalog.json")
const OUT_DIR = join(SCRIPT_DIR, "wave-out")

const waveArg = process.argv.indexOf("--wave")
const WAVE = waveArg !== -1 ? Number(process.argv[waveArg + 1]) : 0
const dryRun = process.argv.includes("--dry-run")
const skipResave = process.argv.includes("--skip-resave")
const skipSoftDelete = process.argv.includes("--skip-soft-delete")
const skipImport = process.argv.includes("--skip-import")
const limitFilesArg = process.argv.indexOf("--limit-files")
const LIMIT_FILES = limitFilesArg !== -1 ? Number(process.argv[limitFilesArg + 1]) : Infinity
const SKIP_LARGE_MB = 80

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function parseXlsxSchedule(path) {
  // Minimal XLSX read via unzip + sharedStrings (no openpyxl dependency)
  // Prefer python openpyxl if available
  const py = `
import json, openpyxl
from datetime import datetime, date
wb=openpyxl.load_workbook(${JSON.stringify(path)}, data_only=True)
ws=wb.active
headers=[c.value for c in next(ws.iter_rows(min_row=1,max_row=1))]
rows=[]
for row in ws.iter_rows(min_row=2, values_only=True):
  if not row or not row[1]: continue
  d=row[5]
  if isinstance(d, datetime): d=d.date().isoformat()
  elif isinstance(d, date): d=d.isoformat()
  else: d=None
  rows.append({"subject": row[1], "ht": row[4], "date": d, "qs": row[3]})
print(json.dumps(rows, ensure_ascii=False))
`
  const r = spawnSync("python3", ["-c", py], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`Schedule read failed: ${r.stderr || r.stdout}`)
  return JSON.parse(r.stdout)
}

function waveWindow(wave, today = new Date()) {
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const add = (n) => {
    const d = new Date(t0)
    d.setDate(d.getDate() + n)
    return d
  }
  if (wave === 0) return { start: t0, end: add(14), label: "W0 0-14d" }
  if (wave === 1) return { start: add(15), end: add(30), label: "W1 15-30d" }
  if (wave === 2) return { start: add(31), end: add(400), label: "W2 31d-end" }
  return { start: null, end: null, label: "W3 all-catalog" }
}

function remapCatalog(catalog, root) {
  let ok = 0
  let miss = 0
  for (const e of [...catalog.matched, ...(catalog.missingSv || []), ...(catalog.unmatched || [])]) {
    if (!e?.relativePath) continue
    const local = join(root, e.relativePath)
    if (existsSync(local)) {
      e.filePath = local
      ok++
    } else {
      miss++
    }
  }
  catalog.root = root
  catalog.remappedAt = new Date().toISOString()
  return { ok, miss }
}

function matchEntries(catalog, scheduleRows, win) {
  // Build index: normalized subjectName_db / subjectName / folder → entries
  const byName = new Map()
  const add = (key, e) => {
    if (!key) return
    if (!byName.has(key)) byName.set(key, [])
    byName.get(key).push(e)
  }
  for (const e of catalog.matched) {
    if (!e.questionBankId) continue
    add(norm(e.subjectName_db), e)
    add(norm(e.subjectName), e)
    add(norm(e.subjectFolderName), e)
  }

  const subjects = new Map() // normName → { earliest, label, entries:Set }
  for (const row of scheduleRows) {
    if (!row.date && WAVE !== 3) continue
    const d = row.date ? new Date(row.date) : null
    if (win.start && win.end && d) {
      if (d < win.start || d > win.end) continue
    }
    const key = norm(row.subject)
    if (!subjects.has(key)) {
      subjects.set(key, { label: row.subject, earliest: row.date, entries: new Map() })
    }
    const s = subjects.get(key)
    if (row.date && (!s.earliest || row.date < s.earliest)) s.earliest = row.date
  }

  const matched = []
  const review = []
  const seenFiles = new Set()

  for (const [key, meta] of subjects) {
    let hits = byName.get(key) || []
    let confidence = hits.length ? "exact" : null
    if (!hits.length) {
      // fuzzy: token overlap >= 0.7
      const tokens = new Set(key.split(" ").filter(Boolean))
      let best = null
      let bestScore = 0
      for (const [k, list] of byName) {
        const kt = new Set(k.split(" ").filter(Boolean))
        if (!tokens.size || !kt.size) continue
        const inter = [...tokens].filter((t) => kt.has(t)).length
        const score = inter / Math.max(tokens.size, 1)
        if (score > bestScore && (score >= 0.7 || inter >= 3)) {
          bestScore = score
          best = list
        }
      }
      if (best) {
        hits = best
        confidence = `fuzzy:${bestScore.toFixed(2)}`
      }
    }
    if (!hits.length) {
      review.push({ subject: meta.label, earliest: meta.earliest, reason: "no_catalog_match" })
      continue
    }
    if (confidence.startsWith("fuzzy:") && Number(confidence.slice(6)) < 0.85) {
      review.push({
        subject: meta.label,
        earliest: meta.earliest,
        reason: confidence,
        sample: hits[0]?.relativePath,
      })
      // still include high-ish fuzzy? only >= 0.85 auto
      continue
    }
    for (const e of hits) {
      if (seenFiles.has(e.relativePath)) continue
      if (!existsSync(e.filePath)) continue
      seenFiles.add(e.relativePath)
      matched.push({
        ...e,
        scheduleSubject: meta.label,
        examDate: meta.earliest,
        matchConfidence: confidence,
      })
    }
  }

  // Wave 3: all matched with local file
  if (WAVE === 3) {
    matched.length = 0
    for (const e of catalog.matched) {
      if (!e.questionBankId || !existsSync(e.filePath)) continue
      matched.push({ ...e, scheduleSubject: e.subjectName_db, examDate: null, matchConfidence: "all" })
    }
  }

  matched.sort((a, b) => String(a.examDate || "").localeCompare(String(b.examDate || "")))
  return { matched, review, subjectCount: subjects.size }
}

function detectInExt(filePath) {
  const name = basename(filePath).toLowerCase()
  if (name.endsWith(".docx") || name.includes(".docx.")) return ".docx"
  return ".doc"
}

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
}

function resaveViaWord(srcPath, outDocxPath) {
  if (!existsSync(TMP_DIR_READY())) mkdirSync(NHCH_TMP_REPAIRED, { recursive: true })
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  const tmpIn = join(NHCH_TMP_REPAIRED, `in_${id}${detectInExt(srcPath)}`)
  const tmpOut = join(NHCH_TMP_REPAIRED, `out_${id}.docx`)
  copyFileSync(srcPath, tmpIn)
  try {
    execFileSync("osascript", [RESAVE_SCRIPT, tmpIn, tmpOut], {
      timeout: 960000,
      maxBuffer: 2 * 1024 * 1024,
      encoding: "utf8",
    })
    if (!existsSync(tmpOut) || statSync(tmpOut).size < 200) {
      throw new Error("Word did not write usable docx")
    }
    const fd = readFileSync(tmpOut)
    if (fd[0] !== 0x50 || fd[1] !== 0x4b) throw new Error("not OOXML")
    copyFileSync(tmpOut, outDocxPath)
    return outDocxPath
  } catch (e) {
    resetWord()
    throw new Error(e.message.split("\n")[0])
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

function TMP_DIR_READY() {
  return existsSync(NHCH_TMP_REPAIRED)
}

function needsResave(filePath) {
  const name = basename(filePath).toLowerCase()
  if (name.endsWith(".docx") && !name.endsWith(".doc.docx")) {
    // already docx — verify zip
    try {
      const fd = readFileSync(filePath)
      return !(fd[0] === 0x50 && fd[1] === 0x4b)
    } catch {
      return true
    }
  }
  return true // .doc or odd names → resave
}

async function softDeleteBanks(prisma, bankIds) {
  const now = new Date()
  let n = 0
  for (const bankId of bankIds) {
    // soft-delete questions + options (options hard-delete ok)
    const qs = await prisma.question.findMany({
      where: { questionBankId: bankId, deletedAt: null },
      select: { id: true },
    })
    if (!qs.length) continue
    const ids = qs.map((q) => q.id)
    await prisma.multipleChoiceOption.deleteMany({ where: { questionId: { in: ids } } })
    const r = await prisma.question.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: now, active: false },
    })
    n += r.count
    console.log(`  soft-delete bank ${bankId}: ${r.count} questions`)
  }
  return n
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(NHCH_TMP_REPAIRED, { recursive: true })

  const root = resolveNhchRoot()
  const schedulePath = resolveNhchSchedule()
  printNhchPathConfig({ root, schedule: schedulePath })
  requireMinioOrThrow()

  if (!existsSync(CATALOG_PATH)) throw new Error(`Missing ${CATALOG_PATH}`)
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"))
  const { ok, miss } = remapCatalog(catalog, root)
  console.log(`Remapped catalog paths: ok=${ok} missing=${miss}`)
  writeFileSync(CATALOG_PATH, JSON.stringify(catalog), "utf8")

  const win = waveWindow(WAVE)
  console.log(`Wave ${WAVE} (${win.label})`)

  let scheduleRows = []
  if (WAVE !== 3) {
    if (!existsSync(schedulePath)) throw new Error(`Missing schedule ${schedulePath}`)
    scheduleRows = parseXlsxSchedule(schedulePath)
    console.log(`Schedule rows: ${scheduleRows.length}`)
  }

  let { matched, review, subjectCount } = matchEntries(catalog, scheduleRows, win)
  console.log(
    `Matched files: ${matched.length} from ~${subjectCount} schedule subjects; review=${review.length}`
  )

  writeFileSync(
    join(OUT_DIR, `priority-hk1-w${WAVE}-review.json`),
    JSON.stringify(review, null, 2),
    "utf8"
  )

  if (Number.isFinite(LIMIT_FILES)) matched = matched.slice(0, LIMIT_FILES)
  console.log(`Will process ${matched.length} files`)

  // Resave
  const repairedDir = join(NHCH_TMP_REPAIRED, `w${WAVE}`)
  mkdirSync(repairedDir, { recursive: true })
  const patched = []
  let resaveOk = 0
  let resaveFail = 0
  let resaveSkip = 0

  for (let i = 0; i < matched.length; i++) {
    const e = matched[i]
    const sizeMb = existsSync(e.filePath) ? statSync(e.filePath).size / (1024 * 1024) : 0
    if (sizeMb > SKIP_LARGE_MB) {
      console.log(`[${i + 1}/${matched.length}] SKIP large ${sizeMb.toFixed(1)}MB ${e.relativePath}`)
      resaveSkip++
      continue
    }

    let filePath = e.filePath
    if (!skipResave && needsResave(filePath)) {
      const safe = `${String(i).padStart(4, "0")}_${basename(filePath).replace(/[^\w.-]+/g, "_").slice(0, 40)}.docx`
      const out = join(repairedDir, safe)
      if (dryRun) {
        console.log(`[${i + 1}/${matched.length}] dry-run resave ${e.relativePath}`)
        patched.push({ ...e, filePath, resaved: false })
        continue
      }
      try {
        console.log(`[${i + 1}/${matched.length}] resave ${e.relativePath}`)
        resaveViaWord(filePath, out)
        filePath = out
        resaveOk++
      } catch (err) {
        console.warn(`  FAIL resave: ${err.message}`)
        resaveFail++
        continue
      }
    } else if (!needsResave(filePath)) {
      resaveSkip++
    }
    patched.push({ ...e, filePath, resaved: filePath !== e.filePath })
  }

  console.log(`Resave: ok=${resaveOk} fail=${resaveFail} skip=${resaveSkip}`)

  const waveCatalog = {
    generatedAt: new Date().toISOString(),
    root,
    wave: WAVE,
    summary: {
      totalFiles: patched.length,
      matched: patched.length,
      missingSv: 0,
      unmatched: 0,
    },
    matched: patched,
    missingSv: [],
    unmatched: [],
    review,
  }
  const waveCatalogPath = join(OUT_DIR, `import-catalog-w${WAVE}.json`)
  writeFileSync(waveCatalogPath, JSON.stringify(waveCatalog, null, 2), "utf8")
  writeFileSync(
    join(OUT_DIR, `priority-hk1-w${WAVE}.csv`),
    [
      "examDate,scheduleSubject,relativePath,questionBankId,confidence,bankName",
      ...patched.map(
        (e) =>
          `"${e.examDate || ""}","${(e.scheduleSubject || "").replace(/"/g, '""')}","${e.relativePath}",${e.questionBankId},${e.matchConfidence},"${(e.bankName || "").replace(/"/g, '""')}"`
      ),
    ].join("\n"),
    "utf8"
  )
  console.log(`Wrote ${waveCatalogPath}`)

  if (dryRun) {
    console.log("Dry-run done — no soft-delete / import")
    return
  }

  const prisma = new PrismaClient()
  try {
    if (!skipSoftDelete) {
      const bankIds = [...new Set(patched.map((e) => e.questionBankId).filter(Boolean))]
      console.log(`Soft-deleting questions in ${bankIds.length} banks…`)
      const n = await softDeleteBanks(prisma, bankIds)
      console.log(`Soft-deleted ${n} questions`)
    }
  } finally {
    await prisma.$disconnect()
  }

  if (skipImport) {
    console.log("Skip import")
    return
  }

  console.log("Importing…")
  const args = [
    "scripts/bulk-import-questions.mjs",
    "--catalog",
    waveCatalogPath,
    "--with-images",
    "--concurrency",
    "4",
  ]
  const r = spawnSync("bun", args, {
    cwd: join(SCRIPT_DIR, ".."),
    env: { ...process.env, NHCH_REQUIRE_MINIO: "1" },
    stdio: "inherit",
  })
  if (r.status !== 0) process.exit(r.status || 1)
  console.log("Wave complete.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
