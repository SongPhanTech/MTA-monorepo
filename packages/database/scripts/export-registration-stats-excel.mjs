/**
 * Xuất Excel thống kê đăng ký học theo khoảng thời gian.
 *
 * Usage:
 *   DATABASE_URL=... bun scripts/export-registration-stats-excel.mjs
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

const FROM = new Date(process.env.FROM || "2026-08-04T16:00:00+07:00")
const TO = new Date(process.env.TO || "2026-08-05T16:50:00+07:00")
const SESSION_ID = process.env.SESSION_ID || "cmse0eu6t0001sh3d0h9yfidl"
const OUT =
  process.env.OUT ||
  join(__dirname, "../../../ThongKeDangKyHoc_2026-08-04_16h-2026-08-05_16h50.xlsx")

const fmtVN = (d) =>
  new Date(d).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false })

const fmtRangeLabel = (from, to) => {
  const opts = {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  const a = new Date(from).toLocaleString("vi-VN", opts)
  const b = new Date(to).toLocaleString("vi-VN", opts)
  return `${a} → ${b} (GMT+7)`
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
      cell.alignment = { ...(cell.alignment || {}), vertical: "middle", wrapText: true }
    })
  })
}

const session = await prisma.classRegisterSession.findUnique({
  where: { id: SESSION_ID },
  select: {
    id: true,
    name: true,
    startDate: true,
    endDate: true,
    semester: { select: { name: true, schoolYear: { select: { name: true } } } },
  },
})

const successLogs = await prisma.classRegisterLogs.findMany({
  where: {
    deletedAt: null,
    classRegisterSessionId: SESSION_ID,
    createdAt: { gte: FROM, lte: TO },
    status: { in: ["SUCCESS", "PENDING"] },
  },
  select: {
    studentId: true,
    createdAt: true,
    status: true,
    subjectClass: {
      select: {
        code: true,
        name: true,
        subject: { select: { name: true, subject: { select: { name: true } } } },
      },
    },
    student: {
      select: {
        id: true,
        code: true,
        fixedClass: { select: { name: true } },
        userProfile: { select: { fullname: true, code: true } },
      },
    },
  },
  orderBy: { createdAt: "asc" },
})

const successByStudent = new Map()
for (const log of successLogs) {
  const s = log.student
  const key = log.studentId
  if (!successByStudent.has(key)) {
    successByStudent.set(key, {
      studentId: key,
      studentCode: s?.userProfile?.code ?? "",
      fullName: s?.userProfile?.fullname ?? "",
      fixedClassName: s?.fixedClass?.name ?? "",
      firstRegisteredAt: log.createdAt,
      lastRegisteredAt: log.createdAt,
      classCount: 0,
      classes: [],
    })
  }
  const row = successByStudent.get(key)
  row.classCount += 1
  row.lastRegisteredAt = log.createdAt
  const subjectName =
    log.subjectClass?.subject?.name ||
    log.subjectClass?.subject?.subject?.name ||
    log.subjectClass?.name ||
    ""
  row.classes.push(`${log.subjectClass?.code || ""} - ${subjectName}`)
}

const failureRows = await prisma.classRegisterAttempt.findMany({
  where: {
    deletedAt: null,
    classRegisterSessionId: SESSION_ID,
    status: "FAILED",
    occurredAt: { gte: FROM, lte: TO },
  },
  orderBy: { occurredAt: "asc" },
  include: {
    student: {
      select: {
        id: true,
        code: true,
        fixedClass: { select: { name: true } },
        userProfile: { select: { fullname: true, code: true } },
      },
    },
  },
})

const missingProfileIds = [
  ...new Set(failureRows.filter((r) => !r.student).map((r) => r.userProfileId)),
]
const profiles =
  missingProfileIds.length > 0
    ? await prisma.student.findMany({
        where: { userProfileId: { in: missingProfileIds }, deletedAt: null },
        select: {
          id: true,
          code: true,
          userProfileId: true,
          fixedClass: { select: { name: true } },
          userProfile: { select: { fullname: true, code: true } },
        },
      })
    : []
const profileByUserId = new Map(profiles.map((p) => [p.userProfileId, p]))

const allScIds = [...new Set(failureRows.flatMap((r) => r.subjectClassIds))]
const subjectClasses =
  allScIds.length > 0
    ? await prisma.subjectClass.findMany({
        where: { id: { in: allScIds } },
        select: {
          id: true,
          code: true,
          name: true,
          subject: { select: { name: true, subject: { select: { name: true } } } },
        },
      })
    : []
const scMap = new Map(
  subjectClasses.map((sc) => [
    sc.id,
    {
      classCode: sc.code,
      subjectName: sc.subject?.name || sc.subject?.subject?.name || sc.name,
    },
  ])
)

const failureDetails = failureRows.map((row) => {
  const student =
    row.student || (row.userProfileId ? profileByUserId.get(row.userProfileId) : undefined) || null
  const classes = row.subjectClassIds
    .map((id) => scMap.get(id))
    .filter(Boolean)
    .map((c) => `${c.classCode} - ${c.subjectName}`)
  return {
    occurredAt: row.occurredAt,
    errorCode: row.errorCode || "",
    message: row.message,
    attempts: row.attempts,
    studentId: student?.id ?? row.studentId ?? "",
    studentCode: student?.userProfile?.code ?? "",
    fullName: student?.userProfile?.fullname ?? "",
    fixedClassName: student?.fixedClass?.name ?? "",
    classes: classes.join("; "),
    laterSucceeded: student?.id ? successByStudent.has(student.id) : false,
  }
})

const failedStudentKeys = new Set(failureDetails.map((f) => f.studentId || `code:${f.studentCode}`))
const failedOnlyKeys = [...failedStudentKeys].filter((k) => {
  if (k.startsWith("code:")) return true
  return !successByStudent.has(k)
})

const errorCodeCount = new Map()
for (const f of failureDetails) {
  const code = f.errorCode || "(không mã)"
  errorCodeCount.set(code, (errorCodeCount.get(code) || 0) + 1)
}

const failByStudent = new Map()
for (const f of failureDetails) {
  const key = f.studentId || `code:${f.studentCode}`
  if (!failByStudent.has(key)) {
    failByStudent.set(key, {
      studentCode: f.studentCode,
      fullName: f.fullName,
      fixedClassName: f.fixedClassName,
      failCount: 0,
      errorCodes: new Set(),
      messages: new Set(),
      firstAt: f.occurredAt,
      lastAt: f.occurredAt,
      laterSucceeded: f.laterSucceeded,
    })
  }
  const s = failByStudent.get(key)
  s.failCount += 1
  if (f.errorCode) s.errorCodes.add(f.errorCode)
  if (f.message) s.messages.add(f.message)
  if (f.occurredAt < s.firstAt) s.firstAt = f.occurredAt
  if (f.occurredAt > s.lastAt) s.lastAt = f.occurredAt
}

const wb = new ExcelJS.Workbook()
wb.creator = "be-portal stats"
wb.created = new Date()

{
  const ws = wb.addWorksheet("Tong hop")
  ws.columns = [
    { header: "Chỉ tiêu", key: "k", width: 55 },
    { header: "Giá trị", key: "v", width: 70 },
  ]
  styleHeader(ws)
  const rows = [
    ["Đợt đăng ký", session?.name || ""],
    [
      "Học kỳ",
      [session?.semester?.name, session?.semester?.schoolYear?.name].filter(Boolean).join(" - "),
    ],
    ["Khoảng thời gian thống kê", fmtRangeLabel(FROM, TO)],
    ["Thời gian xuất báo cáo", fmtVN(new Date())],
    ["", ""],
    ["Số SV đăng ký thành công (distinct)", successByStudent.size],
    ["Số bản ghi lớp đã ghi danh (ClassRegisterLogs)", successLogs.length],
    ["Số SV từng gặp lỗi đăng ký (distinct)", failByStudent.size],
    ["Số lần đăng ký lỗi (ClassRegisterAttempt)", failureDetails.length],
    ["Số SV lỗi và chưa đăng ký được lớp nào trong khung giờ", failedOnlyKeys.length],
    [
      "Số SV lỗi nhưng sau đó đăng ký thành công trong khung giờ",
      [...failByStudent.values()].filter((s) => s.laterSucceeded).length,
    ],
    ["", ""],
    ["Phân bố lỗi theo mã", ""],
    ...[...errorCodeCount.entries()].map(([code, count]) => [`  ${code}`, count]),
  ]
  for (const [k, v] of rows) ws.addRow({ k, v })
  applyBorders(ws)
}

{
  const ws = wb.addWorksheet("SV dang ky thanh cong")
  ws.columns = [
    { header: "STT", key: "stt", width: 6 },
    { header: "Mã SV", key: "studentCode", width: 14 },
    { header: "Họ tên", key: "fullName", width: 28 },
    { header: "Lớp cố định", key: "fixedClassName", width: 18 },
    { header: "Số lớp đã ĐK", key: "classCount", width: 12 },
    { header: "Thời điểm ĐK đầu", key: "firstAt", width: 20 },
    { header: "Thời điểm ĐK cuối", key: "lastAt", width: 20 },
    { header: "Danh sách lớp", key: "classes", width: 60 },
  ]
  styleHeader(ws)
  let i = 1
  const sorted = [...successByStudent.values()].sort((a, b) =>
    (a.studentCode || "").localeCompare(b.studentCode || "")
  )
  for (const s of sorted) {
    ws.addRow({
      stt: i++,
      studentCode: s.studentCode,
      fullName: s.fullName,
      fixedClassName: s.fixedClassName,
      classCount: s.classCount,
      firstAt: fmtVN(s.firstRegisteredAt),
      lastAt: fmtVN(s.lastRegisteredAt),
      classes: s.classes.join("; "),
    })
  }
  applyBorders(ws)
}

{
  const ws = wb.addWorksheet("SV khong DK duoc (tong hop)")
  ws.columns = [
    { header: "STT", key: "stt", width: 6 },
    { header: "Mã SV", key: "studentCode", width: 14 },
    { header: "Họ tên", key: "fullName", width: 28 },
    { header: "Lớp cố định", key: "fixedClassName", width: 18 },
    { header: "Số lần lỗi", key: "failCount", width: 12 },
    { header: "Mã lỗi", key: "errorCodes", width: 28 },
    { header: "Nội dung lỗi", key: "messages", width: 70 },
    { header: "Lỗi đầu", key: "firstAt", width: 20 },
    { header: "Lỗi cuối", key: "lastAt", width: 20 },
    { header: "Sau đó ĐK thành công?", key: "later", width: 18 },
  ]
  styleHeader(ws)
  let i = 1
  const sorted = [...failByStudent.values()].sort((a, b) =>
    (a.studentCode || "").localeCompare(b.studentCode || "")
  )
  for (const s of sorted) {
    ws.addRow({
      stt: i++,
      studentCode: s.studentCode,
      fullName: s.fullName,
      fixedClassName: s.fixedClassName,
      failCount: s.failCount,
      errorCodes: [...s.errorCodes].join(", "),
      messages: [...s.messages].join(" | "),
      firstAt: fmtVN(s.firstAt),
      lastAt: fmtVN(s.lastAt),
      later: s.laterSucceeded ? "Có" : "Không",
    })
  }
  applyBorders(ws)
}

{
  const ws = wb.addWorksheet("Chi tiet lan dang ky loi")
  ws.columns = [
    { header: "STT", key: "stt", width: 6 },
    { header: "Thời điểm", key: "occurredAt", width: 20 },
    { header: "Mã SV", key: "studentCode", width: 14 },
    { header: "Họ tên", key: "fullName", width: 28 },
    { header: "Lớp cố định", key: "fixedClassName", width: 18 },
    { header: "Mã lỗi", key: "errorCode", width: 24 },
    { header: "Nội dung lỗi", key: "message", width: 70 },
    { header: "Lớp môn đang ĐK", key: "classes", width: 50 },
    { header: "Attempts", key: "attempts", width: 10 },
    { header: "Sau đó ĐK thành công?", key: "later", width: 18 },
  ]
  styleHeader(ws)
  let i = 1
  for (const f of failureDetails) {
    ws.addRow({
      stt: i++,
      occurredAt: fmtVN(f.occurredAt),
      studentCode: f.studentCode,
      fullName: f.fullName,
      fixedClassName: f.fixedClassName,
      errorCode: f.errorCode,
      message: f.message,
      classes: f.classes,
      attempts: f.attempts,
      later: f.laterSucceeded ? "Có" : "Không",
    })
  }
  applyBorders(ws)
}

await wb.xlsx.writeFile(OUT)
console.log(
  JSON.stringify(
    {
      out: OUT,
      session: session?.name,
      successStudents: successByStudent.size,
      successLogs: successLogs.length,
      failedStudents: failByStudent.size,
      failedAttempts: failureDetails.length,
      failedNeverSucceeded: failedOnlyKeys.length,
      errorCodes: Object.fromEntries(errorCodeCount),
    },
    null,
    2
  )
)

await prisma.$disconnect()
