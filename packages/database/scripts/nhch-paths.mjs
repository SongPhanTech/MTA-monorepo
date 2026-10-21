/**
 * Shared path defaults for NHCH convert/import scripts.
 *
 * Override via env or CLI:
 *   NHCH_ROOT=/path/to/Ngân hàng câu hỏi thi
 *   NHCH_SCHEDULE=/path/to/hoc_ky_1_da_gop.xlsx
 *   bun scripts/bulk-import-catalog.mjs --root /path
 */
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const HOME = homedir()
const DOWNLOADS = join(HOME, "Downloads")

/** Candidate roots, first existing wins (unless NHCH_ROOT / --root set). */
const ROOT_CANDIDATES = [
  join(DOWNLOADS, "Ngân hàng câu hỏi thi"),
  join(DOWNLOADS, "Convert ngân hàng câu hỏi", "Ngân hàng câu hỏi thi"),
  join(DOWNLOADS, "Ngan hang cau hoi thi"),
]

const SCHEDULE_CANDIDATES = [
  join(DOWNLOADS, "hoc_ky_1_da_gop (1).xlsx"),
  join(DOWNLOADS, "hoc_ky_1_da_gop.xlsx"),
]

export const NHCH_TMP_CONVERT = "/tmp/nhch-convert"
export const NHCH_TMP_REPAIRED = "/tmp/nhch-repaired"
export const NHCH_SCRIPT_DIR = import.meta.dir || join(import.meta.url, ".")

function firstExisting(paths) {
  for (const p of paths) {
    if (p && existsSync(p)) return p
  }
  return null
}

/**
 * Resolve NHCH document root.
 * Priority: explicit arg → NHCH_ROOT env → first existing candidate → preferred default path.
 */
export function resolveNhchRoot(explicit) {
  if (explicit) return explicit
  if (process.env.NHCH_ROOT) return process.env.NHCH_ROOT
  return firstExisting(ROOT_CANDIDATES) || ROOT_CANDIDATES[0]
}

/**
 * Resolve HK1 schedule Excel used for priority waves.
 */
export function resolveNhchSchedule(explicit) {
  if (explicit) return explicit
  if (process.env.NHCH_SCHEDULE) return process.env.NHCH_SCHEDULE
  return firstExisting(SCHEDULE_CANDIDATES) || SCHEDULE_CANDIDATES[0]
}

export function printNhchPathConfig({ root, schedule } = {}) {
  const r = root ?? resolveNhchRoot()
  const s = schedule ?? resolveNhchSchedule()
  console.log("NHCH paths:")
  console.log(`  root:     ${r} ${existsSync(r) ? "(ok)" : "(MISSING)"}`)
  console.log(`  schedule: ${s} ${existsSync(s) ? "(ok)" : "(MISSING)"}`)
  console.log(`  tmp:      ${NHCH_TMP_CONVERT}, ${NHCH_TMP_REPAIRED}`)
  return { root: r, schedule: s, rootOk: existsSync(r), scheduleOk: existsSync(s) }
}

if (import.meta.main) {
  printNhchPathConfig()
}
