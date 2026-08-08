/**
 * Upsert lịch học K18 (HK1 2026-2027) từ 2 file Excel:
 *  1) TKB filled  → mã LMH, thứ, tiết, kíp (sáng/chiều), phòng
 *  2) GV đang dạy → ngày học (map theo mã MH + thứ + phòng/tiết)
 *
 * Kíp / thứ / tiết luôn lấy từ file TKB.
 * File GV chỉ dùng để lấy danh sách ngày.
 * Một số mã TKB được map sang mã LMH đang có trên DB (xem CODE_MAP).
 *
 * Usage:
 *   cd packages/database
 *   DATABASE_URL='postgresql://...' node scripts/upsert-tkb-k18-schedules.mjs
 *
 * Options:
 *   --tkb <path>         File TKB filled (default: ~/Downloads/Copy of TKB_K18_filled V2.xlsx)
 *   --gv <path>          File GV ngày dạy (default: ~/Downloads/TKB_DS_K18_26-27-HK1_Giao_vien_dang_co_gio_day.xlsx)
 *   --semester <id>      semesterId lọc LMH (default: 084)
 *   --dry-run            Chỉ parse + match, không ghi DB
 *   --only <code,...>    Chỉ upsert các mã TKB (hoặc mã DB) trong list, vd: --only "09BW 1,47AB 1"
 *   --skip-missing-dates Vẫn cập nhật SubjectClassTime dù không có ngày từ file GV
 *
 * Bỏ qua LMH không có thứ/tiết cố định (vd: 39AJ — theo KH GV).
 */

import { createRequire } from "node:module"
import { homedir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaClient, $Enums } from "../generated/prisma-client/index.js"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat.js"

dayjs.extend(customParseFormat)

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadXlsx() {
  const candidates = [
    "xlsx",
    path.resolve(__dirname, "../../../apps/backend/be-ql-dao-tao/node_modules/xlsx"),
    path.resolve(__dirname, "../../../apps/backend/be-portal/node_modules/xlsx"),
    path.resolve(__dirname, "../../../node_modules/xlsx"),
  ]
  for (const c of candidates) {
    try {
      return require(c)
    } catch {
      // try next
    }
  }
  throw new Error(
    "Không tìm thấy package `xlsx`. Cài tạm: pnpm add -D xlsx --filter @workspace/db\n" +
      "hoặc chạy script từ monorepo đã có xlsx (be-ql-dao-tao)."
  )
}

const XLSX = loadXlsx()

/** Map mã trên file TKB → mã SubjectClass đang có trên DB (HK 084) */
const CODE_MAP = {
  // exact
  "01BE": "02BF 1",
  "03BA": "03BA 1",
  "04AE": "04AE 1",
  "08AE": "08AF 1",
  "08AX": "08BD 1",
  "08AY": "08BB 1",
  "08BA": "08AA 1",
  "09BW 1": "09AP 1",
  "09BW 2": "09AP 2",
  "12AP": "12AP 1",
  "25BA": "25BA 1",
  "32BQ": "32CV 1",
  "33CG": "33CG 1",
  "39BG": "39BG 1",
  "39BV": "39BV 1",
}

/** Prefix map: TKB_PREFIX N → DB_PREFIX N */
const PREFIX_MAP = [
  { from: "05BH", to: "05BJ" },
  { from: "47AB", to: "47AA" },
  // File TKB ghi 72BE (Tiếng Anh 1); DB dùng 72AA (user từng ghi 71AA — không tồn tại trên DB)
  { from: "72BE", to: "72AA" },
]

/** Slot gần đúng: chỉ lấy ngày từ GV (không lấy kíp/tiết GV) */
const FUZZY_SLOT_KEYS = new Set([
  "01AO 1|4|7|10",
  "09BW 1|6|1|2",
  "31BR 1|5|1|3",
  "31BR 2|3|1|3",
  "31BR 3|5|4|6",
  "73BC 3|2|9|12",
])

const DEFAULT_TKB = path.join(homedir(), "Downloads", "Copy of TKB_K18_filled V2.xlsx")
const DEFAULT_GV = path.join(
  homedir(),
  "Downloads",
  "TKB_DS_K18_26-27-HK1_Giao_vien_dang_co_gio_day.xlsx"
)

function parseArgs(argv) {
  const out = {
    tkb: DEFAULT_TKB,
    gv: DEFAULT_GV,
    semester: "084",
    dryRun: false,
    only: null,
    skipMissingDates: true,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--tkb") out.tkb = argv[++i]
    else if (a === "--gv") out.gv = argv[++i]
    else if (a === "--semester") out.semester = String(argv[++i])
    else if (a === "--dry-run") out.dryRun = true
    else if (a === "--only") {
      out.only = new Set(
        String(argv[++i])
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    } else if (a === "--skip-missing-dates") out.skipMissingDates = true
    else if (a === "--require-dates") out.skipMissingDates = false
    else if (a === "--help" || a === "-h") {
      console.log(`Usage: DATABASE_URL=... node scripts/upsert-tkb-k18-schedules.mjs [options]
  --tkb <path>  --gv <path>  --semester 084  --dry-run  --only "code1,code2"
  --require-dates   Bỏ qua LMH không có ngày (mặc định vẫn upsert khung giờ)`)
      process.exit(0)
    }
  }
  return out
}

function sheetToRows(filePath, sheetName) {
  const wb = XLSX.readFile(filePath, { cellDates: true })
  const name = sheetName || wb.SheetNames[0]
  const ws = wb.Sheets[name]
  if (!ws) throw new Error(`Không tìm thấy sheet "${name}" trong ${filePath}`)
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true })
}

function parseTiet(s) {
  if (s == null || s === "") return [null, null]
  const str = String(s)
    .trim()
    .replace(/[–→]/g, "-")
    .replace("->", "-")
  const m = str.match(/(\d+)\s*-\s*(\d+)/)
  if (!m) return [null, null]
  return [Number(m[1]), Number(m[2])]
}

function kipFromStart(st) {
  return st != null && st >= 7 ? "AFTERNOON" : "MORNING"
}

function kipLabel(st) {
  return kipFromStart(st) === "AFTERNOON" ? "Chiều" : "Sáng"
}

function normalizeRoom(r) {
  if (!r) return ""
  const raw = String(r).trim()
  const low = raw.toLowerCase()
  const compact = low.replace(/[.\s]/g, "")
  if (
    low.includes("bãi") ||
    compact === "btap" ||
    compact === "baitap" ||
    compact.startsWith("btap")
  ) {
    return "BAITAP"
  }
  return raw.toUpperCase().replace(/\s+/g, "")
}

function gvPeriodsToAbsolute(ca, start, end) {
  const cl = String(ca || "").toLowerCase()
  if ((cl.includes("chiều") || cl.includes("chieu")) && start != null && start < 7) {
    return [start + 6, end + 6]
  }
  return [start, end]
}

function thuVnFromDate(d) {
  // VN TKB: Mon=2 … Sat=7, Sun=8
  const day = d.getDay() // Sun=0 … Sat=6
  if (day === 0) return 8
  return day + 1
}

function parseNgay(v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const d = new Date(v.getFullYear(), v.getMonth(), v.getDate())
    return { date: d, text: dayjs(d).format("DD/MM/YYYY") }
  }
  if (v == null || v === "") return { date: null, text: null }
  const s = String(v).trim()
  const parsed = dayjs(s, ["DD/MM/YYYY", "YYYY-MM-DD", "D/M/YYYY"], true)
  if (!parsed.isValid()) return { date: null, text: s }
  const d = parsed.toDate()
  return { date: d, text: parsed.format("DD/MM/YYYY") }
}

function nameOverlap(a, b) {
  const split = (s) =>
    new Set(
      String(s || "")
        .split(/[,;]/)
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
    )
  const na = split(a)
  const nb = split(b)
  for (const x of na) if (nb.has(x)) return true
  return false
}

function mapTkbCodeToDb(tkbCode) {
  if (CODE_MAP[tkbCode]) return CODE_MAP[tkbCode]
  for (const { from, to } of PREFIX_MAP) {
    const m = tkbCode.match(new RegExp(`^${from}\\s+(\\d+)$`, "i"))
    if (m) return `${to} ${m[1]}`
  }
  return tkbCode
}

function parseThuCell(v) {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v)
  if (v == null) return null
  const s = String(v).trim()
  if (/^\d+$/.test(s)) return Number(s)
  return s // e.g. "Theo KH của GV"
}

/** Đọc TKB → slots theo mã LMH TKB */
function loadTkbSlots(tkbPath) {
  const rows = sheetToRows(tkbPath)
  // tìm header row có "Mã LMH"
  let headerIdx = -1
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const r = rows[i] || []
    if (r.some((c) => String(c || "").includes("Mã LMH"))) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) throw new Error("Không tìm thấy header Mã LMH trong file TKB")

  const header = rows[headerIdx].map((c) => String(c || "").trim())
  const col = (name) => header.findIndex((h) => h === name || h.includes(name))
  const iMaMh = col("Mã MH")
  const iTen = col("Môn học")
  const iLmh = col("Mã LMH")
  const iGv = col("Giảng Viên") >= 0 ? col("Giảng Viên") : col("Giảng viên")
  const iThu = col("Thứ")
  const iTiet = col("Tiết")
  const iGd = col("Giảng đường") >= 0 ? col("Giảng đường") : col("Phòng")

  const byLmh = new Map()
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i] || []
    const maLmh = r[iLmh] != null ? String(r[iLmh]).trim() : ""
    if (!maLmh) continue
    const thu = parseThuCell(r[iThu])
    const [start, end] = parseTiet(r[iTiet])
    const slot = {
      maMh: r[iMaMh] != null ? String(r[iMaMh]).trim() : "",
      tenMh: r[iTen] != null ? String(r[iTen]).trim() : "",
      maLmh,
      gv: r[iGv] != null ? String(r[iGv]).trim() : "",
      thu,
      start,
      end,
      gd: r[iGd] != null ? String(r[iGd]).trim() : "",
      kip: kipFromStart(start),
    }
    if (!byLmh.has(maLmh)) byLmh.set(maLmh, [])
    byLmh.get(maLmh).push(slot)
  }
  return byLmh
}

/** Đọc file GV → rows ngày dạy */
function loadGvRows(gvPath) {
  const rows = sheetToRows(gvPath, "GV dang day")
  let headerIdx = -1
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const r = rows[i] || []
    if (
      r.some((c) => String(c || "").trim() === "Mã môn") &&
      r.some((c) => String(c || "").includes("Ngày"))
    ) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) {
    // fallback: row index 2 (0-based) như file mẫu
    headerIdx = 2
  }
  const header = (rows[headerIdx] || []).map((c) => String(c || "").trim())
  const idx = (names) => {
    for (const n of names) {
      const i = header.findIndex((h) => h === n || h.includes(n))
      if (i >= 0) return i
    }
    return -1
  }
  const iMaMh = idx(["Mã môn"])
  const iTenGv = idx(["Tên GV"])
  const iPhong = idx(["Mã phòng"])
  const iNgay = idx(["Ngày"])
  const iCa = idx(["Ca học"])
  const iHocTu = idx(["Học từ"])

  const out = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i] || []
    const maMh = r[iMaMh] != null ? String(r[iMaMh]).trim() : ""
    if (!maMh && r[iNgay] == null) continue
    const { date, text } = parseNgay(r[iNgay])
    const [gs, ge] = parseTiet(r[iHocTu])
    const ca = r[iCa] != null ? String(r[iCa]).trim() : ""
    const [absS, absE] = gvPeriodsToAbsolute(ca, gs, ge)
    out.push({
      maMh,
      tenGv: r[iTenGv] != null ? String(r[iTenGv]).trim() : "",
      maPhong: r[iPhong] != null ? String(r[iPhong]).trim() : "",
      roomNorm: normalizeRoom(r[iPhong]),
      ngay: text,
      ngayDate: date,
      thuVn: date ? thuVnFromDate(date) : null,
      ca,
      startAbs: absS,
      endAbs: absE,
    })
  }
  return out
}

function matchDatesForSlot(slot, gvRows) {
  if (typeof slot.thu !== "number" || slot.start == null) {
    return { dates: [], note: "Không có thứ/tiết cố định (theo KH GV)" }
  }
  const roomN = normalizeRoom(slot.gd)
  const st = slot.start
  const en = slot.end
  const key = `${slot.maLmh}|${slot.thu}|${st}|${en}`
  const isFuzzy = FUZZY_SLOT_KEYS.has(key)

  const collect = (pred) =>
    gvRows.filter(
      (g) => g.maMh === slot.maMh && g.thuVn === slot.thu && g.startAbs != null && pred(g)
    )

  const strategies = isFuzzy
    ? [
        [
          "Gần đúng — chỉ lấy ngày từ GV (phòng + giao tiết)",
          (g) => g.roomNorm === roomN && !(g.endAbs < st || g.startAbs > en),
        ],
        [
          "Gần đúng — chỉ lấy ngày từ GV (tiết + tên GV)",
          (g) => g.startAbs === st && g.endAbs === en && nameOverlap(slot.gv, g.tenGv),
        ],
        [
          "Gần đúng — chỉ lấy ngày từ GV (thứ + phòng + GV)",
          (g) => g.roomNorm === roomN && nameOverlap(slot.gv, g.tenGv),
        ],
        ["Gần đúng — chỉ lấy ngày từ GV (thứ + tiết)", (g) => g.startAbs === st && g.endAbs === en],
      ]
    : [
        [
          "Khớp mã MH + thứ + phòng + tiết",
          (g) => g.roomNorm === roomN && g.startAbs === st && g.endAbs === en,
        ],
        [
          "Khớp mã MH + thứ + phòng + giao tiết",
          (g) =>
            g.roomNorm === roomN &&
            kipFromStart(g.startAbs) === slot.kip &&
            !(g.endAbs < st || g.startAbs > en),
        ],
        [
          "Khớp mã MH + thứ + tiết + tên GV",
          (g) => g.startAbs === st && g.endAbs === en && nameOverlap(slot.gv, g.tenGv),
        ],
        ["Khớp mã MH + thứ + tiết (phòng khác)", (g) => g.startAbs === st && g.endAbs === en],
      ]

  let cands = []
  let note = "Không tìm thấy ngày học trên file GV"
  for (const [n, pred] of strategies) {
    cands = collect(pred)
    if (cands.length) {
      note = n
      break
    }
  }
  const dates = [...new Set(cands.map((g) => g.ngay).filter(Boolean))].sort(
    (a, b) => dayjs(a, "DD/MM/YYYY").valueOf() - dayjs(b, "DD/MM/YYYY").valueOf()
  )
  return { dates, note }
}

function buildPayload(tkbByLmh, gvRows) {
  const items = []
  for (const [maLmh, slots] of [...tkbByLmh.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    // bỏ LMH không có thứ số
    const usableSlots = slots.filter(
      (s) => typeof s.thu === "number" && s.start != null && s.end != null
    )
    if (!usableSlots.length) continue

    const enriched = usableSlots.map((s) => {
      const { dates, note } = matchDatesForSlot(s, gvRows)
      return { ...s, dates, note }
    })

    const kips = new Set(enriched.map((s) => s.kip))
    const schedule =
      kips.has("AFTERNOON") && kips.size === 1
        ? "AFTERNOON"
        : kips.has("MORNING") && kips.size === 1
          ? "MORNING"
          : kips.has("AFTERNOON")
            ? "AFTERNOON"
            : "MORNING"

    items.push({
      tkbCode: maLmh,
      dbCode: mapTkbCodeToDb(maLmh),
      tenMh: enriched[0].tenMh,
      schedule,
      slots: enriched.map((s) => ({
        thu: s.thu,
        kip: s.kip,
        start: s.start,
        end: s.end,
        gd: s.gd,
        dates: s.dates,
        note: s.note,
      })),
    })
  }
  return items
}

async function findSubjectClass(prisma, dbCode, semesterId) {
  let sc = await prisma.subjectClass.findFirst({
    where: {
      code: { equals: dbCode, mode: "insensitive" },
      deletedAt: null,
      ...(semesterId ? { semesterId } : {}),
    },
    select: {
      id: true,
      code: true,
      name: true,
      schedule: true,
      semesterId: true,
      roomId: true,
      lecturerId: true,
      extraLecturerId: true,
      status: true,
    },
  })
  if (sc) return sc
  // fallback không lọc semester
  return prisma.subjectClass.findFirst({
    where: { code: { equals: dbCode, mode: "insensitive" }, deletedAt: null },
    select: {
      id: true,
      code: true,
      name: true,
      schedule: true,
      semesterId: true,
      roomId: true,
      lecturerId: true,
      extraLecturerId: true,
      status: true,
    },
  })
}

async function upsertOne(prisma, item, semesterId) {
  let subjectClass = null
  if (semesterId) {
    subjectClass = await prisma.subjectClass.findFirst({
      where: {
        code: { equals: item.dbCode, mode: "insensitive" },
        deletedAt: null,
        semesterId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        schedule: true,
        semesterId: true,
        roomId: true,
        lecturerId: true,
        extraLecturerId: true,
        status: true,
      },
    })
  }
  if (!subjectClass) {
    subjectClass = await findSubjectClass(prisma, item.dbCode, null)
  }
  if (!subjectClass) {
    return { status: "not_found", tkbCode: item.tkbCode, dbCode: item.dbCode }
  }

  const scheduleEnum =
    item.schedule === "AFTERNOON"
      ? $Enums.SubjectClassSchedule.AFTERNOON
      : $Enums.SubjectClassSchedule.MORNING

  const slotsWithTime = item.slots.filter((s) => s.thu != null && s.start != null && s.end != null)
  const allDates = item.slots.flatMap((s) => s.dates || [])

  const result = await prisma.$transaction(
    async (tx) => {
      await tx.subjectClass.update({
        where: { id: subjectClass.id },
        data: { schedule: scheduleEnum },
      })
      await tx.subjectClassTime.deleteMany({ where: { subjectClassId: subjectClass.id } })
      if (slotsWithTime.length) {
        await tx.subjectClassTime.createMany({
          data: slotsWithTime.map((s) => ({
            subjectClassId: subjectClass.id,
            dayOfWeek: s.thu,
            startPeriod: s.start,
            endPeriod: s.end,
          })),
        })
      }

      let created = 0
      let updated = 0
      let skipped = 0
      for (const slot of item.slots) {
        for (const d of slot.dates || []) {
          const classDate = dayjs(d, "DD/MM/YYYY").hour(12).minute(0).second(0).millisecond(0)
          if (!classDate.isValid() || slot.start == null || slot.end == null) {
            skipped++
            continue
          }
          const dateOnly = classDate.toDate()
          const data = {
            roomId: subjectClass.roomId,
            lecturerId: subjectClass.lecturerId,
            extraLecturerId: subjectClass.extraLecturerId,
            startPeriod: slot.start,
            endPeriod: slot.end,
            periodType: $Enums.PeriodType.THEORY,
          }
          const existing = await tx.classSchedule.findFirst({
            where: {
              subjectClassId: subjectClass.id,
              classDate: dateOnly,
              startPeriod: slot.start,
              endPeriod: slot.end,
            },
          })
          if (existing) {
            await tx.classSchedule.update({ where: { id: existing.id }, data })
            updated++
          } else {
            const sameDay = await tx.classSchedule.findFirst({
              where: { subjectClassId: subjectClass.id, classDate: dateOnly },
            })
            if (sameDay) {
              await tx.classSchedule.update({ where: { id: sameDay.id }, data })
              updated++
            } else {
              await tx.classSchedule.create({
                data: { subjectClassId: subjectClass.id, classDate: dateOnly, ...data },
              })
              created++
            }
          }
        }
      }
      return { created, updated, skipped }
    },
    { timeout: 120_000 }
  )

  return {
    status: allDates.length ? "ok" : "time_only",
    tkbCode: item.tkbCode,
    dbCode: subjectClass.code,
    id: subjectClass.id,
    name: subjectClass.name,
    schedule: item.schedule,
    times: slotsWithTime.length,
    dates: allDates.length,
    ...result,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  console.log("TKB:", args.tkb)
  console.log("GV :", args.gv)
  console.log("semester filter (prefer):", args.semester)
  console.log("dryRun:", args.dryRun)

  const tkbByLmh = loadTkbSlots(args.tkb)
  const gvRows = loadGvRows(args.gv)
  let payload = buildPayload(tkbByLmh, gvRows)

  if (args.only?.size) {
    payload = payload.filter(
      (p) =>
        args.only.has(p.tkbCode) ||
        args.only.has(p.dbCode) ||
        args.only.has(mapTkbCodeToDb(p.tkbCode))
    )
  }
  if (!args.skipMissingDates) {
    payload = payload.filter((p) => p.slots.some((s) => s.dates?.length))
  }

  console.log(`Parsed LMH: ${payload.length} (từ ${tkbByLmh.size} mã TKB)`)
  console.log(`GV rows: ${gvRows.length}`)

  if (args.dryRun) {
    for (const p of payload) {
      const nDates = p.slots.reduce((a, s) => a + (s.dates?.length || 0), 0)
      const notes = [...new Set(p.slots.map((s) => s.note))]
      console.log(
        `- ${p.tkbCode} => ${p.dbCode} | ${p.schedule} | slots=${p.slots.length} dates=${nDates} | ${notes.join("; ")}`
      )
      for (const s of p.slots) {
        console.log(
          `    T${s.thu} ${kipLabel(s.start)} ${s.start}-${s.end} ${s.gd || ""} | ${s.dates.length} ngày | ${s.note}`
        )
      }
    }
    console.log("\nDry-run xong — chưa ghi DB.")
    return
  }

  if (!process.env.DATABASE_URL) {
    console.error("Thiếu DATABASE_URL")
    process.exit(1)
  }

  const prisma = new PrismaClient()
  const summary = { ok: [], timeOnly: [], notFound: [], errors: [] }

  try {
    for (const item of payload) {
      try {
        const res = await upsertOne(prisma, item, args.semester)
        if (res.status === "not_found") {
          summary.notFound.push(res)
          console.log(`NOT FOUND ${res.tkbCode} => ${res.dbCode}`)
        } else if (res.status === "time_only") {
          summary.timeOnly.push(res)
          console.log(`TIME-ONLY ${res.tkbCode} => ${res.dbCode} | times=${res.times}`)
        } else {
          summary.ok.push(res)
          console.log(
            `OK ${res.tkbCode} => ${res.dbCode} | times=${res.times} dates=${res.dates} +${res.created} ~${res.updated}`
          )
        }
      } catch (e) {
        summary.errors.push({
          tkbCode: item.tkbCode,
          dbCode: item.dbCode,
          error: String(e?.message || e),
        })
        console.error(`ERR ${item.tkbCode} => ${item.dbCode}:`, e?.message || e)
      }
    }
  } finally {
    await prisma.$disconnect()
  }

  console.log("\n==== SUMMARY ====")
  console.log(
    JSON.stringify(
      {
        ok: summary.ok.length,
        timeOnly: summary.timeOnly.length,
        notFound: summary.notFound,
        errors: summary.errors,
        createdTotal:
          summary.ok.reduce((a, x) => a + x.created, 0) +
          summary.timeOnly.reduce((a, x) => a + (x.created || 0), 0),
        updatedTotal:
          summary.ok.reduce((a, x) => a + x.updated, 0) +
          summary.timeOnly.reduce((a, x) => a + (x.updated || 0), 0),
      },
      null,
      2
    )
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
