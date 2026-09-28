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
      semester: { select: { id: true, name: true, code: true } },
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
      status: true,
      fixedClass: { select: { code: true, name: true } },
      userProfile: { select: { fullname: true, code: true } },
    },
    orderBy: { userProfile: { code: "asc" } },
  })

  const logs = await prisma.classRegisterLogs.findMany({
    where: { classRegisterSessionId: SESSION_ID, deletedAt: null },
    select: {
      studentId: true,
      subjectClassId: true,
      createdAt: true,
      subjectClass: {
        select: {
          id: true,
          code: true,
          name: true,
          maxStudent: true,
          enrolledCount: true,
          subjectId: true,
          subject: { select: { id: true, code: true, name: true, credit: true } },
        },
      },
    },
    orderBy: [{ studentId: "asc" }, { createdAt: "asc" }],
  })

  // Tất cả lớp môn của học kỳ đợt (kể cả lớp chưa có SV đăng ký)
  const subjectClasses = await prisma.subjectClass.findMany({
    where: { semesterId: session.semesterId, deletedAt: null },
    select: {
      id: true,
      code: true,
      name: true,
      maxStudent: true,
      enrolledCount: true,
      cancelled: true,
      status: true,
      subjectId: true,
      subject: { select: { id: true, code: true, name: true, credit: true } },
    },
    orderBy: [{ code: "asc" }],
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
    { header: "Mã định danh", key: "studentCode", width: 14 },
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
        studentCode: sv.userProfile?.code || "",
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
    { header: "Mã định danh", key: "studentCode", width: 14 },
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
      studentCode: sv.userProfile?.code || "",
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
    { header: "Mã định danh", key: "studentCode", width: 14 },
    { header: "Họ tên", key: "fullName", width: 28 },
    { header: "Lớp quản lý", key: "fixedClass", width: 14 },
    { header: "Trạng thái SV", key: "status", width: 18 },
  ]
  styleHeader(s4)
  notRegActive.forEach((sv, idx) => {
    s4.addRow({
      stt: idx + 1,
      studentCode: sv.userProfile?.code || "",
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
    { header: "Mã định danh", key: "studentCode", width: 14 },
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
        studentCode: sv.userProfile?.code || "",
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
    { header: "Mã định danh", key: "studentCode", width: 14 },
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
      studentCode: sv.userProfile?.code || "",
      fullName: sv.userProfile?.fullname || "",
      fixedClass: sv.fixedClass?.code || sv.fixedClass?.name || "",
      status: statusLabel(sv.status),
      statusCode: sv.status || "",
      group,
    })
  })
  applyBorders(s6)

  // Đếm SV đăng ký theo lớp môn (từ ClassRegisterLogs của đợt)
  const regByClass = new Map() // subjectClassId -> Set(studentId)
  for (const log of logs) {
    if (!regByClass.has(log.subjectClassId)) regByClass.set(log.subjectClassId, new Set())
    regByClass.get(log.subjectClassId).add(log.studentId)
  }

  // Sheet 7: Lớp môn học
  const s7 = wb.addWorksheet("Lop mon hoc")
  s7.columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Mã lớp môn", key: "classCode", width: 16 },
    { header: "Tên lớp môn", key: "className", width: 28 },
    { header: "Mã học phần", key: "subjectCode", width: 14 },
    { header: "Tên học phần", key: "subjectName", width: 40 },
    { header: "Tín chỉ", key: "credit", width: 10 },
    { header: "Sĩ số tối đa", key: "maxStudent", width: 12 },
    { header: "SV đã ĐK (đợt này)", key: "registered", width: 16 },
    { header: "Còn trống", key: "remaining", width: 12 },
    { header: "% đầy", key: "fillRate", width: 10 },
    { header: "enrolledCount (DB)", key: "enrolledCount", width: 16 },
    { header: "Trạng thái lớp", key: "status", width: 14 },
    { header: "Đã hủy", key: "cancelled", width: 10 },
  ]
  styleHeader(s7)

  const classRows = subjectClasses
    .map((sc) => {
      const registeredCount = regByClass.get(sc.id)?.size || 0
      const max = sc.maxStudent || 0
      const remaining = Math.max(0, max - registeredCount)
      const fillRate = max > 0 ? `${((registeredCount / max) * 100).toFixed(1)}%` : ""
      return {
        classCode: sc.code || "",
        className: sc.name || "",
        subjectCode: sc.subject?.code || "",
        subjectName: sc.subject?.name || "",
        credit: sc.subject?.credit ?? "",
        maxStudent: max,
        registered: registeredCount,
        remaining,
        fillRate,
        enrolledCount: sc.enrolledCount ?? 0,
        status: sc.status || "",
        cancelled: sc.cancelled ? "Có" : "Không",
        _subjectId: sc.subjectId,
      }
    })
    .sort((a, b) => b.registered - a.registered || String(a.classCode).localeCompare(String(b.classCode)))

  classRows.forEach((row, idx) => {
    s7.addRow({
      stt: idx + 1,
      classCode: row.classCode,
      className: row.className,
      subjectCode: row.subjectCode,
      subjectName: row.subjectName,
      credit: row.credit,
      maxStudent: row.maxStudent,
      registered: row.registered,
      remaining: row.remaining,
      fillRate: row.fillRate,
      enrolledCount: row.enrolledCount,
      status: row.status,
      cancelled: row.cancelled,
    })
  })
  applyBorders(s7)

  // Sheet 8: Học phần (gộp theo SubjectVersion)
  const subjectAgg = new Map()
  for (const row of classRows) {
    const key = row._subjectId || `${row.subjectCode}|${row.subjectName}`
    if (!subjectAgg.has(key)) {
      subjectAgg.set(key, {
        subjectCode: row.subjectCode,
        subjectName: row.subjectName,
        credit: row.credit,
        classCount: 0,
        totalMax: 0,
        totalRegistered: 0,
        classesWithReg: 0,
        studentSet: new Set(),
      })
    }
    const agg = subjectAgg.get(key)
    agg.classCount += 1
    agg.totalMax += row.maxStudent || 0
    agg.totalRegistered += row.registered
    if (row.registered > 0) agg.classesWithReg += 1
  }
  // Distinct SV theo học phần (1 SV có thể đăng ký nhiều lớp cùng HP — hiếm; đếm theo log)
  for (const log of logs) {
    const subjectId = log.subjectClass?.subjectId || log.subjectClass?.subject?.id
    if (!subjectId) continue
    const key = subjectId
    if (!subjectAgg.has(key)) {
      subjectAgg.set(key, {
        subjectCode: log.subjectClass?.subject?.code || "",
        subjectName: log.subjectClass?.subject?.name || "",
        credit: log.subjectClass?.subject?.credit ?? "",
        classCount: 0,
        totalMax: 0,
        totalRegistered: 0,
        classesWithReg: 0,
        studentSet: new Set(),
      })
    }
    subjectAgg.get(key).studentSet.add(log.studentId)
  }

  const s8 = wb.addWorksheet("Hoc phan")
  s8.columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Mã học phần", key: "subjectCode", width: 14 },
    { header: "Tên học phần", key: "subjectName", width: 42 },
    { header: "Tín chỉ", key: "credit", width: 10 },
    { header: "Số lớp môn", key: "classCount", width: 12 },
    { header: "Lớp có SV ĐK", key: "classesWithReg", width: 14 },
    { header: "Tổng sĩ số max", key: "totalMax", width: 14 },
    { header: "Tổng chỗ đã ĐK", key: "totalRegistered", width: 14 },
    { header: "SV unique đã ĐK", key: "uniqueStudents", width: 16 },
    { header: "Còn trống", key: "remaining", width: 12 },
    { header: "% đầy", key: "fillRate", width: 10 },
  ]
  styleHeader(s8)

  const subjectRows = [...subjectAgg.values()]
    .map((agg) => {
      const remaining = Math.max(0, agg.totalMax - agg.totalRegistered)
      const fillRate =
        agg.totalMax > 0 ? `${((agg.totalRegistered / agg.totalMax) * 100).toFixed(1)}%` : ""
      return {
        subjectCode: agg.subjectCode,
        subjectName: agg.subjectName,
        credit: agg.credit,
        classCount: agg.classCount,
        classesWithReg: agg.classesWithReg,
        totalMax: agg.totalMax,
        totalRegistered: agg.totalRegistered,
        uniqueStudents: agg.studentSet.size,
        remaining,
        fillRate,
      }
    })
    .sort(
      (a, b) =>
        b.totalRegistered - a.totalRegistered ||
        String(a.subjectCode).localeCompare(String(b.subjectCode))
    )

  subjectRows.forEach((row, idx) => {
    s8.addRow({
      stt: idx + 1,
      ...row,
    })
  })
  applyBorders(s8)

  // Bổ sung tóm tắt học phần / lớp môn vào sheet Tổng hợp
  s1.addRows([
    { metric: "—", value: "" },
    { metric: "Số lớp môn trong học kỳ", value: subjectClasses.length },
    {
      metric: "  · Lớp môn có ít nhất 1 SV đăng ký",
      value: classRows.filter((r) => r.registered > 0).length,
    },
    {
      metric: "  · Lớp môn chưa có SV đăng ký",
      value: classRows.filter((r) => r.registered === 0).length,
    },
    { metric: "Số học phần trong học kỳ", value: subjectRows.length },
    {
      metric: "  · Học phần có SV đăng ký",
      value: subjectRows.filter((r) => r.totalRegistered > 0).length,
    },
  ])
  applyBorders(s1)

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
        subjectClassCount: subjectClasses.length,
        subjectClassWithReg: classRows.filter((r) => r.registered > 0).length,
        subjectCount: subjectRows.length,
        subjectWithReg: subjectRows.filter((r) => r.totalRegistered > 0).length,
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
