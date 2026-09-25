import { HTTPException } from "hono/http-exception"
import ExcelJS from "exceljs"
import { formatDateVn, nowVn } from "@workspace/libs/timezone"
import type { SheetExportOptions, TableRow } from "@workspace/libs/template-excel-core"
import { prisma } from ".."
import { buildFromTemplate } from "./build-from-template"

/** Template quatrinh.xlsx dùng chung; đổi tiêu đề khi xuất bảng điểm cá nhân. */
async function retitleBangDiemCaNhan(buffer: Buffer): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
  )
  const replacements: Array<[RegExp, string]> = [
    [/BẢNG ĐIỂM QUÁ TRÌNH/gi, "BẢNG ĐIỂM CÁ NHÂN"],
    [/BANG DIEM QUA TRINH/gi, "BANG DIEM CA NHAN"],
  ]
  for (const sheet of workbook.worksheets) {
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value === "string") {
          let next = cell.value
          for (const [pattern, replacement] of replacements) {
            next = next.replace(pattern, replacement)
          }
          if (next !== cell.value) cell.value = next
        }
      })
    })
  }
  return Buffer.from(await workbook.xlsx.writeBuffer())
}

type ScoreRange = {
  base10Min: number
  base10Max: number
  base4: number
  letter: string
  classification: string
  pass: boolean
  improvementRegister: boolean
}

type ConvertedScore = {
  base4: number | null
  letter: string
  classification: string
  pass: boolean
  improvementRegister?: boolean
}

type MonHoc = {
  TenMonhoc: string
  MaMH: string
  soTC: number
  diem01: number | null
  diem02: number | null
  diem07: number | null
  diemhe10: number
  diemhe4: number
  diemchu: string
  ghichu: string
}

type HocKi = {
  TenHocKi: string
  SoTinChiKy: number | null
  DiemTBKyHe10: number | null
  DiemTBKyHe4: number | null
  monHocs: MonHoc[]
}

function toNullableNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    const n = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(n) ? n : null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** Năm học mới nhất theo thời gian năm học, không phụ thuộc cờ isLastStudyYear cũ. */
export function pickLatestYearResult<
  T extends {
    studyYear?: number | null
    schoolYear?: { startDate?: Date | null; endDate?: Date | null } | null
  },
>(results: T[]): T | null {
  if (results.length === 0) return null
  return (
    [...results].sort((a, b) => {
      const aTime =
        a.schoolYear?.endDate?.getTime() ?? a.schoolYear?.startDate?.getTime() ?? 0
      const bTime =
        b.schoolYear?.endDate?.getTime() ?? b.schoolYear?.startDate?.getTime() ?? 0
      if (bTime !== aTime) return bTime - aTime
      return (b.studyYear ?? 0) - (a.studyYear ?? 0)
    })[0] ?? null
  )
}

type CumulativeRankRange = {
  classification: string
  baseScore?: string | null
  base10Min?: number | null
  base10Max?: number | null
  base4Min?: number | null
  base4Max?: number | null
  rankOrder?: number | null
}

/** Xếp loại toàn khoá theo GPA tích luỹ. */
export function classificationFromCumulativeGpa({
  gpa10,
  gpa4,
  baseScore,
  ranks,
}: {
  gpa10: number | null
  gpa4: number | null
  baseScore?: string | null
  ranks?: CumulativeRankRange[] | null
}): string {
  if (!ranks?.length) return ""
  const useBase4 = baseScore === "Base4"
  const gpa = useBase4 ? gpa4 : gpa10
  if (gpa == null) return ""
  const matched = [...ranks]
    .filter((r) => !r.baseScore || !baseScore || r.baseScore === baseScore)
    .sort((a, b) => (a.rankOrder ?? 99) - (b.rankOrder ?? 99))
    .find((r) => {
      if (useBase4) {
        return r.base4Min != null && r.base4Max != null && gpa >= r.base4Min && gpa <= r.base4Max
      }
      return r.base10Min != null && r.base10Max != null && gpa >= r.base10Min && gpa <= r.base10Max
    })
  return matched?.classification ?? ""
}

function getFinalScore(manualFinalScore: unknown, finalScore: unknown): number {
  if (manualFinalScore != null) return toNullableNumber(manualFinalScore) ?? 0
  if (finalScore != null) return toNullableNumber(finalScore) ?? 0
  return 0
}

function convertScore(finalScore: number, scoreRanges: ScoreRange[]): ConvertedScore {
  const sortedRanges = [...scoreRanges].sort((a, b) => b.base10Min - a.base10Min)
  const matched = sortedRanges.find(
    (range) => finalScore >= range.base10Min && finalScore <= range.base10Max
  )

  if (!matched) {
    return {
      base4: null,
      letter: "-",
      classification: "Không xác định",
      pass: false,
      improvementRegister: false,
    }
  }

  return {
    base4: matched.base4,
    letter: matched.letter,
    classification: matched.classification,
    pass: matched.pass,
    improvementRegister: matched.improvementRegister,
  }
}

function convertScoreWithGraduation({
  score,
  isGraduation,
  isConditional,
  attendanceScore,
  midtermScore,
  examScore,
  scoreToPassGraduation,
  scoreToPassConditional,
  scoreToPass,
  scoreToTakeExam,
  examScoreToPass,
  scoreRanges,
}: {
  score: number
  isGraduation: boolean
  isConditional: boolean
  attendanceScore?: number | null
  midtermScore?: number | null
  examScore?: number | null
  scoreToPassGraduation: number
  scoreToPassConditional: number
  scoreToPass: number
  scoreToTakeExam: number | null
  examScoreToPass: number | null
  scoreRanges: ScoreRange[]
}): ConvertedScore {
  const isFailByConfig =
    (attendanceScore != null && scoreToTakeExam != null && attendanceScore < scoreToTakeExam) ||
    (midtermScore != null && scoreToTakeExam != null && midtermScore < scoreToTakeExam) ||
    (examScore != null && examScoreToPass != null && examScore < examScoreToPass)

  const failGraduation = isGraduation && score < scoreToPassGraduation
  const failConditional = isConditional && score < scoreToPassConditional
  const failNormal = !isGraduation && !isConditional && score < scoreToPass

  if (failGraduation || failConditional || failNormal || isFailByConfig) {
    return { base4: 0, letter: "F", pass: false, classification: "" }
  }
  return convertScore(score, scoreRanges)
}

function formatDateOfBirth(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return ""
  const formatted = formatDateVn(dateInput)
  return formatted || ""
}

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/*?:[\]]/g, "_").trim()
  return cleaned.slice(0, 31) || "Sheet"
}

function signatureDateLabel(): string {
  const today = nowVn()
  return `Hà Nội, ngày ${today.date()} tháng ${today.month() + 1} năm ${today.year()}`
}

function signatureRows(signatureDate: string): TableRow[] {
  return [
    {
      cells: [
        { value: null, colSpan: 12, border: false },
        {
          value: signatureDate,
          colSpan: 6,
          border: false,
          align: "center",
        },
      ],
    },
    {
      cells: [
        { value: null, colSpan: 12, border: false },
        {
          value: "  KT. TRƯỞNG PHÒNG \n PHÓ TRƯỞNG PHÒNG",
          colSpan: 6,
          border: false,
          align: "center",
          bold: true,
        },
      ],
    },
    {
      cells: [
        { value: null, colSpan: 12, border: false },
        {
          value: "Đại tá, TS Nguyễn Văn Bình												",
          colSpan: 6,
          border: false,
          align: "center",
          bold: true,
        },
      ],
    },
  ]
}

type SemesterMeta = {
  id: string
  code: string | null
  name: string | null
  startDate: Date | null
  createdAt: Date | null
  schoolYearName: string | null
  semesterIndex: number | null
}

type CtdtSubjectInfo = {
  semester: number | null
  graduation: boolean
  isConditional: boolean
}

type SemesterResultStats = {
  registeredCredits: number | null
  gpaBase10: number | null
  gpaBase4: number | null
  accumulatedCredits: number | null
  cumulativeGpaBase10: number | null
  cumulativeGpaBase4: number | null
  classification: string
  semesterIndexInCourse: number
}

function toSemesterMeta(
  semester: {
    id: string
    code: string | null
    name: string | null
    startDate: Date | null
    createdAt: Date | null
    schoolYear?: { name: string | null } | null
  },
  semesterIndex: number | null = null
): SemesterMeta {
  return {
    id: semester.id,
    code: semester.code,
    name: semester.name,
    startDate: semester.startDate,
    createdAt: semester.createdAt,
    schoolYearName: semester.schoolYear?.name ?? null,
    semesterIndex,
  }
}

async function loadBangDiemExportData(studentIds: string[]) {
  const uniqueIds = [...new Set(studentIds.filter(Boolean))]
  if (uniqueIds.length === 0) {
    throw new HTTPException(400, { message: "Danh sách học viên trống" })
  }

  const students = await prisma.student.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      curriculumVersionId: true,
      userProfile: {
        select: {
          code: true,
          fullname: true,
          dateOfBirth: true,
        },
      },
      studentYearResult: {
        select: {
          studyYear: true,
          isLastStudyYear: true,
          accumulatedCredits: true,
          cumulativeGpaBase10: true,
          cumulativeGpaBase4: true,
          rank: { select: { classification: true } },
          schoolYear: { select: { startDate: true, endDate: true } },
        },
      },
      fixedClass: {
        select: {
          name: true,
          curriculumVersionId: true,
          trainingCourse: {
            select: {
              name: true,
              baseScore: true,
              scoreToPassGraduation: true,
              scoreToPassConditional: true,
              scoreToPass: true,
              scoreToTakeExam: true,
              examScoreToPass: true,
              trainingObjectType: { select: { name: true } },
              scoreConverts: true,
              academicRankingConvert: {
                where: { context: "STUDYING", deletedAt: null, active: true },
                orderBy: { rankOrder: "asc" },
                select: {
                  classification: true,
                  baseScore: true,
                  base10Min: true,
                  base10Max: true,
                  base4Min: true,
                  base4Max: true,
                  rankOrder: true,
                },
              },
            },
          },
          curriculumVersion: {
            select: {
              curriculum: {
                select: {
                  trainingField: { select: { name: true } },
                  trainingMajor: {
                    select: {
                      name: true,
                      trainingField: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (students.length === 0) {
    throw new HTTPException(404, { message: "Không tìm thấy học viên" })
  }

  const studentById = new Map(students.map((s) => [s.id, s]))
  const orderedStudents = uniqueIds
    .map((id) => studentById.get(id))
    .filter((s): s is (typeof students)[number] => Boolean(s))

  const scores = await prisma.studentSubjectScore.findMany({
    where: { studentId: { in: orderedStudents.map((s) => s.id) }, deletedAt: null },
    select: {
      studentId: true,
      semesterId: true,
      manualFinalScore: true,
      finalScore: true,
      attendanceScore: true,
      midtermScore: true,
      examScore: true,
      description: true,
      subjectVersion: {
        select: {
          id: true,
          name: true,
          code: true,
          credit: true,
          trainingBlocks: {
            select: { graduation: true, useForFinalScore: true },
            take: 1,
          },
        },
      },
      semester: {
        select: {
          id: true,
          code: true,
          name: true,
          startDate: true,
          createdAt: true,
          schoolYear: { select: { name: true } },
        },
      },
      subjectClassId: true,
      subjectClass: {
        select: {
          id: true,
          semester: {
            select: {
              id: true,
              code: true,
              name: true,
              startDate: true,
              createdAt: true,
              schoolYear: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  const scoresByStudent = new Map<string, (typeof scores)[number][]>()
  for (const row of scores) {
    const list = scoresByStudent.get(row.studentId) ?? []
    list.push(row)
    scoresByStudent.set(row.studentId, list)
  }

  const curriculumVersionIds = [
    ...new Set(
      orderedStudents
        .map((s) => s.curriculumVersionId || s.fixedClass?.curriculumVersionId)
        .filter((id): id is string => Boolean(id))
    ),
  ]

  const [trainingBlockSubjects, semesterResults] = await Promise.all([
    curriculumVersionIds.length
      ? prisma.trainingBlockSubject.findMany({
        where: {
          trainingBlockOnCurriculumVersion: {
            curriculumVersionId: { in: curriculumVersionIds },
          },
          deletedAt: null,
        },
        select: {
          subjectId: true,
          semester: true,
          graduation: true,
          useForFinalScore: true,
          trainingBlockOnCurriculumVersion: { select: { curriculumVersionId: true } },
        },
      })
      : Promise.resolve([]),
    prisma.studentSemesterResult.findMany({
      where: { studentId: { in: orderedStudents.map((s) => s.id) } },
      select: {
        studentId: true,
        semesterIndexInCourse: true,
        registeredCredits: true,
        gpaBase10: true,
        gpaBase4: true,
        accumulatedCredits: true,
        cumulativeGpaBase10: true,
        cumulativeGpaBase4: true,
        rank: { select: { classification: true } },
        semester: {
          select: {
            id: true,
            code: true,
            name: true,
            startDate: true,
            createdAt: true,
            schoolYear: { select: { name: true } },
          },
        },
      },
    }),
  ])

  const ctdtByKey = new Map<string, CtdtSubjectInfo>()
  for (const tbs of trainingBlockSubjects) {
    const key = `${tbs.trainingBlockOnCurriculumVersion.curriculumVersionId}:${tbs.subjectId}`
    const existing = ctdtByKey.get(key)
    if (!existing || (existing.semester == null && tbs.semester != null)) {
      ctdtByKey.set(key, {
        semester: tbs.semester,
        graduation: tbs.graduation,
        isConditional: tbs.useForFinalScore === false,
      })
    }
  }

  const ssrByStudentIndex = new Map<string, SemesterMeta>()
  const ssrIndexByStudentSemester = new Map<string, number>()
  const ssrStatsByStudentSemester = new Map<string, SemesterResultStats>()
  const latestSsrByStudent = new Map<string, SemesterResultStats>()
  for (const ssr of semesterResults) {
    const meta = toSemesterMeta(ssr.semester, ssr.semesterIndexInCourse)
    ssrByStudentIndex.set(`${ssr.studentId}:${ssr.semesterIndexInCourse}`, meta)
    ssrIndexByStudentSemester.set(`${ssr.studentId}:${ssr.semester.id}`, ssr.semesterIndexInCourse)
    const stats: SemesterResultStats = {
      registeredCredits: toNullableNumber(ssr.registeredCredits),
      gpaBase10: toNullableNumber(ssr.gpaBase10),
      gpaBase4: toNullableNumber(ssr.gpaBase4),
      accumulatedCredits: toNullableNumber(ssr.accumulatedCredits),
      cumulativeGpaBase10: toNullableNumber(ssr.cumulativeGpaBase10),
      cumulativeGpaBase4: toNullableNumber(ssr.cumulativeGpaBase4),
      classification: ssr.rank?.classification ?? "",
      semesterIndexInCourse: ssr.semesterIndexInCourse,
    }
    ssrStatsByStudentSemester.set(`${ssr.studentId}:${ssr.semester.id}`, stats)
    const existingLatest = latestSsrByStudent.get(ssr.studentId)
    if (!existingLatest || ssr.semesterIndexInCourse > existingLatest.semesterIndexInCourse) {
      latestSsrByStudent.set(ssr.studentId, stats)
    }
  }

  return {
    orderedStudents,
    scoresByStudent,
    ctdtByKey,
    ssrByStudentIndex,
    ssrIndexByStudentSemester,
    ssrStatsByStudentSemester,
    latestSsrByStudent,
  }
}

type ExportStudent = Awaited<ReturnType<typeof loadBangDiemExportData>>["orderedStudents"][number]
type BangDiemExportData = Awaited<ReturnType<typeof loadBangDiemExportData>>
type ScoreRow = BangDiemExportData["scoresByStudent"] extends Map<string, (infer E)[]> ? E : never

function resolveScoreSemester(
  row: ScoreRow,
  student: ExportStudent,
  data: Pick<
    BangDiemExportData,
    "ctdtByKey" | "ssrByStudentIndex" | "ssrIndexByStudentSemester"
  >
): SemesterMeta | null {
  const classSemester = row.subjectClass?.semester
  if (classSemester?.id) {
    const index =
      data.ssrIndexByStudentSemester.get(`${row.studentId}:${classSemester.id}`) ?? null
    return toSemesterMeta(classSemester, index)
  }

  const curriculumVersionId =
    student.curriculumVersionId || student.fixedClass?.curriculumVersionId || null
  const subjectId = row.subjectVersion?.id
  if (curriculumVersionId && subjectId) {
    const ctdtKy = data.ctdtByKey.get(`${curriculumVersionId}:${subjectId}`)?.semester
    if (ctdtKy != null) {
      const mapped = data.ssrByStudentIndex.get(`${row.studentId}:${ctdtKy}`)
      if (mapped) return mapped
      return {
        id: `ctdt-${row.studentId}-${ctdtKy}`,
        code: null,
        name: `Học kỳ ${ctdtKy}`,
        startDate: null,
        createdAt: null,
        schoolYearName: null,
        semesterIndex: ctdtKy,
      }
    }
  }

  if (row.semester?.id) {
    const index = data.ssrIndexByStudentSemester.get(`${row.studentId}:${row.semester.id}`) ?? null
    return toSemesterMeta(row.semester, index)
  }

  return {
    id: `phien-diem-${row.studentId}`,
    code: null,
    name: "Phiên điểm",
    startDate: null,
    createdAt: null,
    schoolYearName: null,
    semesterIndex: null,
  }
}

function isPhienDiem(row: ScoreRow): boolean {
  return !row.subjectClassId && !row.subjectClass?.id
}

function scoresForExport(studentScores: ScoreRow[]): ScoreRow[] {
  const classSubjectIds = new Set(
    studentScores
      .filter((row) => !isPhienDiem(row))
      .map((row) => row.subjectVersion?.id)
      .filter((id): id is string => Boolean(id))
  )
  return studentScores.filter((row) => {
    const subjectId = row.subjectVersion?.id
    if (!subjectId) return false
    if (isPhienDiem(row) && classSubjectIds.has(subjectId)) return false
    return true
  })
}

function groupScoresBySemester(
  student: ExportStudent,
  studentScores: ScoreRow[],
  data: Pick<
    BangDiemExportData,
    "ctdtByKey" | "ssrByStudentIndex" | "ssrIndexByStudentSemester"
  >
) {
  const semesterMap = new Map<string, { meta: SemesterMeta; rows: ScoreRow[] }>()

  for (const row of scoresForExport(studentScores)) {
    const semester = resolveScoreSemester(row, student, data)
    if (!semester?.id) continue

    const existingSemester = semesterMap.get(semester.id)
    if (existingSemester) {
      existingSemester.rows.push(row)
    } else {
      semesterMap.set(semester.id, {
        meta: semester,
        rows: [row],
      })
    }
  }

  return semesterMap
}

function sortSemesters(
  semesterMap: Map<string, { meta: SemesterMeta; rows: ScoreRow[] }>,
  field: "startDate" | "createdAt"
) {
  return [...semesterMap.values()].sort((a, b) => {
    const ai = a.meta.semesterIndex
    const bi = b.meta.semesterIndex
    if (ai != null && bi != null && ai !== bi) return ai - bi
    const aTime = a.meta[field] ? new Date(a.meta[field] as Date).getTime() : Number.MAX_SAFE_INTEGER
    const bTime = b.meta[field] ? new Date(b.meta[field] as Date).getTime() : Number.MAX_SAFE_INTEGER
    return aTime - bTime
  })
}

function semesterTitle(meta: SemesterMeta): string {
  return meta.name ?? ""
}

function courseThresholds(student: ExportStudent) {
  const course = student.fixedClass?.trainingCourse
  return {
    scoreRanges: (course?.scoreConverts ?? []) as ScoreRange[],
    scoreToPassGraduation: course?.scoreToPassGraduation ?? 5.5,
    scoreToPassConditional: course?.scoreToPassConditional ?? 5,
    scoreToPass: course?.scoreToPass ?? 4,
    scoreToTakeExam: course?.scoreToTakeExam ?? null,
    examScoreToPass: course?.examScoreToPass ?? null,
  }
}

function toMonHocRow(row: ScoreRow, student: ExportStudent, data: BangDiemExportData): MonHoc | null {
  const subject = row.subjectVersion
  if (!subject?.id) return null

  const cvId = student.curriculumVersionId || student.fixedClass?.curriculumVersionId
  const ctdt = cvId ? data.ctdtByKey.get(`${cvId}:${subject.id}`) : undefined
  const block = subject.trainingBlocks?.[0]
  const isGraduation = ctdt?.graduation ?? block?.graduation === true
  const isConditional = ctdt?.isConditional ?? block?.useForFinalScore === false
  const rawScore = getFinalScore(row.manualFinalScore, row.finalScore)
  const phienDiem = isPhienDiem(row)
  const attendanceScore = phienDiem ? null : toNullableNumber(row.attendanceScore)
  const midtermScore = phienDiem ? null : toNullableNumber(row.midtermScore)
  const examScore = phienDiem ? null : toNullableNumber(row.examScore)
  const converted = convertScoreWithGraduation({
    score: rawScore,
    isGraduation,
    isConditional,
    attendanceScore,
    midtermScore,
    examScore,
    ...courseThresholds(student),
  })

  return {
    TenMonhoc: subject.name,
    MaMH: subject.code ?? "",
    soTC: subject.credit,
    diem01: attendanceScore,
    diem02: midtermScore,
    diem07: examScore,
    diemhe10: rawScore,
    diemhe4: converted.base4 ?? 0,
    diemchu: converted.letter ?? "",
    ghichu: row.description ?? "",
  }
}

function studentSheetData(student: ExportStudent) {
  const fullname = student.userProfile?.fullname ?? ""
  const maSV = student.userProfile?.code ?? ""
  const curriculum = student.fixedClass?.curriculumVersion?.curriculum
  const nganh =
    curriculum?.trainingMajor?.trainingField?.name || curriculum?.trainingField?.name || ""
  return {
    sheet: sanitizeSheetName(`${maSV} - ${fullname}`),
    data: {
      fullname,
      dateOfBirth: formatDateOfBirth(student.userProfile?.dateOfBirth),
      htdt: student.fixedClass?.trainingCourse?.trainingObjectType?.name ?? "",
      maSV,
      nganh,
      lop: student.fixedClass?.name ?? "",
    },
  }
}

export async function exportBangDiemCaNhan({ studentIds }: { studentIds: string[] }) {
  const exportData = await loadBangDiemExportData(studentIds)
  const { orderedStudents, scoresByStudent } = exportData
  const signatureDate = signatureDateLabel()
  const gapRow: TableRow = {
    cells: [{ value: null, colSpan: 18, border: false }],
  }

  const sheets: SheetExportOptions[] = orderedStudents.map((student) => {
    const studentScores = scoresByStudent.get(student.id) ?? []

    // Cá nhân: lấy điểm tốt nhất mỗi môn, KHÔNG chia theo kỳ
    const bestRowBySubject = new Map<string, ScoreRow>()
    for (const row of scoresForExport(studentScores)) {
      const subjectId = row.subjectVersion?.id
      if (!subjectId) continue
      const currentScore = getFinalScore(row.manualFinalScore, row.finalScore)
      const existing = bestRowBySubject.get(subjectId)
      if (!existing) {
        bestRowBySubject.set(subjectId, row)
        continue
      }
      const existingScore = getFinalScore(existing.manualFinalScore, existing.finalScore)
      if (currentScore >= existingScore) bestRowBySubject.set(subjectId, row)
    }

    const monHocs = [...bestRowBySubject.values()]
      .map((row) => toMonHocRow(row, student, exportData))
      .filter((monHoc): monHoc is MonHoc => Boolean(monHoc))

    const monHocRows: TableRow[] = monHocs.map((monHoc, index) => ({
      cells: [
        { value: index + 1 },
        { value: monHoc.TenMonhoc ?? "", colSpan: 6, border: true },
        { value: monHoc.MaMH ?? "" },
        { value: monHoc.soTC, align: "center" },
        { value: monHoc.diem01, align: "right", numFmt: "0.00" },
        { value: monHoc.diem02, align: "right", numFmt: "0.00" },
        { value: monHoc.diem07, align: "right", numFmt: "0.00" },
        { value: null },
        { value: null },
        { value: monHoc.diemhe10, align: "right", numFmt: "0.00" },
        { value: monHoc.diemhe4, align: "right", numFmt: "0.00" },
        { value: monHoc.diemchu ?? "", align: "center" },
        { value: null },
        { value: monHoc.ghichu ?? "" },
      ],
    }))

    const yearResult = pickLatestYearResult(student.studentYearResult)
    const lastSemester = exportData.latestSsrByStudent.get(student.id)
    const tongtinchi = yearResult?.accumulatedCredits ?? lastSemester?.accumulatedCredits ?? ""
    const tongdiemhe10 =
      toNullableNumber(yearResult?.cumulativeGpaBase10) ?? lastSemester?.cumulativeGpaBase10 ?? ""
    const tongdiemhe4 =
      toNullableNumber(yearResult?.cumulativeGpaBase4) ?? lastSemester?.cumulativeGpaBase4 ?? ""
    const course = student.fixedClass?.trainingCourse
    const xeploai =
      classificationFromCumulativeGpa({
        gpa10: typeof tongdiemhe10 === "number" ? tongdiemhe10 : null,
        gpa4: typeof tongdiemhe4 === "number" ? tongdiemhe4 : null,
        baseScore: course?.baseScore,
        ranks: course?.academicRankingConvert,
      }) ||
      yearResult?.rank?.classification ||
      lastSemester?.classification ||
      ""

    return {
      ...studentSheetData(student),
      tableStartCell: { row: 11, col: 1 },
      rows: [
        ...monHocRows,
        gapRow,
        gapRow,
        {
          cells: [
            {
              value: `Tổng tín chỉ tích luỹ: ${tongtinchi}`,
              colSpan: 18,
              border: false,
            },
          ],
        },
        {
          cells: [
            {
              value: `Điểm trung bình tích luỹ hệ 10 toàn khoá: ${tongdiemhe10}`,
              colSpan: 18,
              border: false,
            },
          ],
        },
        {
          cells: [
            {
              value: `Điểm trung bình tích luỹ hệ 4 toàn khoá: ${tongdiemhe4}`,
              colSpan: 18,
              border: false,
            },
          ],
        },
        {
          cells: [{ value: `Xếp loại: ${xeploai}`, colSpan: 18, border: false }],
        },
        ...signatureRows(signatureDate),
      ],
      // Cá nhân: ẩn cột điểm thành phần (J,K,L) và điểm × TC (M,N)
      hiddenColumns: ["H", "M", "N", "R", "J", "K", "L"],
    }
  })

  return retitleBangDiemCaNhan(
    await buildFromTemplate(prisma, {
      templatePath: "/mta/template/quatrinh.xlsx",
      fileName: "BDCN",
      mergeSheetsToOne: true,
      sheetName: "BDCN",
      sheets,
    })
  )
}

export async function exportBangDiemQuaTrinh({ studentIds }: { studentIds: string[] }) {
  const exportData = await loadBangDiemExportData(studentIds)
  const { orderedStudents, scoresByStudent } = exportData
  const signatureDate = signatureDateLabel()
  const gapRow: TableRow = {
    cells: [{ value: null, colSpan: 18, border: false }],
  }

  const sheets: SheetExportOptions[] = orderedStudents.map((student) => {
    const studentScores = scoresByStudent.get(student.id) ?? []

    const hocKis: HocKi[] = sortSemesters(
      groupScoresBySemester(student, studentScores, exportData),
      "createdAt"
    ).map(({ meta, rows }) => {
      const monHocs: MonHoc[] = []
      for (const row of rows) {
        const monHoc = toMonHocRow(row, student, exportData)
        if (monHoc) monHocs.push(monHoc)
      }

      const stats = exportData.ssrStatsByStudentSemester.get(`${student.id}:${meta.id}`)
      return {
        TenHocKi: semesterTitle(meta),
        SoTinChiKy: stats?.registeredCredits ?? null,
        DiemTBKyHe10: stats?.gpaBase10 ?? null,
        DiemTBKyHe4: stats?.gpaBase4 ?? null,
        monHocs,
      }
    })

    const tableRows = hocKis.flatMap((hocKi) => {
      const hocKiRow: TableRow = {
        cells: [
          {
            value: hocKi.TenHocKi ?? "",
            colSpan: 19,
            bold: true,
            align: "left",
            border: true,
          },
        ],
      }
      const monHocRows: TableRow[] = hocKi.monHocs.map((monHoc, index) => ({
        cells: [
          { value: index + 1 },
          { value: monHoc.TenMonhoc ?? "", colSpan: 6, border: true },
          { value: monHoc.MaMH ?? "" },
          { value: monHoc.soTC, align: "center" },
          { value: monHoc.diem01, align: "right", numFmt: "0.0" },
          { value: monHoc.diem02, align: "right", numFmt: "0.0" },
          { value: monHoc.diem07, align: "right", numFmt: "0.0" },
          {
            value: (monHoc.diemhe10 || 0) * (monHoc.soTC || 0),
            align: "right",
            numFmt: "0.0",
          },
          {
            value: (monHoc.diemhe4 || 0) * (monHoc.soTC || 0),
            align: "right",
            numFmt: "0.0",
          },
          { value: monHoc.diemhe10, align: "right", numFmt: "0.0" },
          { value: monHoc.diemhe4, align: "right", numFmt: "0.0" },
          { value: monHoc.diemchu ?? "", align: "center" },
          { value: null },
          { value: monHoc.ghichu ?? "" },
        ],
      }))

      const trungBinhRow: TableRow = {
        cells: [
          { value: null },
          {
            value: "Điểm trung bình học kỳ:",
            colSpan: 6,
            bold: true,
            align: "center",
          },
          { value: null },
          { value: hocKi.SoTinChiKy, bold: true, align: "center" },
          { value: null },
          { value: null },
          { value: null },
          { value: null },
          { value: null },
          {
            value: hocKi.DiemTBKyHe10,
            bold: true,
            align: "right",
            numFmt: "0.0",
          },
          {
            value: hocKi.DiemTBKyHe4,
            bold: true,
            align: "right",
            numFmt: "0.0",
          },
          { value: null },
          { value: null },
          { value: null },
        ],
      }

      return [hocKiRow, ...monHocRows, trungBinhRow]
    })

    return {
      ...studentSheetData(student),
      tableStartCell: { row: 11, col: 1 },
      rows: [...tableRows, gapRow, gapRow, ...signatureRows(signatureDate)],
      // Quá trình: hiện cột điểm CC/GK/thi (J,K,L) và điểm × TC (M,N)
      hiddenColumns: ["H", "R"],
    }
  })

  return buildFromTemplate(prisma, {
    templatePath: "/mta/template/quatrinh.xlsx",
    fileName: "BDQT.xlsx",
    mergeSheetsToOne: true,
    sheetName: "BDQT",
    sheets,
  })
}
