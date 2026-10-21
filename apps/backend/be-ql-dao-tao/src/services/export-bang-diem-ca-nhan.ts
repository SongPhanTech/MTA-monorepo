import {
  BAO_LUU_EXCEL_COLOR,
  isBaoLuuScoreDescription,
  visibleScoreNote,
} from "@workspace/libs/bao-luu-diem"
import { HTTPException } from "hono/http-exception"
import { formatDateVn, formatNgayIn, formatThangIn, nowVn } from "@workspace/libs/timezone"
import type { SheetExportOptions, TableCell, TableRow } from "@workspace/libs/template-excel-core"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { prisma } from ".."
import { buildFromTemplate } from "./build-from-template"

/** Cùng mẫu P2 với xuất bảng điểm cá nhân ở màn kết quả học tập. */
const BANG_DIEM_CA_NHAN_TEMPLATE = "/mta/template/BangDiemCaNhan(P2).xlsx"

/** Mẫu kết quả học tập dự khoá tiếng Việt. */
const BANG_DIEM_DU_KHOA_TEMPLATE = "/mta/template/KetQuaHocTapDuKhoa.xlsx"

function resolveDuKhoaLocalTemplate() {
  const candidates = [
    join(process.cwd(), "templates/KetQuaHocTapDuKhoa.xlsx"),
    join(dirname(fileURLToPath(import.meta.url)), "../../templates/KetQuaHocTapDuKhoa.xlsx"),
  ]
  return candidates.find((path) => existsSync(path)) ?? candidates[0]!
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
  baoLuu: boolean
  pass: boolean
  countsForGpa: boolean
  plannedSemester: number | null
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
      const aTime = a.schoolYear?.endDate?.getTime() ?? a.schoolYear?.startDate?.getTime() ?? 0
      const bTime = b.schoolYear?.endDate?.getTime() ?? b.schoolYear?.startDate?.getTime() ?? 0
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
  return `Hà Nội, ngày ${formatNgayIn(today.date())} tháng ${formatThangIn(today.month() + 1)} năm ${today.year()}`
}

function roundScore(value: number | null | undefined, decimals: number): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return Number.parseFloat(value.toFixed(decimals))
}

function withBaoLuuColor(cell: TableCell, baoLuu: boolean): TableCell {
  return baoLuu ? { ...cell, color: BAO_LUU_EXCEL_COLOR } : cell
}

/** Chữ ký đúng khung 19 cột của mẫu BangDiemCaNhan(P2). */
function caNhanSignatureRows(signatureDate: string): TableRow[] {
  return [
    {
      cells: [
        { value: null, colSpan: 8, border: false },
        { value: signatureDate, colSpan: 11, border: false, align: "center" },
      ],
    },
    {
      cells: [
        { value: null, colSpan: 8, border: false },
        {
          value: "  KT. TRƯỞNG PHÒNG",
          colSpan: 11,
          border: false,
          align: "center",
          bold: true,
        },
      ],
    },
    {
      cells: [
        { value: null, colSpan: 8, border: false },
        {
          value: "  PHÓ TRƯỞNG PHÒNG",
          colSpan: 11,
          border: false,
          align: "center",
          bold: true,
        },
      ],
    },
    {
      cells: [
        { value: null, colSpan: 8, border: false },
        {
          value: "Đại tá, TS Nguyễn Văn Bình",
          colSpan: 11,
          border: false,
          align: "center",
          bold: true,
        },
      ],
    },
  ]
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
          nationality: { select: { sTen: true } },
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
              code: true,
              startYear: true,
              endYear: true,
              academicYear: true,
              admissionStartDate: true,
              admissionEndDate: true,
              baseScore: true,
              scoreToPassGraduation: true,
              scoreToPassConditional: true,
              scoreToPass: true,
              scoreToTakeExam: true,
              examScoreToPass: true,
              trainingObjectType: {
                select: {
                  name: true,
                  trainingForm: { select: { name: true } },
                },
              },
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
  data: Pick<BangDiemExportData, "ctdtByKey" | "ssrByStudentIndex" | "ssrIndexByStudentSemester">
): SemesterMeta | null {
  const classSemester = row.subjectClass?.semester
  if (classSemester?.id) {
    const index = data.ssrIndexByStudentSemester.get(`${row.studentId}:${classSemester.id}`) ?? null
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
  data: Pick<BangDiemExportData, "ctdtByKey" | "ssrByStudentIndex" | "ssrIndexByStudentSemester">
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
    const aTime = a.meta[field]
      ? new Date(a.meta[field] as Date).getTime()
      : Number.MAX_SAFE_INTEGER
    const bTime = b.meta[field]
      ? new Date(b.meta[field] as Date).getTime()
      : Number.MAX_SAFE_INTEGER
    return aTime - bTime
  })
}

function semesterTitle(meta: SemesterMeta): string {
  return meta.name ?? ""
}

/** GPA dự khoá: tổng (điểm × tín chỉ) / tổng tín chỉ trên các môn xuất. */
function summarizeWeightedGpa(monHocs: MonHoc[]) {
  let credits = 0
  let sum10 = 0
  let sum4 = 0
  for (const monHoc of monHocs) {
    const credit = monHoc.soTC || 0
    credits += credit
    sum10 += (monHoc.diemhe10 || 0) * credit
    sum4 += (monHoc.diemhe4 || 0) * credit
  }
  return {
    credits,
    gpa10: credits > 0 ? Number((sum10 / credits).toFixed(2)) : 0,
    gpa4: credits > 0 ? Number((sum4 / credits).toFixed(2)) : 0,
  }
}

function formatMonthYear(date: Date | null | undefined): string {
  if (!date) return ""
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return `${month}/${year}`
}

function formatTrainingPeriod(
  start: Date | null | undefined,
  end: Date | null | undefined
): string {
  const from = formatMonthYear(start)
  const to = formatMonthYear(end)
  if (from && to) return `${from} - ${to}`
  return from || to
}

function courseCohortLabel(course: {
  name?: string | null
  code?: string | null
  startYear?: number | null
} | null | undefined): string {
  const name = course?.name?.trim() ?? ""
  const trailingNumber = name.match(/(\d+)\s*$/)?.[1]
  if (trailingNumber) return trailingNumber
  if (course?.code?.trim()) return course.code.trim()
  if (course?.startYear != null) return String(course.startYear)
  return name
}

function courseAcademicYearLabel(course: {
  academicYear?: string | null
  startYear?: number | null
  endYear?: number | null
  admissionStartDate?: Date | null
  admissionEndDate?: Date | null
} | null | undefined): string {
  if (course?.academicYear?.trim()) return course.academicYear.trim()
  if (course?.startYear != null && course?.endYear != null) {
    return `${course.startYear}-${course.endYear}`
  }
  const start = course?.admissionStartDate?.getFullYear()
  const end = course?.admissionEndDate?.getFullYear()
  if (start && end) return `${start}-${end}`
  if (start) return String(start)
  return ""
}

function duKhoaSignatureRows(signatureDate: string): TableRow[] {
  const empty: TableRow = { cells: [{ value: null, colSpan: 7, border: false }] }
  return [
    {
      cells: [
        { value: null, colSpan: 3, border: false },
        { value: signatureDate, colSpan: 4, border: false, align: "center" },
      ],
    },
    {
      cells: [
        { value: null, colSpan: 3, border: false },
        {
          value: "TL. GIÁM ĐỐC",
          colSpan: 4,
          border: false,
          align: "center",
          bold: true,
        },
      ],
    },
    {
      cells: [
        { value: null, colSpan: 3, border: false },
        {
          value: "TRƯỞNG PHÒNG ĐÀO TẠO",
          colSpan: 4,
          border: false,
          align: "center",
          bold: true,
        },
      ],
    },
    // Chừa khoảng trống để ký trước khi in tên
    empty,
    empty,
    empty,
    empty,
    {
      cells: [
        { value: null, colSpan: 3, border: false },
        {
          value: "Đại tá, PGS. TS Ngô Thành Long",
          colSpan: 4,
          border: false,
          align: "center",
          bold: true,
        },
      ],
    },
  ]
}

/** Nhãn thường + giá trị in đậm trên cùng một ô (tổng kết dự khoá). */
function duKhoaSummaryRow(label: string, value: string | number): TableRow {
  const labelText = label.endsWith(" ") ? label : `${label} `
  return {
    cells: [
      {
        value: {
          richText: [
            {
              text: labelText,
              font: { name: "Times New Roman", size: 12, bold: false },
            },
            {
              text: String(value ?? ""),
              font: { name: "Times New Roman", size: 12, bold: true },
            },
          ],
        },
        colSpan: 7,
        border: false,
        bold: false,
      },
    ],
  }
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

function toMonHocRow(
  row: ScoreRow,
  student: ExportStudent,
  data: BangDiemExportData
): MonHoc | null {
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
    ghichu: visibleScoreNote(row.description),
    baoLuu: isBaoLuuScoreDescription(row.description),
    pass: converted.pass,
    countsForGpa: !isConditional,
    plannedSemester: ctdt?.semester ?? null,
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

function studentSheetDataDuKhoa(student: ExportStudent) {
  const fullname = student.userProfile?.fullname ?? ""
  const maSV = student.userProfile?.code ?? ""
  const course = student.fixedClass?.trainingCourse
  return {
    sheet: sanitizeSheetName(`${maSV} - ${fullname}`),
    data: {
      fullname,
      dateOfBirth: formatDateOfBirth(student.userProfile?.dateOfBirth),
      maSV,
      quocTich: student.userProfile?.nationality?.sTen ?? "",
      lop: student.fixedClass?.name ?? "",
      thoiGianDaoTao: formatTrainingPeriod(course?.admissionStartDate, course?.admissionEndDate),
      khoa: courseCohortLabel(course),
      loaiHinhDaoTao: course?.trainingObjectType?.trainingForm?.name ?? "",
      namHoc: courseAcademicYearLabel(course),
    },
  }
}

function collectBestMonHocs({
  student,
  studentScores,
  exportData,
  allowedSemesters,
}: {
  student: ExportStudent
  studentScores: ScoreRow[]
  exportData: BangDiemExportData
  allowedSemesters: Set<number> | null
}): MonHoc[] {
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

  const curriculumVersionId = student.curriculumVersionId || student.fixedClass?.curriculumVersionId
  return [...bestRowBySubject.values()]
    .filter((row) => {
      if (!allowedSemesters) return true
      const subjectId = row.subjectVersion?.id
      if (!subjectId || !curriculumVersionId) return false
      const planned = exportData.ctdtByKey.get(`${curriculumVersionId}:${subjectId}`)?.semester
      return planned != null && allowedSemesters.has(planned)
    })
    .map((row) => toMonHocRow(row, student, exportData))
    .filter((monHoc): monHoc is MonHoc => Boolean(monHoc))
    .sort((a, b) => {
      const semesterA = a.plannedSemester ?? Number.MAX_SAFE_INTEGER
      const semesterB = b.plannedSemester ?? Number.MAX_SAFE_INTEGER
      if (semesterA !== semesterB) return semesterA - semesterB
      return a.TenMonhoc.localeCompare(b.TenMonhoc, "vi")
    })
}

export async function exportBangDiemCaNhan({
  studentIds,
  plannedSemesters,
}: {
  studentIds: string[]
  /** Chỉ lấy môn có học kỳ dự kiến thuộc danh sách. Ví dụ [1, 2] cho đối tượng dự khoá. */
  plannedSemesters?: number[]
}) {
  const exportData = await loadBangDiemExportData(studentIds)
  const { orderedStudents, scoresByStudent } = exportData
  const allowedSemesters = plannedSemesters?.length
    ? new Set(plannedSemesters.filter((semester) => Number.isInteger(semester)))
    : null

  if (allowedSemesters) {
    return exportBangDiemDuKhoa({
      orderedStudents,
      scoresByStudent,
      exportData,
      allowedSemesters,
    })
  }

  const signatureDate = signatureDateLabel()
  const gapRow: TableRow = {
    cells: [{ value: null, colSpan: 19, border: false }],
  }

  const sheets: SheetExportOptions[] = orderedStudents.map((student) => {
    const monHocs = collectBestMonHocs({
      student,
      studentScores: scoresByStudent.get(student.id) ?? [],
      exportData,
      allowedSemesters: null,
    })

    const monHocRows: TableRow[] = monHocs.map((monHoc, index) => ({
      cells: (
        [
          { value: index + 1, align: "center" },
          { value: monHoc.TenMonhoc ?? "", colSpan: 6, border: true },
          { value: monHoc.MaMH ?? "" },
          { value: monHoc.soTC, align: "center" },
          { value: roundScore(monHoc.diem01, 1), align: "right", numFmt: "0.0" },
          { value: roundScore(monHoc.diem02, 1), align: "right", numFmt: "0.0" },
          { value: roundScore(monHoc.diem07, 1), align: "right", numFmt: "0.0" },
          { value: null },
          { value: null },
          { value: roundScore(monHoc.diemhe10, 1), align: "right", numFmt: "0.0" },
          { value: roundScore(monHoc.diemhe4, 1), align: "right", numFmt: "0.0" },
          { value: monHoc.diemchu ?? "", align: "center" },
          { value: null },
          { value: monHoc.ghichu ?? "" },
        ] satisfies TableCell[]
      ).map((cell) => withBaoLuuColor(cell, monHoc.baoLuu)),
    }))

    const yearResult = pickLatestYearResult(student.studentYearResult)
    const lastSemester = exportData.latestSsrByStudent.get(student.id)
    const course = student.fixedClass?.trainingCourse
    const tongtinchi =
      yearResult?.accumulatedCredits ?? lastSemester?.accumulatedCredits ?? ""
    const tongdiemhe10 =
      toNullableNumber(yearResult?.cumulativeGpaBase10) ?? lastSemester?.cumulativeGpaBase10 ?? ""
    const tongdiemhe4 =
      toNullableNumber(yearResult?.cumulativeGpaBase4) ?? lastSemester?.cumulativeGpaBase4 ?? ""
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
      tableStartCell: { row: 14, col: 1 },
      rows: [
        ...monHocRows,
        gapRow,
        gapRow,
        {
          cells: [
            {
              value: `Tổng tín chỉ tích luỹ: ${tongtinchi}`,
              colSpan: 19,
              border: false,
            },
          ],
        },
        {
          cells: [
            {
              value: `Điểm trung bình tích luỹ hệ 10 toàn khoá: ${tongdiemhe10}`,
              colSpan: 19,
              border: false,
            },
          ],
        },
        {
          cells: [
            {
              value: `Điểm trung bình tích luỹ hệ 4 toàn khoá: ${tongdiemhe4}`,
              colSpan: 19,
              border: false,
            },
          ],
        },
        {
          cells: [{ value: `Xếp loại: ${xeploai}`, colSpan: 19, border: false }],
        },
        ...caNhanSignatureRows(signatureDate),
      ],
      hiddenColumns: ["M", "N", "R", "J", "K", "L"],
    }
  })

  return buildFromTemplate(prisma, {
    templatePath: BANG_DIEM_CA_NHAN_TEMPLATE,
    fileName: "BDCN",
    mergeSheetsToOne: true,
    sheetName: "BDCN",
    sheets,
  })
}

async function exportBangDiemDuKhoa({
  orderedStudents,
  scoresByStudent,
  exportData,
  allowedSemesters,
}: {
  orderedStudents: ExportStudent[]
  scoresByStudent: BangDiemExportData["scoresByStudent"]
  exportData: BangDiemExportData
  allowedSemesters: Set<number>
}) {
  const signatureDate = signatureDateLabel()
  const gapRow: TableRow = {
    cells: [{ value: null, colSpan: 7, border: false }],
  }

  const sheets: SheetExportOptions[] = orderedStudents.map((student) => {
    const monHocs = collectBestMonHocs({
      student,
      studentScores: scoresByStudent.get(student.id) ?? [],
      exportData,
      allowedSemesters,
    })

    const monHocRows: TableRow[] = monHocs.map((monHoc, index) => ({
      cells: (
        [
          { value: index + 1, align: "center", border: true, bold: false },
          { value: monHoc.TenMonhoc ?? "", border: true, bold: false },
          { value: monHoc.soTC, align: "center", border: true, bold: false },
          {
            value: roundScore(monHoc.diemhe10, 1),
            align: "center",
            numFmt: "0.0",
            border: true,
            bold: false,
          },
          {
            value: roundScore(monHoc.diemhe4, 1),
            align: "center",
            numFmt: "0.0",
            border: true,
            bold: false,
          },
          { value: monHoc.diemchu ?? "", align: "center", border: true, bold: false },
          { value: monHoc.ghichu ?? "", border: true, bold: false },
        ] satisfies TableCell[]
      ).map((cell) => withBaoLuuColor(cell, monHoc.baoLuu)),
    }))

    const course = student.fixedClass?.trainingCourse
    const summary = summarizeWeightedGpa(monHocs)
    const xeploai = classificationFromCumulativeGpa({
      gpa10: summary.gpa10,
      gpa4: summary.gpa4,
      baseScore: course?.baseScore,
      ranks: course?.academicRankingConvert,
    })

    return {
      ...studentSheetDataDuKhoa(student),
      boldDataKeys: ["fullname", "maSV"],
      tableStartCell: { row: 14, col: 1 },
      columnWidths: [6, 36, 8, 12, 12, 12, 14],
      rows: [
        ...monHocRows,
        gapRow,
        duKhoaSummaryRow("Tổng tín chỉ:", summary.credits),
        duKhoaSummaryRow(
          "Điểm trung bình chung tích lũy toàn khóa (thang điểm 10):",
          summary.gpa10
        ),
        duKhoaSummaryRow(
          "Điểm trung bình chung tích lũy toàn khóa (thang điểm 4):",
          summary.gpa4
        ),
        duKhoaSummaryRow("Xếp hạng:", xeploai || ""),
        gapRow,
        gapRow,
        ...duKhoaSignatureRows(signatureDate),
      ],
    }
  })

  return buildFromTemplate(prisma, {
    templatePath: BANG_DIEM_DU_KHOA_TEMPLATE,
    localTemplatePath: resolveDuKhoaLocalTemplate(),
    fileName: "BDCN-DuKhoa",
    mergeSheetsToOne: true,
    pageBreakBetweenSheets: true,
    sheetName: "BDCN-DuKhoa",
    fontFamily: "Times New Roman",
    fontSize: 12,
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      // 0 = không ép cả file vào 1 trang; page break tách mỗi SV một trang in
      fitToHeight: 0,
      horizontalCentered: true,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.5,
        bottom: 0.6,
        header: 0.2,
        footer: 0.2,
      },
    },
    sheets,
  })
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
        cells: (
          [
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
          ] satisfies TableCell[]
        ).map((cell) => withBaoLuuColor(cell, monHoc.baoLuu)),
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
