/**
 * Xuất Excel thống kê giảng viên theo Khoa/Viện — mỗi Bộ môn 1 sheet.
 *
 * Usage:
 *   DATABASE_URL=... bun scripts/export-lecturers-by-department-excel.mjs
 *   OUT=... bun scripts/export-lecturers-by-department-excel.mjs
 */
import { createRequire } from "node:module"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "../generated/prisma-client/index.js"

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const ExcelJS = require(join(__dirname, "../../../apps/backend/be-portal/node_modules/exceljs"))

const url = process.env.DATABASE_URL
if (!url) {
  console.error("Missing DATABASE_URL")
  process.exit(1)
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: url + (url.includes("?") ? "&" : "?") + "connection_limit=1" },
  },
})

const OUT = process.env.OUT || join(__dirname, "../../../ThongKeGiangVien_TheoBoMon.xlsx")

const LOAI_DON_VI = {
  0: "Phòng",
  1: "Ban",
  2: "Trung tâm",
  3: "Văn phòng",
  4: "Tổ công tác",
  5: "Khoa",
  6: "Viện",
  7: "Bộ môn",
  8: "Phòng thí nghiệm",
  9: "Xưởng thực hành",
  10: "Hệ",
  11: "Tiểu đoàn",
  12: "Đại đội",
  13: "Trung đội",
  14: "Lớp/Chi đoàn",
}

const headerStyle = {
  font: { bold: true, color: { argb: "FFFFFFFF" } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } },
  alignment: { vertical: "middle", horizontal: "center", wrapText: true },
  border: {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  },
}
const cellBorder = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
}

const LECTURER_COLUMNS = [
  { header: "STT", key: "stt", width: 6 },
  { header: "Mã GV", key: "code", width: 14 },
  { header: "Mã cán bộ", key: "lectureID", width: 14 },
  { header: "Họ tên", key: "fullName", width: 28 },
  { header: "Giới tính", key: "gender", width: 10 },
  { header: "Ngày sinh", key: "dob", width: 14 },
  { header: "Số hiệu SQ", key: "officerNumber", width: 14 },
  { header: "Cấp bậc", key: "rank", width: 16 },
  { header: "Học hàm", key: "academicRank", width: 14 },
  { header: "Học vị", key: "academicDegree", width: 14 },
  { header: "Chức vụ", key: "position", width: 22 },
  { header: "Chức danh", key: "level", width: 18 },
  { header: "Loại GV", key: "lecturerType", width: 14 },
  { header: "Email", key: "email", width: 28 },
  { header: "Điện thoại", key: "phone", width: 14 },
  { header: "Khoa / Viện", key: "khoaVien", width: 36 },
  { header: "Bộ môn", key: "boMon", width: 36 },
  { header: "Đơn vị công tác", key: "donVi", width: 36 },
  { header: "Loại đơn vị", key: "loaiDonVi", width: 16 },
  { header: "Trạng thái", key: "status", width: 14 },
]

function styleHeader(ws) {
  const row = ws.getRow(1)
  row.height = 28
  row.eachCell((cell) => {
    Object.assign(cell, { style: headerStyle })
  })
}

function applyBorders(ws) {
  ws.eachRow((row, i) => {
    if (i === 1) return
    row.eachCell((cell) => {
      cell.border = cellBorder
      cell.alignment = { vertical: "middle", wrapText: true }
    })
  })
}

function fmtDate(d) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
}

function fmtVN(d) {
  return new Date(d).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false })
}

function countBy(list, getKey) {
  const map = {}
  for (const item of list) {
    const k = getKey(item) || "(trống)"
    map[k] = (map[k] || 0) + 1
  }
  return map
}

function isKhoaVien(o) {
  return o?.iLoaiDonVi === 5 || o?.iLoaiDonVi === 6
}

function isBoMon(o) {
  return o?.iLoaiDonVi === 7
}

function uniqueSheetName(raw, used) {
  let base = String(raw || "Sheet")
    .replace(/[:\\/?*[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!base) base = "Sheet"
  base = base.slice(0, 31)
  let candidate = base
  let i = 2
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${i})`
    candidate = `${base.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`
    i += 1
  }
  used.add(candidate.toLowerCase())
  return candidate
}

function shortBoMonName(name) {
  return String(name || "")
    .replace(/^Bộ môn\s+/i, "")
    .replace(/^BM\s+/i, "")
    .trim()
}

function compareVi(a, b) {
  return String(a || "").localeCompare(String(b || ""), "vi", { sensitivity: "base" })
}

function lecturerRow(lec, idx) {
  const p = lec.userProfile || {}
  return {
    stt: idx,
    code: lec.code || "",
    lectureID: lec.lectureID || "",
    fullName: p.fullname || [p.lastName, p.firstName].filter(Boolean).join(" "),
    gender: p.gender?.sTen || "",
    dob: fmtDate(p.dateOfBirth),
    officerNumber: p.officerNumber || "",
    rank: p.rank?.sTen || "",
    academicRank: p.academicRankType?.sTen || "",
    academicDegree: p.academicDegreeType?.sTen || "",
    position: p.position?.sTen || "",
    level: p.level?.sTen || "",
    lecturerType: lec.lecturerType?.name || "",
    email: p.email || "",
    phone: p.phoneNumber || p.officePhone || "",
    khoaVien: lec._khoaVien?.sTen || "",
    boMon: lec._boMon?.sTen || "",
    donVi: lec._donVi?.sTen || "",
    loaiDonVi: LOAI_DON_VI[lec._donVi?.iLoaiDonVi] || "",
    status: lec.active === false ? "Ngừng" : "Đang hoạt động",
  }
}

function addLecturerSheet(wb, name, lecturers, usedNames) {
  const ws = wb.addWorksheet(uniqueSheetName(name, usedNames))
  ws.columns = LECTURER_COLUMNS
  styleHeader(ws)
  lecturers.forEach((lec, i) => ws.addRow(lecturerRow(lec, i + 1)))
  applyBorders(ws)
  ws.views = [{ state: "frozen", ySplit: 1 }]
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: LECTURER_COLUMNS.length },
  }
  return ws
}

async function main() {
  const [orgs, lecturers] = await Promise.all([
    prisma.dM_DonVi.findMany({
      where: { OR: [{ bDeleted: false }, { bDeleted: null }] },
      select: {
        Id: true,
        sMa: true,
        sTen: true,
        sTenVietTat: true,
        sParentId: true,
        iLoaiDonVi: true,
        iCapDonVi: true,
        iNhomDonVi: true,
        iSTT: true,
        bActive: true,
      },
      orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
    }),
    prisma.lecturer.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        code: true,
        lectureID: true,
        active: true,
        lecturerType: { select: { name: true, isExternal: true } },
        userProfile: {
          select: {
            sDM_DonViId: true,
            donVi: {
              select: {
                Id: true,
                sMa: true,
                sTen: true,
                sParentId: true,
                iLoaiDonVi: true,
                iCapDonVi: true,
              },
            },
            fullname: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            officePhone: true,
            dateOfBirth: true,
            officerNumber: true,
            gender: { select: { sTen: true } },
            rank: { select: { sTen: true } },
            academicRankType: { select: { sTen: true } },
            academicDegreeType: { select: { sTen: true } },
            position: { select: { sTen: true } },
            level: { select: { sTen: true } },
          },
        },
      },
    }),
  ])

  const orgById = new Map(orgs.map((o) => [o.Id, o]))

  function ancestors(orgId) {
    const chain = []
    const seen = new Set()
    let id = orgId
    let depth = 0
    while (id && id !== "0" && !seen.has(id) && depth < 12) {
      seen.add(id)
      const o = orgById.get(id)
      if (!o) break
      chain.push(o)
      id = o.sParentId
      depth += 1
    }
    return chain
  }

  for (const lec of lecturers) {
    const chain = ancestors(lec.userProfile?.sDM_DonViId)
    lec._donVi = chain[0] || lec.userProfile?.donVi || null
    lec._boMon = chain.find(isBoMon) || null
    lec._khoaVien = chain.find(isKhoaVien) || null
  }

  lecturers.sort((a, b) => {
    const k = compareVi(a._khoaVien?.sTen, b._khoaVien?.sTen)
    if (k) return k
    const bm = compareVi(a._boMon?.sTen, b._boMon?.sTen)
    if (bm) return bm
    return compareVi(
      a.userProfile?.fullname || a.userProfile?.firstName,
      b.userProfile?.fullname || b.userProfile?.firstName
    )
  })

  const khoaVienList = orgs.filter(isKhoaVien).sort((a, b) => compareVi(a.sTen, b.sTen))
  const boMonList = orgs.filter(isBoMon).sort((a, b) => {
    const ka = ancestors(a.Id).find(isKhoaVien)
    const kb = ancestors(b.Id).find(isKhoaVien)
    const k = compareVi(ka?.sTen, kb?.sTen)
    if (k) return k
    return compareVi(a.sTen, b.sTen)
  })

  const byBoMon = new Map()
  for (const bm of boMonList) byBoMon.set(bm.Id, [])
  const byKhoaDirect = new Map()
  const otherUnits = []
  for (const lec of lecturers) {
    if (lec._boMon) {
      if (!byBoMon.has(lec._boMon.Id)) byBoMon.set(lec._boMon.Id, [])
      byBoMon.get(lec._boMon.Id).push(lec)
    } else if (lec._khoaVien) {
      if (!byKhoaDirect.has(lec._khoaVien.Id)) byKhoaDirect.set(lec._khoaVien.Id, [])
      byKhoaDirect.get(lec._khoaVien.Id).push(lec)
    } else {
      otherUnits.push(lec)
    }
  }

  const activeLecturers = lecturers.filter((l) => l.active !== false)
  const inKhoaVien = lecturers.filter((l) => l._khoaVien)
  const inBoMon = lecturers.filter((l) => l._boMon)

  const wb = new ExcelJS.Workbook()
  wb.creator = "MTA"
  wb.created = new Date()
  const usedNames = new Set()

  // Sheet 1: Tổng hợp
  const s1 = wb.addWorksheet(uniqueSheetName("Tong hop", usedNames))
  s1.columns = [
    { header: "Chỉ tiêu", key: "metric", width: 55 },
    { header: "Giá trị", key: "value", width: 70 },
  ]
  const summaryRows = [
    { metric: "Thời gian xuất", value: fmtVN(new Date()) },
    { metric: "Nguồn dữ liệu", value: "Lecturer + DM_DonVi (mta_in)" },
    { metric: "—", value: "" },
    { metric: "Tổng số giảng viên (chưa xóa)", value: lecturers.length },
    { metric: "  · Đang hoạt động", value: activeLecturers.length },
    { metric: "  · Ngừng", value: lecturers.length - activeLecturers.length },
    { metric: "GV thuộc Khoa/Viện (kể cả bộ môn con)", value: inKhoaVien.length },
    { metric: "GV thuộc Bộ môn", value: inBoMon.length },
    { metric: "GV gắn trực tiếp Khoa/Viện (chưa gán BM)", value: lecturers.filter((l) => l._khoaVien && !l._boMon).length },
    { metric: "GV đơn vị khác (phòng/ban/...)", value: otherUnits.length },
    { metric: "Số Khoa/Viện", value: khoaVienList.length },
    { metric: "Số Bộ môn", value: boMonList.length },
    { metric: "Bộ môn có GV", value: [...byBoMon.values()].filter((arr) => arr.length > 0).length },
    { metric: "Bộ môn chưa có GV", value: [...byBoMon.values()].filter((arr) => arr.length === 0).length },
    { metric: "—", value: "" },
    { metric: "Theo học hàm", value: "" },
  ]
  for (const [k, v] of Object.entries(countBy(lecturers, (l) => l.userProfile?.academicRankType?.sTen)).sort()) {
    summaryRows.push({ metric: `  · ${k}`, value: v })
  }
  summaryRows.push({ metric: "Theo học vị", value: "" })
  for (const [k, v] of Object.entries(countBy(lecturers, (l) => l.userProfile?.academicDegreeType?.sTen)).sort()) {
    summaryRows.push({ metric: `  · ${k}`, value: v })
  }
  summaryRows.push({ metric: "Theo giới tính", value: "" })
  for (const [k, v] of Object.entries(countBy(lecturers, (l) => l.userProfile?.gender?.sTen)).sort()) {
    summaryRows.push({ metric: `  · ${k}`, value: v })
  }
  summaryRows.push({ metric: "Theo loại GV", value: "" })
  for (const [k, v] of Object.entries(countBy(lecturers, (l) => l.lecturerType?.name)).sort()) {
    summaryRows.push({ metric: `  · ${k}`, value: v })
  }
  s1.addRows(summaryRows)
  styleHeader(s1)
  applyBorders(s1)

  // Sheet 2: Theo khoa viện
  const s2 = wb.addWorksheet(uniqueSheetName("Theo khoa vien", usedNames))
  s2.columns = [
    { header: "STT", key: "stt", width: 6 },
    { header: "Mã", key: "ma", width: 12 },
    { header: "Khoa / Viện", key: "ten", width: 46 },
    { header: "Loại", key: "loai", width: 10 },
    { header: "Số bộ môn", key: "soBoMon", width: 12 },
    { header: "Tổng GV", key: "tongGV", width: 12 },
    { header: "GV đang HĐ", key: "active", width: 12 },
    { header: "GV thuộc BM", key: "inBm", width: 12 },
    { header: "GV gắn trực tiếp khoa", key: "direct", width: 18 },
  ]
  styleHeader(s2)
  khoaVienList.forEach((kv, idx) => {
    const bmChildren = boMonList.filter((bm) => ancestors(bm.Id).some((a) => a.Id === kv.Id))
    const gv = lecturers.filter((l) => l._khoaVien?.Id === kv.Id)
    s2.addRow({
      stt: idx + 1,
      ma: kv.sMa || "",
      ten: kv.sTen || "",
      loai: LOAI_DON_VI[kv.iLoaiDonVi] || "",
      soBoMon: bmChildren.length,
      tongGV: gv.length,
      active: gv.filter((l) => l.active !== false).length,
      inBm: gv.filter((l) => l._boMon).length,
      direct: gv.filter((l) => !l._boMon).length,
    })
  })
  applyBorders(s2)
  s2.views = [{ state: "frozen", ySplit: 1 }]

  // Sheet 3: Theo bộ môn
  const s3 = wb.addWorksheet(uniqueSheetName("Theo bo mon", usedNames))
  s3.columns = [
    { header: "STT", key: "stt", width: 6 },
    { header: "Mã BM", key: "ma", width: 12 },
    { header: "Bộ môn", key: "ten", width: 46 },
    { header: "Khoa / Viện", key: "khoaVien", width: 42 },
    { header: "Tổng GV", key: "tongGV", width: 12 },
    { header: "GV đang HĐ", key: "active", width: 12 },
    { header: "GV ngừng", key: "inactive", width: 12 },
  ]
  styleHeader(s3)
  boMonList.forEach((bm, idx) => {
    const kv = ancestors(bm.Id).find(isKhoaVien)
    const gv = byBoMon.get(bm.Id) || []
    s3.addRow({
      stt: idx + 1,
      ma: bm.sMa || "",
      ten: bm.sTen || "",
      khoaVien: kv?.sTen || "",
      tongGV: gv.length,
      active: gv.filter((l) => l.active !== false).length,
      inactive: gv.filter((l) => l.active === false).length,
    })
  })
  applyBorders(s3)
  s3.views = [{ state: "frozen", ySplit: 1 }]

  // Sheet 4: Tất cả GV
  addLecturerSheet(wb, "Danh sach tat ca", lecturers, usedNames)

  // Sheet 5: GV gắn khoa/viện chưa gán BM
  const khoaDirectAll = lecturers.filter((l) => l._khoaVien && !l._boMon)
  addLecturerSheet(wb, "GV khoa chua gan BM", khoaDirectAll, usedNames)

  // Sheet 6: Đơn vị khác
  addLecturerSheet(wb, "Don vi khac", otherUnits, usedNames)

  // Mỗi bộ môn 1 sheet
  for (const bm of boMonList) {
    const kv = ancestors(bm.Id).find(isKhoaVien)
    const gv = byBoMon.get(bm.Id) || []
    const short = shortBoMonName(bm.sTen || bm.sMa || "Bo mon")
    const prefix = kv?.sTenVietTat || kv?.sMa || ""
    const sheetTitle = prefix ? `${prefix} - ${short}` : short
    addLecturerSheet(wb, sheetTitle, gv, usedNames)
  }

  await wb.xlsx.writeFile(OUT)
  console.log(
    JSON.stringify(
      {
        outPath: OUT,
        lecturers: lecturers.length,
        active: activeLecturers.length,
        khoaVien: khoaVienList.length,
        boMon: boMonList.length,
        boMonWithLecturers: [...byBoMon.values()].filter((a) => a.length > 0).length,
        inKhoaVien: inKhoaVien.length,
        inBoMon: inBoMon.length,
        khoaDirect: khoaDirectAll.length,
        otherUnits: otherUnits.length,
        sheets: wb.worksheets.length,
      },
      null,
      2
    )
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
