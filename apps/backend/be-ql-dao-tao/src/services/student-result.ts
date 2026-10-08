import {
  AcademicRankingBaseType,
  type AcademicRankingConvert,
  RankingContext,
} from "@workspace/db"
import { getTemplateBuffer } from "@workspace/libs/server"
import { formatDateVn } from "@workspace/libs/timezone"
import type { Borders, Font, Alignment } from "exceljs"
import { HTTPException } from "hono/http-exception"
import PizZip from "pizzip"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."

// ${semester}	Name of the semester.
const formatGpa = (val: any) => {
  const num = typeof val?.toNumber === "function" ? val.toNumber() : val
  if (num === null || num === undefined || isNaN(num)) return ""
  return num.toFixed(2).replace(".", ",")
}

// ${trainingObjectType}	 Name of the Training Object Type (e.g. Quân sự, Dân sự).

// ${table:data.no}	Sequential number (STT).
// ${table:data.code}	Student Code (Mã học viên).
// ${table:data.fullname}	Full name (Họ và tên).
// ${table:data.dateOfBirth}	Date of birth (DD/MM/YYYY).
// ${table:data.fixedClass}	Class code (Lớp).
// ${table:data.trainingCourse}	Training Course name (Khoá).
// ${table:data.studyYear}	Study Year (Năm học thứ).
// ${table:data.semesterIndexInCourse}	Semester index (Học kỳ thứ).
// ${table:data.gpaBase10}	GPA Base 10 (TBCHK hệ 10).
// ${table:data.cumulativeGpaBase10}	Cumulative GPA Base 10 (TL hệ 10).
// ${table:data.gpaBase4}	GPA Base 4 (TBCHK hệ 4).
// ${table:data.cumulativeGpaBase4}	Cumulative GPA Base 4 (TL hệ 4).
// ${table:data.conductScore}	Conduct Score (ĐRL).
// ${table:data.studentTrainingType}	Student Training Type (Xếp loại rèn luyện).
// ${table:data.rank}	Academic Rank (Xếp loại học lực).
// ${table:data.lowestFinalScore}	Lowest Final Score (Điểm thấp nhất).
// ${table:data.totalCredits}	Total Credits in Semester (TC đăng ký).
// ${table:data.retakingCredits}	Retaking Credits (TC học lại).
// ${table:data.reExamCredits}	Re-exam Credits (TC thi lại).
// ${table:data.passedCredits}	Passed Credits (TC đạt).
// ${table:data.failedCredits}	Failed Credits (TC nợ kỳ này).
// ${table:data.accumulatedCredits}	Accumulated Credits (TC tích lũy).
// ${table:data.totalCreditsByCurriculum}	Total Credits by Curriculum (TC theo CTĐT).
// ${table:data.totalFailedCredits}	Total Failed Credits (TC nợ tích lũy).
// ${table:data.foreignLangPass}	Foreign Language Pass status (Đạt chuẩn NN).
// ${table:data.academicWarningLevel}	Academic Warning Level (Mức CC học vụ).
// ${table:data.disciplinaryWarningLevel}	Disciplinary Warning Level (Mức CC rèn luyện).
// ${table:data.note}	Note (Ghi chú - e.g., Học cải thiện, Tạm hoãn, Đình chỉ...).

const isHiddenSemesterResultHeader = (value: unknown) => {
  const label = String(value ?? "")
    .trim()
    .toLowerCase()
  return (
    label === "khoá" ||
    label === "khóa" ||
    label.startsWith("học kỳ thứ") ||
    label.startsWith("năm học thứ")
  )
}

const columnIndexFromRef = (ref: string) => {
  const letters = ref.replace(/\d/g, "")
  let index = 0
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64)
  return index
}

const decodeXmlText = (value: string) =>
  value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")

const sharedStringValues = (sharedXml: string) => {
  const values: string[] = []
  for (const item of sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
    const text = [...item[1]!.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((part) => decodeXmlText(part[1] ?? ""))
      .join("")
    values.push(text)
  }
  return values
}

const hiddenHeaderColumns = (sheetXml: string, sharedStrings: string[]) => {
  const columns = new Set<number>()
  for (const cell of sheetXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
    const attrs = cell[1] ?? ""
    const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1]
    if (!ref || !/\bt="s"/.test(attrs)) continue
    const index = Number(cell[2]?.match(/<v>(\d+)<\/v>/)?.[1])
    if (!Number.isInteger(index) || !isHiddenSemesterResultHeader(sharedStrings[index])) continue
    columns.add(columnIndexFromRef(ref))
  }
  return columns
}

const hideColumnRanges = (colsXml: string, hiddenColumns: Set<number>) => {
  const columns = [...colsXml.matchAll(/<col\b([^>]*)\/>/g)].map((match) => {
    const attrs = match[1] ?? ""
    return {
      min: Number(attrs.match(/\bmin="(\d+)"/)?.[1]),
      max: Number(attrs.match(/\bmax="(\d+)"/)?.[1]),
      attrs,
    }
  })

  const pieces: string[] = []
  for (const column of columns) {
    if (!Number.isInteger(column.min) || !Number.isInteger(column.max)) {
      pieces.push(`<col${column.attrs}/>`)
      continue
    }

    let start = column.min
    let hidden = hiddenColumns.has(start)
    const emit = (from: number, to: number, isHidden: boolean) => {
      let attrs = column.attrs
        .replace(/\bmin="\d+"/, `min="${from}"`)
        .replace(/\bmax="\d+"/, `max="${to}"`)
        .replace(/\s+hidden="[^"]*"/, "")
      if (isHidden) attrs += ' hidden="1"'
      pieces.push(`<col${attrs}/>`)
    }

    for (let index = column.min + 1; index <= column.max; index++) {
      const nextHidden = hiddenColumns.has(index)
      if (nextHidden === hidden) continue
      emit(start, index - 1, hidden)
      start = index
      hidden = nextHidden
    }
    emit(start, column.max, hidden)
  }

  return `<cols>${pieces.join("")}</cols>`
}

/** Ẩn cột trên XML mẫu, không ghi lại workbook để giữ nguyên AutoFilter của bảng. */
const hideSemesterResultColumns = (buffer: Buffer) => {
  const zip = new PizZip(buffer)
  const sheetFile = zip.file("xl/worksheets/sheet1.xml")
  const sharedFile = zip.file("xl/sharedStrings.xml")
  if (!sheetFile || !sharedFile) return buffer

  const sheetXml = sheetFile.asText()
  const hiddenColumns = hiddenHeaderColumns(sheetXml, sharedStringValues(sharedFile.asText()))
  if (hiddenColumns.size === 0) return buffer

  const nextSheetXml = sheetXml.replace(/<cols>[\s\S]*?<\/cols>/, (colsXml) =>
    hideColumnRanges(colsXml, hiddenColumns)
  )
  if (nextSheetXml === sheetXml) return buffer

  zip.file("xl/worksheets/sheet1.xml", nextSheetXml)
  return zip.generate({ type: "nodebuffer" }) as Buffer
}

export async function exportStudentSemesterResult({
  semesterId,
  trainingObjectTypeId,
  trainingCourseId,
  fixedClassId,
}: {
  semesterId: string
  trainingObjectTypeId: string
  trainingCourseId?: string
  fixedClassId?: string
}) {
  const semester = await prisma.semester.findUniqueOrThrow({
    where: { id: semesterId },
  })

  const trainingObjectType = await prisma.trainingObjectType.findUniqueOrThrow({
    where: { id: trainingObjectTypeId },
  })

  const studentSemesterResults = await prisma.studentSemesterResult.findMany({
    where: {
      semesterId,
      student: {
        ...(fixedClassId ? { fixedClassId } : {}),
        fixedClass: {
          ...(trainingCourseId ? { trainingCourseId } : {}),
          trainingCourse: {
            trainingObjectTypeId,
          },
        },
      },
    },
    include: {
      student: {
        select: {
          userProfile: {
            select: {
              code: true,
              fullname: true,
              dateOfBirth: true,
            },
          },
          fixedClass: {
            select: {
              code: true,
              name: true,
              trainingCourse: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const data = studentSemesterResults.map((result, idx) => {
    const student = result.student
    const userProfile = student.userProfile
    const dateOfBirth = userProfile.dateOfBirth

    return {
      no: idx + 1,
      code: student.userProfile.code,
      fullname: userProfile.fullname,
      dateOfBirth: dateOfBirth ? `'${formatDateVn(dateOfBirth)}` : "",
      fixedClass: student.fixedClass?.code,
      trainingCourse: student.fixedClass?.trainingCourse?.name,

      // StudentSemesterResult Data
      studyYear: result.studyYear,
      semesterIndexInCourse: result.semesterIndexInCourse,
      gpaBase4: formatGpa(result.gpaBase4),
      cumulativeGpaBase4: formatGpa(result.cumulativeGpaBase4),
      cgpaBase4: formatGpa(result.cgpaBase4),
      gpaBase10: formatGpa(result.gpaBase10),
      cumulativeGpaBase10: formatGpa(result.cumulativeGpaBase10),
      cgpaBase10: formatGpa(result.cgpaBase10),
      conductScore: formatGpa(result.conductScore),
      studentTrainingType: result.studentTrainingType,
      lowestFinalScore: formatGpa(result.lowestFinalScore),
      totalCredits: result.totalCredits,
      registeredCredits: result.registeredCredits,
      retakingCredits: result.retakingCredits,
      reExamCredits: result.reExamCredits,
      passedCredits: result.passedCredits,
      failedCredits: result.failedCredits,
      accumulatedCredits: result.accumulatedCredits,
      totalCreditsByCurriculum: result.totalCreditsByCurriculum,
      totalFailedCredits: result.totalFailedCredits,
      foreignLangPass: result.foreignLangPass ? "Đạt" : "Không đạt",
      academicWarningLevel: result.academicWarningLevel,
      disciplinaryWarningLevel: result.disciplinaryWarningLevel,
      note: result.isImproving
        ? "Học cải thiện"
        : result.postponeWithReason
          ? "Tạm hoãn"
          : result.suspended
            ? "Đình chỉ"
            : result.expelled
              ? "Buộc thôi học"
              : "",
    }
  })

  const buffer = hideSemesterResultColumns(
    await getTemplateBuffer(prisma, "KET_QUA_HOC_TAP_HK.xlsx")
  )
  const template = new XlsxTemplate(buffer)

  template.substitute(1, {
    semester: semester.name,
    trainingObjectType: trainingObjectType.name,
    data,
  })

  const result = (await template.generate({ type: "arraybuffer" })) as ArrayBuffer

  return result
}

export async function exportStudentSemesterResultV2({
  semesterId,
  trainingObjectTypeId,
  trainingCourseId,
  fixedClassId,
}: {
  semesterId: string
  trainingObjectTypeId: string
  trainingCourseId?: string
  fixedClassId?: string
}) {
  const ExcelJS = await import("exceljs")

  const semester = await prisma.semester.findUniqueOrThrow({
    where: { id: semesterId },
    include: { schoolYear: true },
  })

  const fixedClasses = await prisma.fixedClass.findMany({
    where: {
      ...(fixedClassId ? { id: fixedClassId } : {}),
      ...(trainingCourseId ? { trainingCourseId } : {}),
      trainingCourse: { trainingObjectTypeId },
      deletedAt: null,
    },
    select: { id: true, name: true, code: true },
    orderBy: { code: "asc" },
  })

  if (fixedClasses.length === 0) {
    throw new HTTPException(404, { message: "Không tìm thấy lớp quản lý" })
  }

  const wb = new ExcelJS.Workbook()

  for (const fc of fixedClasses) {
    const students = await prisma.student.findMany({
      where: {
        fixedClassId: fc.id,
        deletedAt: null,
        OR: [
          { subjectClassStudent: { some: { subjectClass: { semesterId } } } },
          { studentSemesterResult: { some: { semesterId } } },
        ],
      },
      include: {
        userProfile: {
          select: {
            code: true,
            fullname: true,
            dateOfBirth: true,
            gender: { select: { sTen: true } },
          },
        },
        studentSemesterResult: {
          where: { semesterId },
          take: 1,
        },
        subjectClassStudent: {
          where: {
            subjectClass: { semesterId, deletedAt: null, active: true },
            deletedAt: null,
          },
          select: {
            finalScore: true,
            subjectClass: {
              select: {
                id: true,
                subjectId: true,
                subject: { select: { code: true, name: true, credit: true } },
              },
            },
          },
        },
      },
      orderBy: [{ userProfile: { firstName: "asc" } }, { userProfile: { lastName: "asc" } }],
    })

    if (students.length === 0) continue

    const subjectMap = new Map<string, { code: string; name: string; credit: number }>()
    const scoreMap = new Map<string, number | null>()

    for (const student of students) {
      for (const scs of student.subjectClassStudent) {
        const sc = scs.subjectClass
        if (!sc) continue
        const sv = sc.subject
        if (!subjectMap.has(sc.subjectId)) {
          subjectMap.set(sc.subjectId, {
            code: sv.code,
            name: sv.name,
            credit: sv.credit ?? 0,
          })
        }
        scoreMap.set(
          `${student.id}::${sc.subjectId}`,
          scs.finalScore != null ? Number(scs.finalScore) : null
        )
      }
    }

    const subjects = [...subjectMap.entries()].sort((a, b) => a[1].code.localeCompare(b[1].code))

    const subjectCount = subjects.length
    const FIXED_COLS_BEFORE = 5
    const FIXED_COLS_AFTER = 4
    const totalCols = FIXED_COLS_BEFORE + subjectCount + FIXED_COLS_AFTER

    const sheetName = (fc.code || fc.name).replace(/[\\/?*:[\]]/g, "_").slice(0, 31)
    const ws = wb.addWorksheet(sheetName)

    const baseFont: Partial<Font> = { name: "Times New Roman", size: 12 }
    const boldFont: Partial<Font> = { ...baseFont, bold: true }

    const thinBorder: Partial<Borders> = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }

    const centerAlign: Partial<Alignment> = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    }

    ws.views = [{ showGridLines: false }]

    // Row 1: empty
    ws.addRow([])

    // Row 2: title
    const titleRow = ws.addRow([`BẢNG ĐIỂM LỚP ${fc.name.toUpperCase()}`])
    ws.mergeCells(2, 1, 2, totalCols)
    titleRow.getCell(1).font = { ...boldFont, size: 12 }
    titleRow.getCell(1).alignment = { horizontal: "center" }

    // Row 3: semester info
    const schoolYearName = semester.schoolYear?.name || ""
    const semesterLabel = `${semester.name.toUpperCase()}. NĂM HỌC ${schoolYearName.toUpperCase()}. MÃ HỌC KỲ ${semester.code || ""}`
    const semesterRow = ws.addRow([semesterLabel])
    ws.mergeCells(3, 1, 3, totalCols)
    semesterRow.getCell(1).font = boldFont
    semesterRow.getCell(1).alignment = { horizontal: "center" }

    // Row 4: empty
    ws.addRow([])

    // Row 5-6: header (merged vertically)
    const headerValues: string[] = [
      "TT",
      "Mã định danh",
      "Họ tên",
      "GT",
      "Ngày sinh",
      ...subjects.map((_, idx) => String(idx)),
      "Số TC liệt",
      "Điểm TBC",
      "Số TC TL",
      "TBC TL",
    ]
    const headerRow1 = ws.addRow(headerValues)
    const headerRow2 = ws.addRow(Array(totalCols).fill(""))

    for (let c = 1; c <= totalCols; c++) {
      ws.mergeCells(5, c, 6, c)
      const cell = headerRow1.getCell(c)
      cell.font = boldFont
      cell.alignment = centerAlign
      cell.border = thinBorder
      headerRow2.getCell(c).border = thinBorder
    }

    // Column widths (from sample file)
    ws.getColumn(1).width = 5.86 // TT
    ws.getColumn(2).width = 13.43 // Mã định danh
    ws.getColumn(3).width = 42.14 // Họ tên
    ws.getColumn(4).width = 7 // GT
    ws.getColumn(5).width = 15.71 // Ngày sinh
    for (let i = 0; i < subjectCount; i++) {
      ws.getColumn(FIXED_COLS_BEFORE + i + 1).width = 13.57
    }
    ws.getColumn(FIXED_COLS_BEFORE + subjectCount + 1).width = 14 // Số TC liệt
    ws.getColumn(FIXED_COLS_BEFORE + subjectCount + 2).width = 15 // Điểm TBC
    ws.getColumn(FIXED_COLS_BEFORE + subjectCount + 3).width = 13.86 // Số TC TL
    ws.getColumn(FIXED_COLS_BEFORE + subjectCount + 4).width = 13.29 // TBC TL

    // Data rows
    for (let si = 0; si < students.length; si++) {
      const student = students[si]!
      const semResult = student.studentSemesterResult[0]
      const dob = student.userProfile?.dateOfBirth
        ? formatDateVn(student.userProfile.dateOfBirth)
        : ""

      const subjectScores: (number | string)[] = subjects.map(([subjectId]) => {
        const key = `${student.id}::${subjectId}`
        const score = scoreMap.get(key)
        return score != null ? score : ""
      })

      const failedCredits = semResult?.failedCredits ?? ""
      const gpa = semResult ? formatGpa(semResult.gpaBase4) : ""
      const accCredits = semResult?.accumulatedCredits ?? ""
      const cumGpa = semResult ? formatGpa(semResult.cumulativeGpaBase4) : ""

      const rowValues = [
        si + 1,
        student.userProfile?.code || "",
        student.userProfile?.fullname || "",
        student.userProfile?.gender?.sTen || "",
        dob,
        ...subjectScores,
        failedCredits,
        gpa,
        accCredits,
        cumGpa,
      ]

      const dataRow = ws.addRow(rowValues)
      for (let c = 1; c <= totalCols; c++) {
        const cell = dataRow.getCell(c)
        cell.font = baseFont
        cell.border = thinBorder
        cell.alignment =
          c <= 2 || c >= FIXED_COLS_BEFORE + subjectCount + 1
            ? { horizontal: "center", vertical: "middle" }
            : c === 3
              ? { vertical: "middle" }
              : { horizontal: "center", vertical: "middle" }
      }
    }

    // Footer: subject legend
    ws.addRow([])
    const legendPerRow = 2
    const colsPerLegend = Math.floor(totalCols / legendPerRow)

    for (let i = 0; i < subjects.length; i += legendPerRow) {
      const row = ws.addRow([])
      for (let j = 0; j < legendPerRow && i + j < subjects.length; j++) {
        const entry = subjects[i + j]!
        const sv = entry[1]
        const label = `${i + j}_${sv.code}:  STC(${sv.credit})_Tên:${sv.name}`
        const startCol = j * colsPerLegend + 1
        const endCol = Math.min(startCol + colsPerLegend - 1, totalCols)
        row.getCell(startCol).value = label
        row.getCell(startCol).font = { italic: true, size: 9 }
        ws.mergeCells(row.number, startCol, row.number, endCol)
      }
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  return buffer
}

// ${schoolYear}	Name of the school year.
// ${trainingObjectType}	 Name of the Training Object Type.

// ${table:data.no}	Sequential number (STT).
// ${table:data.code}	Student Code.
// ${table:data.fullname}	Full name.
// ${table:data.dateOfBirth}	Date of birth.
// ${table:data.fixedClass}	Class code.
// ${table:data.trainingCourse}	Training Course.
// ${table:data.studyYear}	Study Year.
// ${table:data.gpaBase10}	GPA Base 10.
// ${table:data.cumulativeGpaBase10}	Cumulative GPA Base 10.
// ${table:data.gpaBase4}	GPA Base 4.
// ${table:data.cumulativeGpaBase4}	Cumulative GPA Base 4.
// ${table:data.conductScore}	Conduct Score.
// ${table:data.studentTrainingType}	Student Training Type.
// ${table:data.rank}	Academic Rank.
// ${table:data.lowestFinalScore}	Lowest Final Score.
// ${table:data.totalCredits}	Total Credits.
// ${table:data.retakingCredits}	Retaking Credits.
// ${table:data.reExamCredits}	Re-exam Credits.
// ${table:data.failedCredits}	Failed Credits.
// ${table:data.academicWarningLevel}	Academic Warning Level.
// ${table:data.disciplinaryWarningLevel}	Disciplinary Warning Level.
// ${table:data.note}	Note.
export async function exportStudentYearResult({
  semesterId,
  schoolYearId,
  trainingObjectTypeId,
  trainingCourseId,
  fixedClassId,
}: {
  semesterId?: string
  schoolYearId?: string
  trainingObjectTypeId: string
  trainingCourseId?: string
  fixedClassId?: string
}) {
  const schoolYear = await prisma.schoolYear.findFirst({
    where: {
      OR: [
        { id: schoolYearId },
        {
          semesters: {
            some: {
              id: semesterId,
            },
          },
        },
      ],
    },
  })

  if (!schoolYear) {
    throw new HTTPException(404, { message: "Không tìm thấy năm học" })
  }

  const trainingObjectType = await prisma.trainingObjectType.findUniqueOrThrow({
    where: { id: trainingObjectTypeId },
  })

  const studentYearResults = await prisma.studentYearResult.findMany({
    where: {
      schoolYearId: schoolYear.id,
      student: {
        ...(fixedClassId ? { fixedClassId } : {}),
        ...(trainingCourseId
          ? {
              fixedClass: {
                trainingCourseId,
              },
            }
          : {}),
        curriculumVersion: {
          trainingObjectTypeId,
        },
      },
    },
    include: {
      student: {
        select: {
          userProfile: {
            select: {
              code: true,
              fullname: true,
              dateOfBirth: true,
            },
          },
          fixedClass: {
            select: {
              code: true,
              name: true,
              trainingCourse: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      rank: true,
    },
  })

  const data = studentYearResults.map((result, idx) => {
    const student = result.student
    const userProfile = student.userProfile
    const dateOfBirth = userProfile.dateOfBirth

    return {
      no: idx + 1,
      code: student.userProfile.code,
      fullname: userProfile.fullname,
      dateOfBirth: dateOfBirth ? `'${formatDateVn(dateOfBirth)}` : "",
      fixedClass: student.fixedClass?.code,
      trainingCourse: student.fixedClass?.trainingCourse?.name,
      // StudentYearResult Data
      studyYear: result.studyYear,
      gpaBase4: formatGpa(result.gpaBase4),
      cumulativeGpaBase4: formatGpa(result.cumulativeGpaBase4),
      cgpaBase4: formatGpa(result.cgpaBase4),
      gpaBase10: formatGpa(result.gpaBase10),
      cumulativeGpaBase10: formatGpa(result.cumulativeGpaBase10),
      cgpaBase10: formatGpa(result.cgpaBase10),
      conductScore: formatGpa(result.conductScore),
      studentTrainingType: result.studentTrainingType,
      rank: result.rank?.classification,
      lowestFinalScore: formatGpa(result.lowestFinalScore),
      totalCredits: result.totalCredits,
      retakingCredits: result.retakingCredits,
      reExamCredits: result.reExamCredits,
      failedCredits: result.failedCredits,
      registeredCredits: result.registeredCredits,
      passedCredits: result.passedCredits,
      accumulatedCredits: result.accumulatedCredits,
      totalCreditsByCurriculum: result.totalCreditsByCurriculum,
      totalFailedCredits: result.totalFailedCredits,

      academicWarningLevel: result.academicWarningLevel,
      disciplinaryWarningLevel: result.disciplinaryWarningLevel,
      note: result.suspended ? "Đình chỉ" : result.expelled ? "Buộc thôi học" : "",
    }
  })

  // Use 'KET_QUA_HOC_TAP_NAM.xlsx' template
  const buffer = await getTemplateBuffer(prisma, "KET_QUA_HOC_TAP_NAM.xlsx")
  const template = new XlsxTemplate(buffer)

  template.substitute(1, {
    schoolYear: schoolYear.name,
    trainingObjectType: trainingObjectType.name,
    data,
  })

  const result = (await template.generate({ type: "arraybuffer" })) as ArrayBuffer

  return result
}

const RANK_KEYS = ["xs", "gioi", "kha", "tbkha", "tb", "tbyeu", "yeu", "kem"] as const
type RankKey = (typeof RANK_KEYS)[number]
type RankCounts = Record<RankKey, number> & { soSV: number }

const RANK_NAME_TO_KEY: Record<string, RankKey> = {
  "xuất sắc": "xs",
  giỏi: "gioi",
  khá: "kha",
  "trung bình khá": "tbkha",
  "trung bình": "tb",
  "trung bình yếu": "tbyeu",
  yếu: "yeu",
  kém: "kem",
}

const toRankKey = (classification?: string | null) =>
  classification ? RANK_NAME_TO_KEY[classification.trim().toLowerCase()] : undefined

const emptyCounts = (): RankCounts => ({
  soSV: 0,
  xs: 0,
  gioi: 0,
  kha: 0,
  tbkha: 0,
  tb: 0,
  tbyeu: 0,
  yeu: 0,
  kem: 0,
})

const fmtCount = (n: number) => (n ? n : "")
const fmtPct = (n: number, total: number) =>
  n && total ? Math.round((n / total) * 1000) / 10 : ""

const toRankOutput = (counts: RankCounts) => ({
  soSV: counts.soSV,
  ...Object.fromEntries(
    RANK_KEYS.flatMap((k) => [
      [k, fmtCount(counts[k])],
      [`${k}Pct`, fmtPct(counts[k], counts.soSV)],
    ])
  ),
})

function buildRankSheetData(items: { classCode: string; classification?: string | null }[]) {
  const byClass = new Map<string, RankCounts>()
  for (const item of items) {
    const counts = byClass.get(item.classCode) ?? emptyCounts()
    counts.soSV++
    const key = toRankKey(item.classification)
    if (key) counts[key]++
    byClass.set(item.classCode, counts)
  }

  const total = emptyCounts()
  const rows = [...byClass.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([maLop, counts], idx) => {
      total.soSV += counts.soSV
      RANK_KEYS.forEach((k) => (total[k] += counts[k]))
      return { stt: idx + 1, maLop, ...toRankOutput(counts) }
    })

  return { rows, tong: toRankOutput(total) }
}

function classifyByGpa(
  gpa: number,
  trainingCourseId: string | undefined,
  baseScore: AcademicRankingBaseType,
  converts: AcademicRankingConvert[]
) {
  if (!trainingCourseId) return undefined
  const isBase10 = baseScore === AcademicRankingBaseType.Base10
  return converts.find((item) => {
    if (item.trainingCourseId !== trainingCourseId) return false
    const min = isBase10 ? item.base10Min : item.base4Min
    const max = isBase10 ? item.base10Max : item.base4Max
    return min !== null && max !== null && gpa >= min && gpa <= max
  })?.classification
}

export async function exportStudentSemesterResultV3({
  semesterId,
  trainingObjectTypeId,
  trainingCourseId,
  fixedClassId,
}: {
  semesterId: string
  trainingObjectTypeId: string
  trainingCourseId?: string
  fixedClassId?: string
}) {
  const semester = await prisma.semester.findUniqueOrThrow({
    where: { id: semesterId },
    include: { schoolYear: true },
  })

  const trainingObjectType = await prisma.trainingObjectType.findUniqueOrThrow({
    where: { id: trainingObjectTypeId },
  })

  const trainingCourse = trainingCourseId
    ? await prisma.trainingCourse.findUnique({ where: { id: trainingCourseId } })
    : null

  const studentFilter = {
    ...(fixedClassId ? { fixedClassId } : {}),
    fixedClass: {
      ...(trainingCourseId ? { trainingCourseId } : {}),
      trainingCourse: { trainingObjectTypeId },
    },
  }

  const studentSelect = {
    select: {
      fixedClass: { select: { code: true, trainingCourseId: true } },
    },
  }

  const semesterResults = await prisma.studentSemesterResult.findMany({
    where: { semesterId, student: studentFilter },
    select: {
      baseScore: true,
      cumulativeGpaBase4: true,
      cumulativeGpaBase10: true,
      rank: { select: { classification: true } },
      student: studentSelect,
    },
  })

  if (semesterResults.length === 0) {
    throw new HTTPException(404, { message: "Chưa có kết quả tổng kết học kỳ" })
  }

  const yearResults = await prisma.studentYearResult.findMany({
    where: { schoolYearId: semester.schoolYearId, student: studentFilter },
    select: {
      rank: { select: { classification: true } },
      student: studentSelect,
    },
  })

  const trainingCourseIds = [
    ...new Set(
      semesterResults
        .map((r) => r.student.fixedClass?.trainingCourseId)
        .filter((id): id is string => !!id)
    ),
  ]

  const rankingConverts = await prisma.academicRankingConvert.findMany({
    where: {
      trainingCourseId: { in: trainingCourseIds },
      context: RankingContext.STUDYING,
      deletedAt: null,
    },
  })

  const sheetHK = buildRankSheetData(
    semesterResults.map((r) => ({
      classCode: r.student.fixedClass?.code ?? "",
      classification: r.rank?.classification,
    }))
  )

  const sheetNH = buildRankSheetData(
    yearResults.map((r) => ({
      classCode: r.student.fixedClass?.code ?? "",
      classification: r.rank?.classification,
    }))
  )

  const sheetTL = buildRankSheetData(
    semesterResults.map((r) => {
      const isBase10 = r.baseScore === AcademicRankingBaseType.Base10
      const gpa = Number(isBase10 ? r.cumulativeGpaBase10 : r.cumulativeGpaBase4)
      return {
        classCode: r.student.fixedClass?.code ?? "",
        classification: classifyByGpa(
          gpa,
          r.student.fixedClass?.trainingCourseId,
          r.baseScore,
          rankingConverts
        ),
      }
    })
  )

  const doiTuong = trainingCourse?.name ?? trainingObjectType.name

  const buffer = await getTemplateBuffer(prisma, "TK_KQHT_THEO_PHAN_TRAM.xlsx")
  const template = new XlsxTemplate(buffer)

  template.substitute(1, {
    doiTuong,
    thoiDiem: `Đến hiện tại ${formatDateVn(new Date())} (TÍCH LŨY)`,
    ...sheetTL,
  })
  template.substitute(2, {
    doiTuong,
    thoiDiem: `Năm học ${semester.schoolYear.name}`,
    ...sheetNH,
  })
  template.substitute(3, {
    doiTuong,
    thoiDiem: semester.name,
    ...sheetHK,
  })

  return (await template.generate({ type: "arraybuffer" })) as ArrayBuffer
}
