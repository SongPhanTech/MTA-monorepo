/**
 * Remap unmatched catalog entries from Excel, then ready for Phase 2.
 *
 * Usage:
 *   DATABASE_URL=... bun scripts/remap-unmatched-from-excel.mjs [--dry-run]
 *   DATABASE_URL=... bun scripts/remap-unmatched-from-excel.mjs --excel "/path/to.xlsx"
 *
 * Default Excel: scripts/Danh sách map lại môn học.xlsx
 *
 * Typical order (after bun scripts/bulk-import-catalog.mjs):
 *   bun scripts/remap-unmatched-from-excel.mjs
 *   bun scripts/bulk-import-create-sv.mjs
 *   bun scripts/create-missing-subjects-from-unmatched.mjs
 *   bun scripts/bulk-import-questions.mjs --with-images
 *   bun scripts/bulk-import-questions.mjs --errors-only --via-word --with-images
 *   bun scripts/fix-question-bank-tree-orgs.mjs
 *
 * Skips:
 *   - "Cơ sở lý thuyết tác chiến mạng" (tạm thời)
 *   - Đối tượng đào tạo không có trong hệ thống
 */
import { createRequire } from "node:module"
import { readFileSync, writeFileSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "../generated/prisma-client/index.js"

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

function loadXlsx() {
  const candidates = [
    "xlsx",
    join(__dirname, "../node_modules/xlsx"),
    join(__dirname, "../../../apps/backend/be-ql-dao-tao/node_modules/xlsx"),
    join(__dirname, "../../../apps/backend/be-portal/node_modules/xlsx"),
    join(__dirname, "../../../node_modules/xlsx"),
  ]
  for (const c of candidates) {
    try {
      return require(c)
    } catch {
      /* next */
    }
  }
  throw new Error("Không tìm thấy package xlsx")
}

const XLSX = loadXlsx()
const dryRun = process.argv.includes("--dry-run")
const excelArg = process.argv.indexOf("--excel")
const EXCEL =
  excelArg !== -1 ? process.argv[excelArg + 1] : join(__dirname, "Danh sách map lại môn học.xlsx")
const CATALOG_PATH = join(__dirname, "import-catalog.json")

function stripDiacritics(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
}

function normalize(s) {
  return String(s ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function normalizePath(p) {
  return String(p ?? "")
    .normalize("NFC")
    .replace(/\\/g, "/")
    .replace(/\s+/g, " ")
    .trim()
}

function shouldSkipSubject(name) {
  const n = normalize(stripDiacritics(name))
  if (!n) return false
  if (n.includes("co so ly thuyet tac chien mang")) return true
  if (n === "mon nay bo" || n === "cai nay bo") return true
  if (n.includes("mon nay bo") || n.includes("cai nay bo")) return true
  return false
}

/** Excel subject name → exact DB Subject.name */
const MANUAL_SUBJECT_MAP = {
  "Công nghệ cảm biến y sinh": "Công nghệ cảm biến Y sinh",
  "Cảm biến PLC và mạng truyền thông công nghiệp": "Cảm biến, PLC và mạng công nghiệp",
  "Kết cấu tính toán tăng thiết giáp (ngân hàng này nếu có môn khác trùng tên thì bỏ đi)":
    "Kết cấu tính toán xe tăng thiết giáp + ĐAMH",
  "Cấu tạo tăng thiết giáp (ngân hàng này nếu có môn khác trùng tên thì bỏ đi)":
    "Cấu tạo xe tăng thiết giáp",
  "Chất lượng và hiệu quả sửa chữa tăng thiết giáp": "Cơ sở đảm bảo chất lượng sửa chữa TTG",
  "Các hệ thống vũ khí khí tài tự động hoá": "Các hệ thống vũ khí, khí tài tự động hóa",
  "Cơ sở xây dựng Hệ thống điều khiển thiết bị bay":
    "Cơ sở xây dựng các hệ thống điều khiển thiết bị bay",
  "Công tác kỹ thuật ra đa sô na thời bình": "Công tác kỹ thuật ra đa so na thường xuyên + BTL",
  "Công tác kỹ thuật tăng thiết giáp thời bình": "Công tác kỹ thuật tăng - thiết giáp thời bình",
  "Công tác kỹ thuật tác chiến điện tử thời bình":
    "Công tác kỹ thuật tác chiến điện tử thường xuyên + BTL",
  "Ứng dụng CAD,CAE trong gia công áp lực": "Ứng dụng CAD/CAE trong gia công áp lực",
  "Lý thuyết + Thí nghiệm tăng thiết giáp": "Lý thuyết và thí nghiệm tăng thiết giáp",
  "những nguyên lý cơ bản của chủ nghĩa mác lê nin":
    "Những nguyên lý cơ bản của chủ nghĩa Mác - Lênin 2",
  "Những nguyên lý cơ bản của chủ nghĩa mác lê nin":
    "Những nguyên lý cơ bản của chủ nghĩa Mác - Lênin 2",
  "Kỹ thuật truy vết": "Điều tra và truy vết mạng",
  "Đường lối quốc phòng an ninh": "Đường lối quốc phòng, an ninh",
  "Thông hơi +BTL": "Thông hơi công trình + Bài tập lớn",
  "Thiết bị vũ khí, khí tài quang trên xe quân sự": "Vũ khí - khí tài quang trên tăng thiết giáp",
  "Quang sai và thiết kế quang học 1": "Quang sai và thiết kế quang học + Bài tập lớn",
  "Quang sai và thiết kế quang học 2": "Quang sai và thiết kế quang học + Bài tập lớn",
  "Quang sai và thiết kế quang học 3": "Quang sai và thiết kế quang học + Bài tập lớn",
  "Quang sai và thiết kế quang học 4": "Quang sai và thiết kế quang học + Bài tập lớn",
  "Quang sai và thiết kế quang học 5": "Quang sai và thiết kế quang học + Bài tập lớn",
}

const TYPE_ALIASES = {
  "cao học dân sự": "12",
  "cao học quân sự": "11",
  "đại học dân sự": "01",
  "đại học quân sự": "05",
  "dai hoc quan su": "05",
  "dai hoc dan su": "01",
  "cao hoc dan su": "12",
  "cao hoc quan su": "11",
  "liên thông quân sự cđ": "07",
  "lien thong quan su cd": "07",
  "liên thông quân sự tc": "15",
  "lien thong quan su tc": "15",
  "nghiên cứu sinh": "14",
  "nghien cuu sinh": "14",
  "ngắn hạn": "09",
  "ngan han": "09",
  "văn bằng 2 quân sự": "08",
  "van bang 2 quan su": "08",
  // HCKT / kho / quốc tế — có trong hệ thống, tên Excel hơi khác
  "chủ nhiệm hậu cần kỹ thuật trung lữ đoàn dài hạn": "17",
  "chu nhiem hau can ky thuat trung lu doan dai han": "17",
  "lớp chủ nhiệm hậu cần kỹ thuật trung lữ đoàn dài hạn": "17",
  "lop chu nhiem hau can ky thuat trung lu doan dai han": "17",
  "chủ nhiệm hậu cần kỹ thuật trung lữ đoàn ngắn hạn": "18",
  "chu nhiem hau can ky thuat trung lu doan ngan han": "18",
  "lớp chủ nhiệm hậu cần kỹ thuật trung lữ đoàn ngắn hạn": "18",
  "lop chu nhiem hau can ky thuat trung lu doan ngan han": "18",
  "cao học quốc tế": "21",
  "cao hoc quoc te": "21",
  "chủ nhiệm kho": "20",
  "chu nhiem kho": "20",
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url.includes("?") ? `${url}&connection_limit=1` : `${url}?connection_limit=1`,
    },
  },
})

async function main() {
  const wb = XLSX.readFile(EXCEL)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const excelRows = XLSX.utils.sheet_to_json(sheet, { defval: "" })
  console.log(`Excel: ${excelRows.length} rows from ${EXCEL}`)

  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"))
  const unmatched = catalog.unmatched
  console.log(`Catalog unmatched before: ${unmatched.length}`)

  const byRel = new Map()
  const byBase = new Map()
  for (const u of unmatched) {
    const rel = normalizePath(u.relativePath)
    byRel.set(rel, u)
    const b = basename(rel).toLowerCase()
    if (!byBase.has(b)) byBase.set(b, [])
    byBase.get(b).push(u)
  }

  const types = await prisma.$queryRaw`
    SELECT id, code, name FROM "ql-dao-tao"."TrainingObjectType" WHERE "deletedAt" IS NULL
  `
  const typeByNormName = new Map()
  for (const t of types) {
    typeByNormName.set(normalize(t.name), t)
    typeByNormName.set(normalize(stripDiacritics(t.name)), t)
  }

  function resolveTrainingType(name) {
    const raw = String(name || "").trim()
    if (!raw) return null
    // Compound / ambiguous types (dài+ngắn) — không map
    const ascii = normalize(stripDiacritics(raw))
    if (ascii.includes("dai han") && ascii.includes("ngan han")) return null

    const n = normalize(raw)
    const aliasId = TYPE_ALIASES[n] || TYPE_ALIASES[ascii]
    if (aliasId) return types.find((t) => t.id === aliasId) || null

    // Fuzzy: excel contains / contained by DB type name
    let hit = typeByNormName.get(n) || typeByNormName.get(ascii) || null
    if (hit) return hit
    for (const t of types) {
      const tn = normalize(t.name)
      const ta = normalize(stripDiacritics(t.name))
      if (tn.includes(n) || n.includes(tn) || ta.includes(ascii) || ascii.includes(ta)) {
        return t
      }
    }
    return null
  }

  const subjects = await prisma.subject.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, code: true },
  })
  const subjectByNorm = new Map()
  const subjectByAscii = new Map()
  for (const s of subjects) {
    const n = normalize(s.name)
    const a = normalize(stripDiacritics(s.name))
    if (!subjectByNorm.has(n)) subjectByNorm.set(n, [])
    subjectByNorm.get(n).push(s)
    if (!subjectByAscii.has(a)) subjectByAscii.set(a, [])
    subjectByAscii.get(a).push(s)
  }

  function findSubject(rawName) {
    const mapped =
      MANUAL_SUBJECT_MAP[rawName] ||
      Object.entries(MANUAL_SUBJECT_MAP).find(
        ([k]) =>
          normalize(k) === normalize(rawName) ||
          normalize(stripDiacritics(k)) === normalize(stripDiacritics(rawName))
      )?.[1] ||
      rawName
    const n = normalize(mapped)
    const a = normalize(stripDiacritics(mapped))
    let hits = subjectByNorm.get(n) || subjectByAscii.get(a)
    if (hits?.length) return hits[0]
    // also try raw excel name
    const nRaw = normalize(rawName)
    const aRaw = normalize(stripDiacritics(rawName))
    hits = subjectByNorm.get(nRaw) || subjectByAscii.get(aRaw)
    if (hits?.length) return hits[0]
    const candidates = []
    for (const s of subjects) {
      const sn = normalize(s.name)
      const sa = normalize(stripDiacritics(s.name))
      if (sn.includes(n) || n.includes(sn) || sa.includes(a) || a.includes(sa)) {
        candidates.push(s)
      }
    }
    if (!candidates.length) return null
    candidates.sort(
      (x, y) =>
        Math.abs(normalize(x.name).length - n.length) -
        Math.abs(normalize(y.name).length - n.length)
    )
    return candidates[0]
  }

  const subjectVersions = await prisma.subjectVersion.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      code: true,
      subjectId: true,
      trainingObjectTypeId: true,
    },
  })
  const svBySubjectAndType = new Map()
  const svBySubject = new Map()
  for (const sv of subjectVersions) {
    const k = `${sv.subjectId}::${sv.trainingObjectTypeId}`
    if (!svBySubjectAndType.has(k)) svBySubjectAndType.set(k, [])
    svBySubjectAndType.get(k).push(sv)
    if (!svBySubject.has(sv.subjectId)) svBySubject.set(sv.subjectId, [])
    svBySubject.get(sv.subjectId).push(sv)
  }

  const questionBanks = await prisma.questionBank.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, subjectVersionId: true },
  })
  const qbLookup = new Map()
  for (const qb of questionBanks) {
    qbLookup.set(`${qb.subjectVersionId}::${normalize(qb.name)}`, qb)
  }

  // Training type coverage from Excel
  const excelTypeNames = new Map()
  for (const r of excelRows) {
    const t = String(r["Đối tượng đào tạo"] || "").trim()
    excelTypeNames.set(t, (excelTypeNames.get(t) || 0) + 1)
  }
  console.log("\n=== Excel training types ===")
  for (const [k, v] of [...excelTypeNames.entries()].sort((a, b) => b[1] - a[1])) {
    const resolved = resolveTrainingType(k)
    console.log(
      `  "${k}" x${v} -> ${resolved ? `${resolved.id} (${resolved.name})` : "NOT IN SYSTEM — SKIP"}`
    )
  }

  let pathMatched = 0
  let pathMiss = 0
  let skipTacChien = 0
  let skipNoType = 0
  let skipNoSubject = 0
  let toMatched = 0
  let toMissingSv = 0

  const skipNoSubjectNames = new Map()
  const skipNoTypeNames = new Map()
  const newlyMatched = []
  const newlyMissingSv = []
  const stillUnmatched = []
  const usedUnmatched = new Set()

  function findCatalogEntry(relExcel) {
    let entry = byRel.get(relExcel)
    if (entry && !usedUnmatched.has(entry.relativePath)) return entry
    const b = basename(relExcel).toLowerCase()
    const cands = (byBase.get(b) || []).filter((u) => !usedUnmatched.has(u.relativePath))
    if (cands.length === 1) return cands[0]
    for (const u of unmatched) {
      if (usedUnmatched.has(u.relativePath)) continue
      const r = normalizePath(u.relativePath)
      const aParts = relExcel.split("/")
      const bParts = r.split("/")
      if (aParts.slice(-2).join("/") === bParts.slice(-2).join("/")) return u
    }
    // Unicode-insensitive path compare
    const asciiRel = normalize(stripDiacritics(relExcel))
    for (const u of unmatched) {
      if (usedUnmatched.has(u.relativePath)) continue
      if (normalize(stripDiacritics(normalizePath(u.relativePath))) === asciiRel) return u
    }
    return null
  }

  for (const row of excelRows) {
    const relExcel = normalizePath(row["Đường dẫn"])
    const subjectNameExcel = String(row["Tên môn học"] || "").trim()
    const typeNameExcel = String(row["Đối tượng đào tạo"] || "").trim()

    const entry = findCatalogEntry(relExcel)
    if (!entry) {
      pathMiss++
      continue
    }
    pathMatched++

    if (
      shouldSkipSubject(subjectNameExcel) ||
      shouldSkipSubject(entry.subjectName) ||
      shouldSkipSubject(entry.subjectFolderName || "") ||
      shouldSkipSubject(typeNameExcel)
    ) {
      skipTacChien++
      const reason =
        shouldSkipSubject(subjectNameExcel) &&
        (normalize(stripDiacritics(subjectNameExcel)).includes("bo") ||
          normalize(stripDiacritics(subjectNameExcel)).includes("mon nay") ||
          normalize(stripDiacritics(subjectNameExcel)).includes("cai nay"))
          ? `SKIPPED: đánh dấu bỏ ("${subjectNameExcel}")`
          : "SKIPPED: Cơ sở lý thuyết tác chiến mạng (tạm thời)"
      stillUnmatched.push({
        ...entry,
        reason,
        remappedSubjectName: subjectNameExcel,
        remappedTrainingType: typeNameExcel,
      })
      usedUnmatched.add(entry.relativePath)
      continue
    }

    const tot =
      resolveTrainingType(typeNameExcel) ||
      (entry.trainingTypeId ? types.find((t) => t.id === entry.trainingTypeId) : null)
    if (!tot) {
      skipNoType++
      skipNoTypeNames.set(typeNameExcel, (skipNoTypeNames.get(typeNameExcel) || 0) + 1)
      stillUnmatched.push({
        ...entry,
        reason: `SKIPPED: Đối tượng đào tạo không có trong hệ thống ("${typeNameExcel}")`,
        remappedSubjectName: subjectNameExcel,
        remappedTrainingType: typeNameExcel,
      })
      usedUnmatched.add(entry.relativePath)
      continue
    }

    const subject = findSubject(subjectNameExcel)
    if (!subject) {
      skipNoSubject++
      skipNoSubjectNames.set(subjectNameExcel, (skipNoSubjectNames.get(subjectNameExcel) || 0) + 1)
      stillUnmatched.push({
        ...entry,
        reason: `Remap: No matching Subject found for "${subjectNameExcel}"`,
        remappedSubjectName: subjectNameExcel,
        remappedTrainingType: typeNameExcel,
      })
      usedUnmatched.add(entry.relativePath)
      continue
    }

    usedUnmatched.add(entry.relativePath)
    const trainingTypeId = tot.id
    const updated = {
      ...entry,
      subjectName: subjectNameExcel,
      trainingTypeId,
      subjectId: subject.id,
      subjectName_db: subject.name,
      subjectCode: subject.code,
      remappedSubjectName: subjectNameExcel,
      remappedTrainingType: typeNameExcel,
    }

    const svKey = `${subject.id}::${trainingTypeId}`
    const svList = svBySubjectAndType.get(svKey)
    if (!svList || svList.length === 0) {
      const anySv = svBySubject.get(subject.id)
      newlyMissingSv.push({
        ...updated,
        templateSvId: anySv?.[0]?.id || null,
        templateSvTrainingType: anySv?.[0]?.trainingObjectTypeId || null,
      })
      toMissingSv++
    } else {
      const sv = svList[0]
      const qb = qbLookup.get(`${sv.id}::${normalize(entry.bankName)}`)
      newlyMatched.push({
        ...updated,
        subjectVersionId: sv.id,
        subjectVersionCode: sv.code,
        trainingObjectTypeId: sv.trainingObjectTypeId,
        questionBankId: qb?.id || null,
        questionBankExists: !!qb,
      })
      toMatched++
    }
  }

  for (const u of unmatched) {
    if (!usedUnmatched.has(u.relativePath)) stillUnmatched.push(u)
  }

  console.log("\n=== Remap stats ===")
  console.log({
    excelRows: excelRows.length,
    catalogUnmatchedBefore: unmatched.length,
    pathMatched,
    pathMiss,
    skipTacChien,
    skipNoType,
    skipNoSubject,
    toMatched,
    toMissingSv,
    stillUnmatched: stillUnmatched.length,
  })

  if (skipNoSubjectNames.size) {
    console.log("\nNo matching Subject in DB:")
    for (const [k, v] of [...skipNoSubjectNames.entries()].sort()) console.log(`  "${k}" x${v}`)
  }
  if (skipNoTypeNames.size) {
    console.log("\nSkipped training types (not in system):")
    for (const [k, v] of [...skipNoTypeNames.entries()].sort()) console.log(`  "${k}" x${v}`)
  }

  const missGroups = new Map()
  for (const m of newlyMissingSv) {
    const k = `${m.subjectName_db} [${m.trainingTypeId}]`
    missGroups.set(k, (missGroups.get(k) || 0) + 1)
  }
  console.log(`\nWill create SV for ${missGroups.size} subject×type groups:`)
  for (const [k, v] of [...missGroups.entries()].sort()) console.log(`  ${k} x${v}`)

  const noTemplate = newlyMissingSv.filter((m) => !m.templateSvId)
  if (noTemplate.length) {
    console.log(`\nWARNING: ${noTemplate.length} entries have no template SV to clone`)
    const uniq = [...new Set(noTemplate.map((m) => m.subjectName_db))]
    console.log("  subjects:", uniq.join(", "))
  }

  const updatedCatalog = {
    ...catalog,
    generatedAt: new Date().toISOString(),
    remappedFromExcel: {
      excel: EXCEL,
      at: new Date().toISOString(),
      stats: {
        pathMatched,
        pathMiss,
        skipTacChien,
        skipNoType,
        skipNoSubject,
        toMatched,
        toMissingSv,
      },
    },
    summary: {
      totalFiles: catalog.summary.totalFiles,
      matched: catalog.matched.length + newlyMatched.length,
      missingSv: (catalog.missingSv?.length || 0) + newlyMissingSv.length,
      unmatched: stillUnmatched.length,
    },
    matched: [...catalog.matched, ...newlyMatched],
    missingSv: [...(catalog.missingSv || []), ...newlyMissingSv],
    unmatched: stillUnmatched,
  }

  if (dryRun) {
    console.log("\n[DRY RUN] catalog not written")
    writeFileSync(
      "/tmp/nhch-remap-preview.json",
      JSON.stringify(
        {
          stats: updatedCatalog.remappedFromExcel.stats,
          newlyMatchedCount: newlyMatched.length,
          newlyMissingSvCount: newlyMissingSv.length,
          stillUnmatchedCount: stillUnmatched.length,
          missGroups: Object.fromEntries(missGroups),
        },
        null,
        2
      )
    )
    return
  }

  // Backup then write
  writeFileSync(
    join(__dirname, `import-catalog.backup-${Date.now()}.json`),
    JSON.stringify(catalog),
    "utf8"
  )
  writeFileSync(CATALOG_PATH, JSON.stringify(updatedCatalog, null, 2), "utf8")
  console.log(`\nUpdated ${CATALOG_PATH}`)
  console.log(
    `matched=${updatedCatalog.summary.matched} missingSv=${updatedCatalog.summary.missingSv} unmatched=${updatedCatalog.summary.unmatched}`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
