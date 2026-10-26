/**
 * Nạp Lecturer.TKPUcode từ file Excel TKPU (DS GV HV_co ma.xls).
 *
 * Pha 1: tên unique + bộ môn khớp đơn vị DB
 * Pha 2: tên unique trên file và trên DB (không cần bộ môn)
 * Bỏ qua dòng giả (BM .../K12), không nạp mã.
 *
 * Usage:
 *   cd packages/database
 *   bun scripts/load-lecturer-tkpu-code.mjs
 *   bun scripts/load-lecturer-tkpu-code.mjs --apply
 *   bun scripts/load-lecturer-tkpu-code.mjs --excel "/path/DS GV HV_co ma.xls" --apply
 *
 * Mặc định dry-run. --force ghi đè TKPUcode đã có.
 */
import { createRequire } from "node:module"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "../generated/prisma-client/index.js"

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

function loadDotenv() {
  const envPath = join(__dirname, "../.env")
  if (!existsSync(envPath)) return
  for (const raw of readFileSync(envPath, "utf8").split("\n")) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadDotenv()

function loadXlsx() {
  const candidates = [
    "xlsx",
    join(__dirname, "../node_modules/xlsx"),
    join(__dirname, "../../../apps/backend/be-ql-dao-tao/node_modules/xlsx"),
    join(__dirname, "../../../apps/backend/be-portal/node_modules/xlsx"),
    join(__dirname, "../../../node_modules/xlsx"),
  ]
  for (const candidate of candidates) {
    try {
      return require(candidate)
    } catch {
      /* next */
    }
  }
  throw new Error("Không tìm thấy package xlsx")
}

const XLSX = loadXlsx()
const APPLY = process.argv.includes("--apply")
const FORCE = process.argv.includes("--force")
const excelArg = process.argv.indexOf("--excel")
const EXCEL =
  excelArg !== -1
    ? process.argv[excelArg + 1]
    : join(process.env.HOME || "", "Downloads/DS GV HV_co ma.xls")
const REPORT = join(__dirname, "tkpu-load-report.csv")

const STOP_ORG = new Set([
  "va",
  "và",
  "the",
  "of",
  "bm",
  "bo",
  "mon",
  "bộ",
  "môn",
  "khoa",
  "vien",
  "viện",
  "hoc",
  "học",
])

function nfc(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
}

function nameKey(value) {
  return nfc(value)
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function isDummyName(name) {
  const key = nameKey(name)
  return /^bm\s/.test(key) || /\/k\d/.test(key)
}

function orgTokens(value) {
  let text = nameKey(value)
  for (const token of ["bộ môn", "khoa", "viện", "trung tâm", "phòng"]) {
    text = text.replaceAll(token, " ")
  }
  text = text.replace(/[^0-9a-zà-ỹ\s]/g, " ")
  return new Set(
    text
      .split(/\s+/)
      .filter((token) => token.length >= 3 && !STOP_ORG.has(token))
  )
}

function orgScore(excelBoMon, excelKhoa, dbOrg, dbParent) {
  const excelTokens = new Set([...orgTokens(excelBoMon), ...orgTokens(excelKhoa)])
  const dbTokens = new Set([...orgTokens(dbOrg), ...orgTokens(dbParent)])
  if (!excelTokens.size || !dbTokens.size) return 0
  let inter = 0
  for (const token of excelTokens) {
    if (dbTokens.has(token)) inter += 1
  }
  let score = inter / Math.min(excelTokens.size, dbTokens.size)
  const excelText = nameKey(`${excelBoMon} ${excelKhoa}`)
  const dbText = nameKey(`${dbOrg} ${dbParent}`)
  const boMonKey = nameKey(excelBoMon)
  const orgKey = nameKey(dbOrg)
  if (boMonKey && (dbText.includes(boMonKey) || (orgKey && excelText.includes(orgKey)))) {
    score = Math.max(score, 0.7)
  }
  return score
}

function csvEscape(value) {
  const text = String(value ?? "")
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}

function readExcelRows(path) {
  if (!existsSync(path)) {
    throw new Error(`Không thấy file Excel: ${path}`)
  }
  const workbook = XLSX.readFile(path)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false })
  const headerIndex = matrix.findIndex(
    (row) => nfc(row[0]) === "STT" && nfc(row[1]).toLowerCase().includes("mã gv")
  )
  if (headerIndex < 0) {
    throw new Error("Không tìm thấy header STT / Mã GV")
  }
  const rows = []
  for (const row of matrix.slice(headerIndex + 1)) {
    const maGV = nfc(row[1])
    const ten = nfc(row[2])
    if (!maGV && !ten) continue
    rows.push({
      maGV,
      ten,
      idTkpu: nfc(row[3]),
      khoa: nfc(row[9]),
      boMon: nfc(row[10]),
      nameKey: nameKey(ten),
      boMonKey: nameKey(row[10]),
    })
  }
  return rows
}

function pickByBoMon(excelRow, dbHits) {
  const scored = dbHits
    .map((lecturer) => ({
      lecturer,
      score: orgScore(
        excelRow.boMon,
        excelRow.khoa,
        lecturer.orgTen,
        lecturer.parentTen
      ),
    }))
    .sort((a, b) => b.score - a.score)
  const matched = scored.filter((item) => item.score >= 0.5)
  if (matched.length === 1) return matched[0]
  if (!scored.length) return null
  const best = scored[0]
  const second = scored[1]?.score ?? 0
  if (best.score >= 0.5 && best.score - second >= 0.25) return best
  return null
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is required")

  const prisma = new PrismaClient({
    datasources: { db: { url: `${url}${url.includes("?") ? "&" : "?"}connection_limit=1` } },
  })

  try {
    await run(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

async function run(prisma) {
  const excelRows = readExcelRows(EXCEL)
  const orgs = await prisma.dM_DonVi.findMany({
    select: { Id: true, sTen: true, sParentId: true },
  })
  const orgById = new Map(orgs.map((org) => [org.Id, org]))

  const lecturers = await prisma.lecturer.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      TKPUcode: true,
      userProfile: {
        select: {
          code: true,
          fullname: true,
          sDM_DonViId: true,
        },
      },
    },
  })

  const dbRows = lecturers.map((lecturer) => {
    const org = orgById.get(lecturer.userProfile?.sDM_DonViId)
    const parent = org?.sParentId ? orgById.get(org.sParentId) : null
    return {
      id: lecturer.id,
      TKPUcode: lecturer.TKPUcode,
      code: lecturer.userProfile?.code || "",
      fullname: lecturer.userProfile?.fullname || "",
      nameKey: nameKey(lecturer.userProfile?.fullname),
      orgTen: org?.sTen || "",
      parentTen: parent?.sTen || "",
    }
  })

  const dbByName = new Map()
  for (const row of dbRows) {
    if (!row.nameKey) continue
    const list = dbByName.get(row.nameKey) || []
    list.push(row)
    dbByName.set(row.nameKey, list)
  }

  const usedCodes = new Set(
    dbRows.map((row) => nfc(row.TKPUcode)).filter(Boolean)
  )
  const assignedLecturer = new Set()
  const assignedExcel = new Set()
  const updates = []
  const report = []

  const pushReport = (status, phase, excel, lecturer = null, note = "") => {
    report.push({
      status,
      phase,
      maGV: excel.maGV,
      ten: excel.ten,
      khoa: excel.khoa,
      boMon: excel.boMon,
      dbId: lecturer?.id || "",
      dbCode: lecturer?.code || "",
      dbName: lecturer?.fullname || "",
      dbOrg: lecturer ? `${lecturer.parentTen} / ${lecturer.orgTen}`.replace(/^ \//, "") : "",
      note,
    })
  }

  const canAssign = (excel, lecturer, phase) => {
    if (!excel.maGV) {
      pushReport("skip", phase, excel, lecturer, "thiếu mã GV")
      return false
    }
    if (assignedExcel.has(excel.maGV)) return false
    if (assignedLecturer.has(lecturer.id)) {
      pushReport("skip", phase, excel, lecturer, "giảng viên đã được gán mã khác")
      return false
    }
    if (lecturer.TKPUcode && lecturer.TKPUcode !== excel.maGV && !FORCE) {
      pushReport(
        "skip",
        phase,
        excel,
        lecturer,
        `đã có TKPUcode=${lecturer.TKPUcode}`
      )
      return false
    }
    if (usedCodes.has(excel.maGV) && lecturer.TKPUcode !== excel.maGV) {
      pushReport("conflict", phase, excel, lecturer, "mã TKPU đã gắn GV khác")
      return false
    }
    return true
  }

  const assign = (excel, lecturer, phase, note) => {
    if (!canAssign(excel, lecturer, phase)) return
    assignedExcel.add(excel.maGV)
    assignedLecturer.add(lecturer.id)
    usedCodes.add(excel.maGV)
    updates.push({
      id: lecturer.id,
      TKPUcode: excel.maGV,
      phase,
      ten: excel.ten,
      dbName: lecturer.fullname,
    })
    pushReport("ok", phase, excel, lecturer, note)
  }

  const nameCountExcel = new Map()
  const nameBoMonCount = new Map()
  for (const row of excelRows) {
    if (!row.nameKey || isDummyName(row.ten)) continue
    nameCountExcel.set(row.nameKey, (nameCountExcel.get(row.nameKey) || 0) + 1)
    const pair = `${row.nameKey}||${row.boMonKey}`
    nameBoMonCount.set(pair, (nameBoMonCount.get(pair) || 0) + 1)
  }

  // Pha 1: unique tên + bộ môn
  for (const excel of excelRows) {
    if (isDummyName(excel.ten)) {
      pushReport("dummy", "1", excel, null, "bỏ qua dòng giả, không nạp mã")
      continue
    }
    if (!excel.nameKey) {
      pushReport("skip", "1", excel, null, "thiếu tên")
      continue
    }
    const pairKey = `${excel.nameKey}||${excel.boMonKey}`
    if ((nameBoMonCount.get(pairKey) || 0) > 1) {
      pushReport("skip", "1", excel, null, "tên+bộ môn trùng trên file")
      continue
    }
    const hits = dbByName.get(excel.nameKey) || []
    if (!hits.length) {
      pushReport("unmatched", "1", excel, null, "không có tên trên DB")
      continue
    }
    const picked = pickByBoMon(excel, hits)
    if (!picked) {
      pushReport(
        "unmatched",
        "1",
        excel,
        hits.length === 1 ? hits[0] : null,
        hits.length === 1 ? "tên khớp, bộ môn không khớp" : `trùng tên ${hits.length} người, bộ môn không tách được`
      )
      continue
    }
    assign(excel, picked.lecturer, "1", `tên+bộ môn score=${picked.score.toFixed(2)}`)
  }

  // Pha 2: unique tên
  for (const excel of excelRows) {
    if (assignedExcel.has(excel.maGV) || isDummyName(excel.ten) || !excel.nameKey) continue
    if ((nameCountExcel.get(excel.nameKey) || 0) > 1) {
      pushReport("skip", "2", excel, null, "tên trùng trên file")
      continue
    }
    const hits = (dbByName.get(excel.nameKey) || []).filter(
      (row) => !assignedLecturer.has(row.id)
    )
    if (hits.length !== 1) {
      pushReport(
        "unmatched",
        "2",
        excel,
        hits[0] || null,
        hits.length === 0 ? "không còn GV tên này trên DB" : `tên trùng ${hits.length} người trên DB`
      )
      continue
    }
    assign(excel, hits[0], "2", "tên unique")
  }

  const header = [
    "status",
    "phase",
    "maGV",
    "ten",
    "khoa",
    "boMon",
    "dbId",
    "dbCode",
    "dbName",
    "dbOrg",
    "note",
  ]
  const csv = [
    header.join(","),
    ...report.map((row) => header.map((key) => csvEscape(row[key])).join(",")),
  ].join("\n")
  writeFileSync(REPORT, csv)

  const leftover = excelRows.filter(
    (row) => !assignedExcel.has(row.maGV) && !isDummyName(row.ten)
  )

  console.log(
    JSON.stringify(
      {
        mode: APPLY ? "apply" : "dry-run",
        excel: EXCEL,
        excelRows: excelRows.length,
        dbLecturers: dbRows.length,
        phase1: updates.filter((item) => item.phase === "1").length,
        phase2: updates.filter((item) => item.phase === "2").length,
        totalAssign: updates.length,
        leftover: leftover.length,
        conflict: report.filter((row) => row.status === "conflict").length,
        dummySkip: excelRows.filter((row) => isDummyName(row.ten)).length,
        report: REPORT,
      },
      null,
      2
    )
  )

  if (!APPLY) {
    console.log("\nDry-run. Thêm --apply để ghi TKPUcode.")
    return
  }

  let updated = 0
  for (const item of updates) {
    await prisma.lecturer.update({
      where: { id: item.id },
      data: { TKPUcode: item.TKPUcode },
    })
    updated += 1
  }
  console.log(`Đã cập nhật ${updated} giảng viên.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
