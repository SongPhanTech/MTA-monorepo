import { HTTPException } from "hono/http-exception"
import { $Enums } from "@workspace/db"
import { formatDateVn } from "@workspace/libs/timezone"
import type { SheetExportOptions, TableRow } from "@workspace/libs/template-excel-core"
import { prisma } from ".."
import { buildFromTemplate } from "./build-from-template"

type ScoreValue = string | number | null

function toNumericScore(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".")
    if (normalized === "") return null
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (value && typeof value === "object") {
    const maybeNumber = (value as { toNumber?: () => number }).toNumber?.()
    if (typeof maybeNumber === "number" && Number.isFinite(maybeNumber)) return maybeNumber
    const text = String(value).trim().replace(",", ".")
    if (text && text !== "[object Object]") {
      const parsed = Number(text)
      return Number.isFinite(parsed) ? parsed : null
    }
  }
  return null
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return ""
  return formatDateVn(value) || ""
}

function uniqueSheetName(name: string, used: Set<string>): string {
  const sanitized = name.replace(/[\\/?:*[\]]/g, "_").trim()
  const baseName = sanitized.slice(0, 31) || "Sheet"
  if (!used.has(baseName)) {
    used.add(baseName)
    return baseName
  }
  let counter = 1
  while (true) {
    const suffix = ` (${counter})`
    const candidate = `${sanitized.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`
    if (!used.has(candidate)) {
      used.add(candidate)
      return candidate
    }
    counter++
  }
}

type SubjectExport = {
  semester: number | null
  graduation: boolean | null
  subject: { id: string; name: string; credit: number | null }
}

function displayScore(
  scoreData:
    | {
        subjectClassId: string | null
        exempted: boolean | null
        examPostponed: boolean | null
        examBanned: boolean | null
        suspended: boolean | null
        manualFinalScore: unknown
        finalScore: unknown
      }
    | undefined
): ScoreValue {
  if (!scoreData) return " "
  if (scoreData.exempted) return "Miễn"
  if (scoreData.examPostponed) return "HT"
  if (scoreData.examBanned) return "CT"
  if (scoreData.suspended) return "ĐCT"
  const final =
    scoreData.manualFinalScore != null ? scoreData.manualFinalScore : scoreData.finalScore
  return final != null ? (toNumericScore(final) ?? String(final)) : "Null"
}

export async function exportBangDiemTheoLop({ trainingCourseId }: { trainingCourseId: string }) {
  if (!trainingCourseId) {
    throw new HTTPException(400, { message: "Không xác định được khóa học" })
  }

  const classes = await prisma.fixedClass.findMany({
    where: { trainingCourseId, deletedAt: null, active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      trainingCourse: {
        select: {
          name: true,
          scoreToPassGraduation: true,
          trainingObjectType: { select: { name: true } },
          semesterStart: {
            select: {
              schoolYear: { select: { startDate: true, endDate: true } },
            },
          },
        },
      },
      curriculumVersion: {
        select: {
          curriculum: {
            select: {
              trainingMajor: { select: { code: true, name: true } },
            },
          },
          trainingBlocks: {
            orderBy: { priority: "asc" },
            select: {
              subjects: {
                orderBy: { semester: "asc" },
                select: {
                  semester: true,
                  graduation: true,
                  subject: { select: { id: true, name: true, credit: true } },
                },
              },
            },
          },
        },
      },
      students: {
        where: { active: true, status: $Enums.StudentStatus.ENROLLED, deletedAt: null },
        select: {
          foreignLangPass: true,
          userProfile: { select: { fullname: true, dateOfBirth: true } },
          thesisRegistrations: {
            where: { deletedAt: null },
            select: {
              thesisProject: {
                select: { defenseRecord: { select: { finalScore: true } } },
              },
            },
          },
          subjectClassStudent: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
            select: {
              subjectVersionId: true,
              subjectClassId: true,
              exempted: true,
              examPostponed: true,
              examBanned: true,
              suspended: true,
              manualFinalScore: true,
              finalScore: true,
            },
          },
        },
      },
    },
  })

  if (!classes.length) {
    throw new HTTPException(404, { message: "Không tìm thấy lớp biên chế nào trong khóa học" })
  }

  const usedSheetNames = new Set<string>()
  const allSheets: SheetExportOptions[] = []

  for (const detail of classes) {
    const students = detail.students
    if (!students.length) continue

    const subjectsInOrder: SubjectExport[] = (detail.curriculumVersion?.trainingBlocks ?? [])
      .flatMap((block) =>
        block.subjects.map((s) => ({
          semester: s.semester,
          graduation: s.graduation,
          subject: {
            id: s.subject.id,
            name: s.subject.name,
            credit: toNumericScore(s.subject.credit),
          },
        }))
      )
      .sort((a, b) => (a.semester ?? 0) - (b.semester ?? 0))

    const scoreToPassGraduation = detail.trainingCourse.scoreToPassGraduation ?? 5.5
    const tongSoHP = subjectsInOrder.length
    const tongSoTC = subjectsInOrder.reduce((s, sub) => s + (sub.subject.credit ?? 0), 0)
    const chuthichMonHoc = subjectsInOrder.map((s, idx) => `M${idx + 1}. ${s.subject.name}`)

    const studentRows: TableRow[] = students.map((student, index) => {
      const defenseScore =
        student.thesisRegistrations
          .map((r) => toNumericScore(r.thesisProject?.defenseRecord?.finalScore))
          .find((score) => score != null) ?? null

      const diem: ScoreValue[] = subjectsInOrder.map((subjectInfo) => {
        const matches = student.subjectClassStudent.filter(
          (score) => score.subjectVersionId === subjectInfo.subject.id
        )
        const classMatch = [...matches].reverse().find((score) => score.subjectClassId)
        const phienMatch = matches.find((score) => !score.subjectClassId)
        return displayScore(classMatch ?? phienMatch)
      })

      const ccta = student.foreignLangPass ? "Đạt" : ""
      let totalWeightedScore = 0
      let totalCredits = 0
      subjectsInOrder.forEach((subjectInfo, i) => {
        const numericD = toNumericScore(diem[i])
        const credit = Number(subjectInfo.subject.credit ?? 0)
        if (numericD != null && Number.isFinite(numericD) && credit > 0) {
          totalWeightedScore += numericD * credit
          totalCredits += credit
        }
      })
      const tbcDisplay =
        totalCredits > 0 ? Number((totalWeightedScore / totalCredits).toFixed(2)) : null

      let dlv: number | null = null
      if (defenseScore != null) {
        dlv = defenseScore
      } else {
        const thesisIdx = subjectsInOrder.findIndex((s) => {
          const name = s.subject.name.toLowerCase()
          return name.includes("luận văn") || name.includes("đề án")
        })
        if (thesisIdx >= 0) {
          const numericD = toNumericScore(diem[thesisIdx])
          if (numericD != null) dlv = numericD
        }
      }

      return {
        cells: [
          { value: index + 1, align: "center" as const, border: true },
          { value: student.userProfile.fullname, border: true, align: "center" as const },
          {
            value: formatDate(student.userProfile.dateOfBirth),
            align: "center" as const,
            border: true,
          },
          {
            value: detail.trainingCourse.trainingObjectType?.name ?? "",
            align: "center" as const,
            border: true,
          },
          ...subjectsInOrder.map((subjectInfo, i) => {
            const scoreValue = diem[i]
            const isGraduation = subjectInfo.graduation === true
            const passThreshold = isGraduation ? scoreToPassGraduation : 4.0
            const numericScore = toNumericScore(scoreValue)
            const isFailed =
              numericScore != null && Number.isFinite(numericScore)
                ? numericScore < passThreshold
                : false
            return {
              value: scoreValue != null ? String(scoreValue) : null,
              align: "center" as const,
              border: true,
              color: isFailed ? "FFFF0000" : undefined,
            }
          }),
          { value: ccta || null, align: "center" as const, border: true },
          {
            value: tbcDisplay != null ? String(tbcDisplay) : null,
            align: "center" as const,
            border: true,
            bold: true,
          },
          {
            value: dlv != null ? String(dlv) : null,
            align: "center" as const,
            border: true,
            bold: true,
          },
        ],
      }
    })

    type SemesterGroup = { semesterNum: number; subjects: SubjectExport[] }
    const semesterGroups: SemesterGroup[] = []
    for (const s of subjectsInOrder) {
      const semNum = s.semester ?? 0
      let group = semesterGroups.find((g) => g.semesterNum === semNum)
      if (!group) {
        group = { semesterNum: semNum, subjects: [] }
        semesterGroups.push(group)
      }
      group.subjects.push(s)
    }
    semesterGroups.sort((a, b) => a.semesterNum - b.semesterNum)

    const schoolYear = detail.trainingCourse.semesterStart?.schoolYear
    const getSemesterLabel = (semNum: number): string => {
      const semesterIndexInYear = ((semNum - 1) % 2) + 1
      const schoolYearOffset = Math.floor((semNum - 1) / 2)
      const semesterName = `Học kỳ ${semesterIndexInYear}`
      if (!schoolYear?.startDate) return semesterName
      const startYear = new Date(schoolYear.startDate).getFullYear() + schoolYearOffset
      const endYear = schoolYear.endDate
        ? new Date(schoolYear.endDate).getFullYear() + schoolYearOffset
        : startYear + 1
      return `${semesterName} (năm học ${startYear}-${endYear})`
    }

    const totalSubjectCols = subjectsInOrder.length
    const totalTableCols = 4 + totalSubjectCols + 3

    const headerRow5: TableRow = {
      cells: [
        { value: null, border: true, rowSpan: 2 },
        {
          value: `Lớp: ${detail.name}`,
          align: "center",
          bold: true,
          border: true,
          colSpan: 2,
          rowSpan: 2,
          wrapText: true,
        },
        {
          value: "Bảng điểm các học phần cơ sở và chuyên ngành",
          align: "center",
          bold: true,
          border: true,
          colSpan: totalTableCols - 3,
          wrapText: true,
        },
      ],
    }

    const headerRow6Cells: TableRow["cells"] = [
      {
        value: "Đối tượng",
        align: "center",
        bold: true,
        border: true,
        rowSpan: 3,
        wrapText: true,
      },
    ]
    for (const group of semesterGroups) {
      headerRow6Cells.push({
        value: getSemesterLabel(group.semesterNum),
        align: "center",
        bold: true,
        border: true,
        colSpan: group.subjects.length,
        wrapText: true,
      })
    }
    headerRow6Cells.push(
      { value: null, border: true },
      { value: null, border: true },
      { value: null, border: true }
    )
    const headerRow6: TableRow = { cells: headerRow6Cells }

    const headerRow7Left: TableRow = {
      cells: [
        { value: "STT", align: "center", bold: true, border: true, rowSpan: 2, wrapText: true },
        {
          value: "Họ và tên",
          align: "center",
          bold: true,
          border: true,
          rowSpan: 2,
          wrapText: true,
        },
        {
          value: "Ngày sinh",
          align: "center",
          bold: true,
          border: true,
          rowSpan: 2,
          wrapText: true,
        },
      ],
    }

    const headerRow7Score: TableRow = {
      cells: [
        ...subjectsInOrder.map((_, i) => ({
          value: `M${i + 1}`,
          align: "center" as const,
          bold: true,
          border: true,
          wrapText: false,
        })),
        {
          value: "CCTA",
          align: "center",
          bold: true,
          border: true,
          rowSpan: 2,
          wrapText: false,
        },
        {
          value: "Điểm",
          align: "center",
          bold: true,
          border: true,
          colSpan: 2,
          wrapText: false,
        },
      ],
    }

    const headerRow8Credit: TableRow = {
      cells: subjectsInOrder.map((s) => ({
        value: s.subject.credit ? Number(s.subject.credit).toFixed(1) : "",
        align: "center" as const,
        border: true,
        wrapText: false,
      })),
    }

    const headerRow8Score: TableRow = {
      cells: [
        { value: "TBC", align: "center", bold: true, border: true, wrapText: false },
        { value: "ĐLV", align: "center", bold: true, border: true, wrapText: false },
      ],
    }

    const thongKeRows: TableRow[] = [
      {
        cells: [
          {
            value: `Tổng số học phần: ${tongSoHP} HP, tổng số tín chỉ: ${tongSoTC} TC`,
            border: false,
            colSpan: totalTableCols,
            bold: true,
          },
        ],
      },
    ]

    const chuthichPerRow = 3
    const maxRowsPerColumn = Math.ceil(chuthichMonHoc.length / chuthichPerRow) || 0
    const footerColSpan = Math.ceil(totalTableCols / chuthichPerRow)
    const columnFooterRows: TableRow[] = []
    for (let i = 0; i < maxRowsPerColumn; i++) {
      const rowCells: TableRow["cells"] = []
      for (let col = 0; col < chuthichPerRow; col++) {
        const idx = i + col * maxRowsPerColumn
        rowCells.push(
          chuthichMonHoc[idx]
            ? {
                value: chuthichMonHoc[idx],
                border: false,
                colSpan: footerColSpan,
                wrapText: false,
              }
            : { value: null, border: false, colSpan: footerColSpan, wrapText: false }
        )
      }
      columnFooterRows.push({ cells: rowCells })
    }

    const ghiChuRows: TableRow[] = [
      { cells: [{ value: null, border: false }] },
      {
        cells: [
          { value: null, border: false },
          { value: "GHI CHÚ:", border: false, bold: true, colSpan: 29 },
        ],
      },
      {
        cells: [
          { value: null, border: false },
          {
            value:
              "1. 'Null': Môn đã lên danh sách thi nhưng chưa thi hoặc giảng viên chưa nhập điểm",
            border: false,
            colSpan: 29,
          },
        ],
      },
      {
        cells: [
          { value: null, border: false },
          { value: "2. ' ': Môn chưa lên danh sách thi", border: false, colSpan: 29 },
        ],
      },
      {
        cells: [
          { value: null, border: false },
          { value: "3. 'Miễn': Môn miễn học", border: false, colSpan: 29 },
        ],
      },
      {
        cells: [
          { value: null, border: false },
          { value: "4. 'HT': Môn hoãn thi", border: false, colSpan: 29 },
        ],
      },
      {
        cells: [
          { value: null, border: false },
          { value: "4. 'CT': Môn cấm thi", border: false, colSpan: 29 },
        ],
      },
      {
        cells: [
          { value: null, border: false },
          { value: "5. 'ĐCT': Môn đình chỉ thi", border: false, colSpan: 29 },
        ],
      },
      {
        cells: [
          { value: null, border: false },
          {
            value:
              "6. Điểm TBC: Tính điểm trung bình cộng của tất cả các môn đã có điểm ở thời điểm xuất file excel điểm (Không tính điểm môn chưa thi, không tính điểm môn hoãn thi, miễn thi)",
            border: false,
            colSpan: 29,
          },
        ],
      },
    ]

    const bodyRows = [...studentRows, ...thongKeRows, ...columnFooterRows, ...ghiChuRows]
    const nganhHoacChuyenNganh = detail.curriculumVersion?.curriculum?.trainingMajor
    const chuyenNganhText = [nganhHoacChuyenNganh?.code, nganhHoacChuyenNganh?.name]
      .filter(Boolean)
      .join(" - ")
    const sheetName = uniqueSheetName(detail.name, usedSheetNames)

    allSheets.push(
      {
        sheet: sheetName,
        data: {
          khoa: detail.trainingCourse.name.toUpperCase(),
          chuyenNganh: chuyenNganhText,
          lop: detail.name,
        },
        tableStartCell: { row: 5, col: 1 },
        rows: [headerRow5],
      },
      { sheet: sheetName, tableStartCell: { row: 6, col: 4 }, rows: [headerRow6] },
      { sheet: sheetName, tableStartCell: { row: 7, col: 1 }, rows: [headerRow7Left] },
      { sheet: sheetName, tableStartCell: { row: 7, col: 5 }, rows: [headerRow7Score] },
      { sheet: sheetName, tableStartCell: { row: 8, col: 5 }, rows: [headerRow8Credit] },
      {
        sheet: sheetName,
        tableStartCell: { row: 8, col: 5 + totalSubjectCols + 1 },
        rows: [headerRow8Score],
      },
      { sheet: sheetName, tableStartCell: { row: 9, col: 1 }, rows: bodyRows }
    )
  }

  if (!allSheets.length) {
    throw new HTTPException(400, { message: "Không có dữ liệu điểm để xuất" })
  }

  const courseName = classes[0]?.trainingCourse.name ?? "KhoaHoc"
  const fileName = `BangDiemToanKhoa-${courseName}.xlsx`
  const buffer = await buildFromTemplate(prisma, {
    templatePath: "/mta/template/BangdiemTheoLop_v3.xlsx",
    fileName,
    sheets: allSheets,
  })

  return { buffer, fileName }
}
