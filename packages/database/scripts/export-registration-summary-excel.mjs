/**
 * Xuất Excel tổng hợp: SV đã đăng ký / chưa đăng ký (tách đang học vs thôi/nghỉ học).
 *
 * Usage:
 *   DATABASE_URL=... bun scripts/export-registration-summary-excel.mjs
 *   SESSION_ID=... OUT=... bun scripts/export-registration-summary-excel.mjs
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

const SESSION_ID = process.env.SESSION_ID || "cmse0eu6t0001sh3d0h9yfidl"
const OUT = process.env.OUT || join(__dirname, "../../../ThongKeDangKyHoc_TongHop.xlsx")

const STATUS_LABEL = {
  ENROLLED: "Đang học",
  GRADUATED: "Tốt nghiệp",
  DEFERRED_STUDY: "Bảo lưu",
  SUSPENDED_STUDY: "Tạm ngưng học",
  WITHDRAWN: "Thôi học",
  TRANSFERRED: "Chuyển trường",
  PENDING_GRADUATION_REVIEW: "Chờ xét tốt nghiệp",
  ACADEMIC_SUSPENSION: "Đình chỉ học",
  REPEATED: "Lưu ban",
}

/** Trạng thái không còn học bình thường (không kỳ vọng đăng ký) */
const INACTIVE_STATUSES = new Set([
  "WITHDRAWN",
  "SUSPENDED_STUDY",
  "DEFERRED_STUDY",
  "GRADUATED",
  "TRANSFERRED",
  "ACADEMIC_SUSPENSION",
  "PENDING_GRADUATION_REVIEW",
])

const fmtVN = (d) =>
  new Date(d).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false })

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

function statusLabel(status) {
  return STATUS_LABEL[status] || status || ""
}

function countByStatus(list, getStatus = (x) => x.status) {
  const map = {}
  for (const item of list) {
    const s = getStatus(item) || "UNKNOWN"
    map[s] = (map[s] || 0) + 1
  }
  return map
}

async function main() {
  const session = await prisma.classRegisterSession.findUnique({
    where: { id: SESSION_ID },
    include: {
      trainingCourses: {
        where: { deletedAt: null },
        select: { id: true, name: true, code: true },
      },
      semester: { select: { name: true, code: true } },
    },
  })
  if (!session) throw new Error(`Không tìm thấy đợt đăng ký: ${SESSION_ID}`)

  const tcIds = session.trainingCourses.map((t) => t.id)
  const eligible = await prisma.student.findMany({
    where: {
      deletedAt: null,
      fixedClass: { trainingCourseId: { in: tcIds }, deletedAt: null },
    },
    select: {
      id: true,
      code: true,
      status: true,
      fixedClass: { select: { code: true, name: true } },
      userProfile: { select: { fullname: true } },
    },
    orderBy: { code: "asc" },
  })

  const logs = await prisma.classRegisterLogs.findMany({
    where: { classRegisterSessionId: SESSION_ID, deletedAt: null },
    select: {
      studentId: true,
      createdAt: true,
      subjectClass: {
        select: {
          id: true,
          code: true,
          name: true,
          subject: { select: { code: true, name: true, credit: true } },
        },
      },
    },
    orderBy: [{ studentId: "asc" }, { createdAt: "asc" }],
  })

  const logsByStudent = new Map()
  for (const log of logs) {
    if (!logsByStudent.has(log.studentId)) logsByStudent.set(log.studentId, [])
    logsByStudent.get(log.studentId).push(log)
  }

  const registered = []
  const notRegistered = []
  for (const sv of eligible) {
    const studentLogs = logsByStudent.get(sv.id) || []
    if (studentLogs.length > 0) registered.push({ sv, studentLogs })
    else notRegistered.push(sv)
  }

  const notRegActive = notRegistered.filter((s) => s.status === "ENROLLED")
  const notRegInactive = notRegistered.filter((s) => INACTIVE_STATUSES.has(s.status))
  const notRegOther = notRegistered.filter(
    (s) => s.status !== "ENROLLED" && !INACTIVE_STATUSES.has(s.status)
  )

  const eligibleActive = eligible.filter((s) => s.status === "ENROLLED")
  const eligibleInactive = eligible.filter((s) => INACTIVE_STATUSES.has(s.status))

  const allStatusCounts = countByStatus(eligible)
  const regStatusCounts = countByStatus(registered, (x) => x.sv.status)
  const notRegStatusCounts = countByStatus(notRegistered)

  const wb = new ExcelJS.Workbook()
  wb.creator = "MTA Portal"
  wb.created = new Date()

  // Sheet 1: Tổng hợp
  const s1 = wb.addWorksheet("Tong hop")
  s1.columns = [
    { header: "Chỉ tiêu", key: "metric", width: 55 },
    { header: "Giá trị", key: "value", width: 60 },
  ]
  const summaryRows = [
    { metric: "Đợt đăng ký", value: session.name },
    { metric: "Học kỳ", value: session.semester?.name || session.semester?.code || "" },
    {
      metric: "Khóa đào tạo thuộc đợt",
      value: session.trainingCourses.map((t) => t.code || t.name).join(", "),
    },
    { metric: "Thời gian xuất", value: fmtVN(new Date()) },
    { metric: "—", value: "" },
    { metric: "Tổng SV thuộc khóa của đợt", value: eligible.length },
    { metric: "  Trong đó: Đang học (ENROLLED)", value: eligibleActive.length },
    {
      metric: "  Trong đó: Thôi học / Nghỉ học / trạng thái khác",
      value:
        eligibleInactive.length +
        (eligible.length - eligibleActive.length - eligibleInactive.length),
    },
  ]

  for (const [st, cnt] of Object.entries(allStatusCounts).sort()) {
    summaryRows.push({
      metric: `    · ${statusLabel(st)} (${st})`,
      value: cnt,
    })
  }

  summaryRows.push(
    { metric: "—", value: "" },
    { metric: "Số SV đã đăng ký", value: registered.length }
  )
  for (const [st, cnt] of Object.entries(regStatusCounts).sort()) {
    summaryRows.push({
      metric: `  · Đã ĐK — ${statusLabel(st)} (${st})`,
      value: cnt,
    })
  }

  summaryRows.push(
    { metric: "—", value: "" },
    { metric: "Số SV chưa đăng ký (tất cả trạng thái)", value: notRegistered.length },
    {
      metric: "  · Chưa ĐK nhưng ĐANG HỌC (cần theo dõi)",
      value: notRegActive.length,
    },
    {
      metric: "  · Chưa ĐK — thôi học / nghỉ học",
      value: notRegInactive.length,
    }
  )
  for (const [st, cnt] of Object.entries(notRegStatusCounts).sort()) {
    summaryRows.push({
      metric: `    · Chưa ĐK — ${statusLabel(st)} (${st})`,
      value: cnt,
    })
  }
  if (notRegOther.length > 0) {
    summaryRows.push({
      metric: "  · Chưa ĐK — trạng thái khác",
      value: notRegOther.length,
    })
  }

  summaryRows.push(
    { metric: "—", value: "" },
    { metric: "Tổng số dòng đăng ký (lớp môn)", value: logs.length },
    {
      metric: "Tỷ lệ đã ĐK / tổng SV khóa",
      value:
        eligible.length > 0 ? `${((registered.length / eligible.length) * 100).toFixed(2)}%` : "0%",
    },
    {
      metric: "Tỷ lệ đã ĐK / SV đang học",
      value:
        eligibleActive.length > 0
          ? `${((registered.length / eligibleActive.length) * 100).toFixed(2)}%`
          : "0%",
    },
    {
      metric: "Tỷ lệ chưa ĐK (đang học) / SV đang học",
      value:
        eligibleActive.length > 0
          ? `${((notRegActive.length / eligibleActive.length) * 100).toFixed(2)}%`
          : "0%",
    }
  )

  s1.addRows(summaryRows)
  styleHeader(s1)
  applyBorders(s1)

  // Sheet 2: Đã đăng ký — chi tiết
  const s2 = wb.addWorksheet("Da dang ky - chi tiet")
  s2.columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Mã SV", key: "studentCode", width: 14 },
    { header: "Họ tên", key: "fullName", width: 28 },
    { header: "Lớp quản lý", key: "fixedClass", width: 14 },
    { header: "Trạng thái SV", key: "status", width: 18 },
    { header: "Mã lớp môn", key: "classCode", width: 16 },
    { header: "Mã môn", key: "subjectCode", width: 12 },
    { header: "Tên môn", key: "subjectName", width: 40 },
    { header: "Tín chỉ", key: "credit", width: 10 },
    { header: "Thời gian đăng ký", key: "registeredAt", width: 22 },
  ]
  styleHeader(s2)

  let stt = 0
  for (const { sv, studentLogs } of registered) {
    for (const log of studentLogs) {
      stt += 1
      s2.addRow({
        stt,
        studentCode: sv.code || "",
        fullName: sv.userProfile?.fullname || "",
        fixedClass: sv.fixedClass?.code || sv.fixedClass?.name || "",
        status: statusLabel(sv.status),
        classCode: log.subjectClass?.code || "",
        subjectCode: log.subjectClass?.subject?.code || "",
        subjectName: log.subjectClass?.subject?.name || log.subjectClass?.name || "",
        credit: log.subjectClass?.subject?.credit ?? "",
        registeredAt: log.createdAt ? fmtVN(log.createdAt) : "",
      })
    }
  }
  applyBorders(s2)

  // Sheet 3: Đã đăng ký — tóm tắt SV
  const s3 = wb.addWorksheet("Da dang ky - tom tat SV")
  s3.columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Mã SV", key: "studentCode", width: 14 },
    { header: "Họ tên", key: "fullName", width: 28 },
    { header: "Lớp quản lý", key: "fixedClass", width: 14 },
    { header: "Trạng thái SV", key: "status", width: 18 },
    { header: "Số môn đã ĐK", key: "count", width: 14 },
    { header: "Tổng tín chỉ", key: "totalCredit", width: 14 },
    { header: "Danh sách lớp môn", key: "classes", width: 90 },
  ]
  styleHeader(s3)

  registered.forEach(({ sv, studentLogs }, idx) => {
    const classes = studentLogs
      .map((l) => {
        const sc = l.subjectClass
        return `${sc?.code || "?"} (${sc?.subject?.name || sc?.name || "?"})`
      })
      .join("; ")
    const totalCredit = studentLogs.reduce(
      (sum, l) => sum + (l.subjectClass?.subject?.credit || 0),
      0
    )
    s3.addRow({
      stt: idx + 1,
      studentCode: sv.code || "",
      fullName: sv.userProfile?.fullname || "",
      fixedClass: sv.fixedClass?.code || sv.fixedClass?.name || "",
      status: statusLabel(sv.status),
      count: studentLogs.length,
      totalCredit,
      classes,
    })
  })
  applyBorders(s3)

  // Sheet 4: Chưa ĐK — đang học (cần theo dõi)
  const s4 = wb.addWorksheet("Chua DK - dang hoc")
  s4.columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Mã SV", key: "studentCode", width: 14 },
    { header: "Họ tên", key: "fullName", width: 28 },
    { header: "Lớp quản lý", key: "fixedClass", width: 14 },
    { header: "Trạng thái SV", key: "status", width: 18 },
  ]
  styleHeader(s4)
  notRegActive.forEach((sv, idx) => {
    s4.addRow({
      stt: idx + 1,
      studentCode: sv.code || "",
      fullName: sv.userProfile?.fullname || "",
      fixedClass: sv.fixedClass?.code || sv.fixedClass?.name || "",
      status: statusLabel(sv.status),
    })
  })
  applyBorders(s4)

  // Sheet 5: Chưa ĐK — thôi học / nghỉ học
  const s5 = wb.addWorksheet("Chua DK - thoi nghi hoc")
  s5.columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Mã SV", key: "studentCode", width: 14 },
    { header: "Họ tên", key: "fullName", width: 28 },
    { header: "Lớp quản lý", key: "fixedClass", width: 14 },
    { header: "Trạng thái SV", key: "status", width: 18 },
    { header: "Mã trạng thái", key: "statusCode", width: 20 },
  ]
  styleHeader(s5)
  ;[...notRegInactive, ...notRegOther]
    .sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")))
    .forEach((sv, idx) => {
      s5.addRow({
        stt: idx + 1,
        studentCode: sv.code || "",
        fullName: sv.userProfile?.fullname || "",
        fixedClass: sv.fixedClass?.code || sv.fixedClass?.name || "",
        status: statusLabel(sv.status),
        statusCode: sv.status || "",
      })
    })
  applyBorders(s5)

  // Sheet 6: Chưa ĐK — tất cả (có cột trạng thái)
  const s6 = wb.addWorksheet("Chua DK - tat ca")
  s6.columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Mã SV", key: "studentCode", width: 14 },
    { header: "Họ tên", key: "fullName", width: 28 },
    { header: "Lớp quản lý", key: "fixedClass", width: 14 },
    { header: "Trạng thái SV", key: "status", width: 18 },
    { header: "Mã trạng thái", key: "statusCode", width: 20 },
    { header: "Nhóm", key: "group", width: 28 },
  ]
  styleHeader(s6)
  notRegistered.forEach((sv, idx) => {
    const group =
      sv.status === "ENROLLED"
        ? "Đang học — chưa đăng ký"
        : INACTIVE_STATUSES.has(sv.status)
          ? "Thôi học / Nghỉ học"
          : "Khác"
    s6.addRow({
      stt: idx + 1,
      studentCode: sv.code || "",
      fullName: sv.userProfile?.fullname || "",
      fixedClass: sv.fixedClass?.code || sv.fixedClass?.name || "",
      status: statusLabel(sv.status),
      statusCode: sv.status || "",
      group,
    })
  })
  applyBorders(s6)

  await wb.xlsx.writeFile(OUT)
  console.log(
    JSON.stringify(
      {
        outPath: OUT,
        session: session.name,
        eligible: eligible.length,
        eligibleByStatus: allStatusCounts,
        registered: registered.length,
        registeredByStatus: regStatusCounts,
        notRegistered: notRegistered.length,
        notRegisteredByStatus: notRegStatusCounts,
        notRegisteredActiveEnrolled: notRegActive.length,
        notRegisteredInactive: notRegInactive.length,
        registrationRows: logs.length,
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
