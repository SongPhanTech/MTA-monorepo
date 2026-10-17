import {
  BAO_LUU_EXCEL_COLOR,
  isBaoLuuScoreDescription,
  visibleScoreNote,
} from "@workspace/libs/bao-luu-diem"
import { HTTPException } from "hono/http-exception"
import { formatDateVn, formatNgayIn, formatThangIn, nowVn } from "@workspace/libs/timezone"
import type { TableRow } from "@workspace/libs/template-excel-core"
import { prisma } from ".."
import { buildFromTemplate } from "./build-from-template"
import { pickLatestYearResult, classificationFromCumulativeGpa } from "./export-bang-diem-ca-nhan"

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

function toNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "object" && "toNumber" in value) {
    const n = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(n) ? n : null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function roundTo(value: number | null | undefined, decimals: number): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return Number.parseFloat(value.toFixed(decimals))
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

type BangDiemCaNhanMau = "p2" | "p7"

export async function exportBangDiemCaNhanP2({ studentId }: { studentId: string }) {
  return exportBangDiemCaNhanMau({ studentId, mau: "p2" })
}

export async function exportBangDiemCaNhanP7({ studentId }: { studentId: string }) {
  return exportBangDiemCaNhanMau({ studentId, mau: "p7" })
}

async function exportBangDiemCaNhanMau({
  studentId,
  mau,
}: {
  studentId: string
  mau: BangDiemCaNhanMau
}) {
  if (!studentId) {
    throw new HTTPException(400, { message: "Thiếu ID học viên" })
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      curriculumVersionId: true,
      userProfile: {
        select: { code: true, fullname: true, dateOfBirth: true },
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

  if (!student) {
    throw new HTTPException(404, { message: "Không tìm thấy học viên" })
  }

  const course = student.fixedClass?.trainingCourse
  const scoreRanges = (course?.scoreConverts ?? []) as ScoreRange[]
  const scoreToPassGraduation = course?.scoreToPassGraduation ?? 5.5
  const scoreToPassConditional = course?.scoreToPassConditional ?? 5
  const scoreToPass = course?.scoreToPass ?? 4
  const scoreToTakeExam = course?.scoreToTakeExam ?? null
  const examScoreToPass = course?.examScoreToPass ?? null

  const curriculumVersionId =
    student.curriculumVersionId || student.fixedClass?.curriculumVersionId || null

  const [semesters, phienDiemScores, semesterResults, trainingBlockSubjects] = await Promise.all([
    prisma.semester.findMany({
      where: {
        subjectClasses: {
          some: {
            subjectClassStudent: { some: { studentId } },
          },
        },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        studentSemesterResult: {
          where: { studentId },
          select: {
            semesterIndexInCourse: true,
            registeredCredits: true,
            gpaBase10: true,
            gpaBase4: true,
            accumulatedCredits: true,
            cumulativeGpaBase10: true,
            cumulativeGpaBase4: true,
            rank: { select: { classification: true } },
          },
        },
        subjectClasses: {
          where: {
            subjectClassStudent: { some: { studentId } },
          },
          orderBy: [{ subject: { name: "asc" } }, { createdAt: "asc" }],
          select: {
            subject: {
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
            subjectClassStudent: {
              where: { studentId, deletedAt: null },
              select: {
                subjectVersionId: true,
                manualFinalScore: true,
                finalScore: true,
                attendanceScore: true,
                midtermScore: true,
                examScore: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.studentSubjectScore.findMany({
      where: {
        studentId,
        subjectClassId: null,
        deletedAt: null,
        OR: [{ manualFinalScore: { not: null } }, { finalScore: { not: null } }],
      },
      select: {
        semesterId: true,
        subjectVersionId: true,
        manualFinalScore: true,
        finalScore: true,
        description: true,
        subjectVersion: {
          select: { id: true, name: true, code: true, credit: true },
        },
      },
    }),
    prisma.studentSemesterResult.findMany({
      where: { studentId },
      select: {
        semesterIndexInCourse: true,
        registeredCredits: true,
        gpaBase10: true,
        gpaBase4: true,
        accumulatedCredits: true,
        cumulativeGpaBase10: true,
        cumulativeGpaBase4: true,
        rank: { select: { classification: true } },
        semester: { select: { id: true, name: true, startDate: true } },
      },
    }),
    curriculumVersionId
      ? prisma.trainingBlockSubject.findMany({
          where: {
            trainingBlockOnCurriculumVersion: { curriculumVersionId },
            deletedAt: null,
          },
          select: {
            subjectId: true,
            semester: true,
            graduation: true,
            useForFinalScore: true,
          },
        })
      : Promise.resolve([]),
  ])

  type CtdtSubject = {
    semester: number | null
    graduation: boolean
    isConditional: boolean
  }
  const ctdtBySubject = new Map<string, CtdtSubject>()
  for (const tbs of trainingBlockSubjects) {
    const existing = ctdtBySubject.get(tbs.subjectId)
    if (!existing || (existing.semester == null && tbs.semester != null)) {
      ctdtBySubject.set(tbs.subjectId, {
        semester: tbs.semester,
        graduation: tbs.graduation,
        isConditional: tbs.useForFinalScore === false,
      })
    }
  }

  const ssrByIndex = new Map<number, (typeof semesterResults)[number]>()
  const ssrBySemesterId = new Map<string, (typeof semesterResults)[number]>()
  for (const ssr of semesterResults) {
    ssrByIndex.set(ssr.semesterIndexInCourse, ssr)
    ssrBySemesterId.set(ssr.semester.id, ssr)
  }

  type MonHoc = {
    subjectVersionId: string
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
  }

  type HocKiBuilder = {
    key: string
    name: string
    startDate: Date | null
    ctdtIndex: number | null
    registeredCredits: number | null
    gpaBase10: number | null
    gpaBase4: number | null
    monHocs: MonHoc[]
  }

  const builders = new Map<string, HocKiBuilder>()

  const getOrCreateBuilder = (key: string, init: Omit<HocKiBuilder, "monHocs">) => {
    const existing = builders.get(key)
    if (existing) return existing
    const created: HocKiBuilder = { ...init, monHocs: [] }
    builders.set(key, created)
    return created
  }

  const toMonHoc = ({
    subjectVersionId,
    name,
    code,
    credit,
    rawScore,
    attendanceScore,
    midtermScore,
    examScore,
    description,
    isGraduation,
    isConditional,
  }: {
    subjectVersionId: string
    name: string
    code: string | null
    credit: number
    rawScore: number
    attendanceScore?: number | null
    midtermScore?: number | null
    examScore?: number | null
    description?: string | null
    isGraduation: boolean
    isConditional: boolean
  }): MonHoc => {
    const converted = convertScoreWithGraduation({
      score: rawScore,
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
    })
    return {
      subjectVersionId,
      TenMonhoc: name,
      MaMH: code ?? "",
      soTC: credit,
      diem01: attendanceScore ?? null,
      diem02: midtermScore ?? null,
      diem07: examScore ?? null,
      diemhe10: rawScore,
      diemhe4: converted.base4 ?? 0,
      diemchu: converted.letter ?? "",
      ghichu: visibleScoreNote(description),
      baoLuu: isBaoLuuScoreDescription(description),
    }
  }

  for (const semester of semesters) {
    const ssr = semester.studentSemesterResult[0] ?? ssrBySemesterId.get(semester.id)
    const builder = getOrCreateBuilder(semester.id, {
      key: semester.id,
      name: semester.name,
      startDate: semester.startDate,
      ctdtIndex: ssr?.semesterIndexInCourse ?? null,
      registeredCredits: toNumber(ssr?.registeredCredits),
      gpaBase10: toNumber(ssr?.gpaBase10),
      gpaBase4: toNumber(ssr?.gpaBase4),
    })

    for (const subjectClass of semester.subjectClasses) {
      const subject = subjectClass.subject
      const ctdt = ctdtBySubject.get(subject.id)
      const trainingBlock = subject.trainingBlocks[0]
      const isGraduation = ctdt?.graduation ?? trainingBlock?.graduation === true
      const isConditional = ctdt?.isConditional ?? trainingBlock?.useForFinalScore === false

      for (const scs of subjectClass.subjectClassStudent) {
        const rawScore =
          scs.manualFinalScore != null
            ? (toNumber(scs.manualFinalScore) ?? 0)
            : scs.finalScore != null
              ? (toNumber(scs.finalScore) ?? 0)
              : 0

        builder.monHocs.push(
          toMonHoc({
            subjectVersionId: scs.subjectVersionId || subject.id,
            name: subject.name,
            code: subject.code,
            credit: subject.credit,
            rawScore,
            attendanceScore: toNumber(scs.attendanceScore),
            midtermScore: toNumber(scs.midtermScore),
            examScore: toNumber(scs.examScore),
            description: scs.description,
            isGraduation,
            isConditional,
          })
        )
      }
    }
  }

  const classSubjectIds = new Set(
    [...builders.values()].flatMap((b) => b.monHocs.map((m) => m.subjectVersionId))
  )

  const resolvePhienDiemBuilder = (score: (typeof phienDiemScores)[number]): HocKiBuilder => {
    const ctdtKy = ctdtBySubject.get(score.subjectVersionId)?.semester ?? null

    if (ctdtKy != null) {
      const ssr = ssrByIndex.get(ctdtKy)
      if (ssr) {
        return getOrCreateBuilder(ssr.semester.id, {
          key: ssr.semester.id,
          name: ssr.semester.name,
          startDate: ssr.semester.startDate,
          ctdtIndex: ssr.semesterIndexInCourse,
          registeredCredits: toNumber(ssr.registeredCredits),
          gpaBase10: toNumber(ssr.gpaBase10),
          gpaBase4: toNumber(ssr.gpaBase4),
        })
      }
      const virtualKey = `ctdt-${ctdtKy}`
      return getOrCreateBuilder(virtualKey, {
        key: virtualKey,
        name: `Học kỳ ${ctdtKy}`,
        startDate: null,
        ctdtIndex: ctdtKy,
        registeredCredits: null,
        gpaBase10: null,
        gpaBase4: null,
      })
    }

    if (score.semesterId) {
      const existing = builders.get(score.semesterId)
      if (existing) return existing
      const ssr = ssrBySemesterId.get(score.semesterId)
      if (ssr) {
        return getOrCreateBuilder(ssr.semester.id, {
          key: ssr.semester.id,
          name: ssr.semester.name,
          startDate: ssr.semester.startDate,
          ctdtIndex: ssr.semesterIndexInCourse,
          registeredCredits: toNumber(ssr.registeredCredits),
          gpaBase10: toNumber(ssr.gpaBase10),
          gpaBase4: toNumber(ssr.gpaBase4),
        })
      }
    }

    return getOrCreateBuilder("phien-diem", {
      key: "phien-diem",
      name: "Phiên điểm",
      startDate: null,
      ctdtIndex: null,
      registeredCredits: null,
      gpaBase10: null,
      gpaBase4: null,
    })
  }

  for (const score of phienDiemScores) {
    const subject = score.subjectVersion
    if (!subject?.id) continue
    if (classSubjectIds.has(subject.id)) continue

    const ctdt = ctdtBySubject.get(subject.id)
    const rawScore =
      score.manualFinalScore != null
        ? (toNumber(score.manualFinalScore) ?? 0)
        : score.finalScore != null
          ? (toNumber(score.finalScore) ?? 0)
          : 0

    const builder = resolvePhienDiemBuilder(score)
    builder.monHocs.push(
      toMonHoc({
        subjectVersionId: subject.id,
        name: subject.name,
        code: subject.code,
        credit: subject.credit,
        rawScore,
        attendanceScore: null,
        midtermScore: null,
        examScore: null,
        description: score.description,
        isGraduation: ctdt?.graduation === true,
        isConditional: ctdt?.isConditional === true,
      })
    )
    classSubjectIds.add(subject.id)
  }

  const hocKis = [...builders.values()]
    .sort((a, b) => {
      if (a.ctdtIndex != null && b.ctdtIndex != null && a.ctdtIndex !== b.ctdtIndex) {
        return a.ctdtIndex - b.ctdtIndex
      }
      if (a.ctdtIndex != null && b.ctdtIndex == null) return -1
      if (a.ctdtIndex == null && b.ctdtIndex != null) return 1
      const aTime = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })
    .map((builder) => ({
      TenHocKi: builder.name,
      SoTinChiKy: builder.registeredCredits,
      DiemTBKyHe10: builder.gpaBase10,
      DiemTBKyHe4: builder.gpaBase4,
      monHocs: builder.monHocs,
    }))

  // Cá nhân: danh sách phẳng toàn khóa, không chia header theo kỳ
  const bestBySubject = new Map<string, (typeof hocKis)[number]["monHocs"][number]>()
  for (const hocKi of hocKis) {
    for (const monHoc of hocKi.monHocs) {
      const existing = bestBySubject.get(monHoc.subjectVersionId)
      if (!existing || (monHoc.diemhe10 ?? 0) >= (existing.diemhe10 ?? 0)) {
        bestBySubject.set(monHoc.subjectVersionId, monHoc)
      }
    }
  }
  const flatMonHocs = [...bestBySubject.values()]

  const tableRows: TableRow[] = flatMonHocs.map((monHoc, index) => ({
    cells: [
      {
        value: index + 1,
        align: "center",
        ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}),
      },
      {
        value: monHoc.TenMonhoc ?? "",
        colSpan: 6,
        border: true,
        ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}),
      },
      { value: monHoc.MaMH ?? "", ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}) },
      {
        value: monHoc.soTC,
        align: "center",
        ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}),
      },
      {
        value: roundTo(monHoc.diem01, 1),
        align: "right",
        numFmt: "0.0",
        ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}),
      },
      {
        value: roundTo(monHoc.diem02, 1),
        align: "right",
        numFmt: "0.0",
        ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}),
      },
      {
        value: roundTo(monHoc.diem07, 1),
        align: "right",
        numFmt: "0.0",
        ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}),
      },
      { value: null },
      { value: null },
      {
        value: roundTo(monHoc.diemhe10, 1),
        align: "right",
        numFmt: "0.0",
        ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}),
      },
      {
        value: roundTo(monHoc.diemhe4, 1),
        align: "right",
        numFmt: "0.0",
        ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}),
      },
      {
        value: monHoc.diemchu ?? "",
        align: "center",
        ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}),
      },
      { value: null },
      { value: monHoc.ghichu ?? "", ...(monHoc.baoLuu ? { color: BAO_LUU_EXCEL_COLOR } : {}) },
    ],
  }))

  const lastYearResult = pickLatestYearResult(student.studentYearResult)
  const lastSemesterResult =
    [...semesterResults].sort((a, b) => b.semesterIndexInCourse - a.semesterIndexInCourse)[0] ??
    null

  const tongtinchi =
    lastYearResult?.accumulatedCredits ?? lastSemesterResult?.accumulatedCredits ?? ""
  const tongdiemhe10 =
    toNumber(lastYearResult?.cumulativeGpaBase10) ??
    toNumber(lastSemesterResult?.cumulativeGpaBase10) ??
    ""
  const tongdiemhe4 =
    toNumber(lastYearResult?.cumulativeGpaBase4) ??
    toNumber(lastSemesterResult?.cumulativeGpaBase4) ??
    ""
  const xeploai =
    classificationFromCumulativeGpa({
      gpa10: typeof tongdiemhe10 === "number" ? tongdiemhe10 : null,
      gpa4: typeof tongdiemhe4 === "number" ? tongdiemhe4 : null,
      baseScore: course?.baseScore,
      ranks: course?.academicRankingConvert,
    }) ||
    lastYearResult?.rank?.classification ||
    lastSemesterResult?.rank?.classification ||
    ""

  const today = nowVn()
  const fullname = student.userProfile?.fullname ?? ""
  const maSV = student.userProfile?.code ?? ""
  const curriculum = student.fixedClass?.curriculumVersion?.curriculum
  const nganh =
    curriculum?.trainingMajor?.trainingField?.name || curriculum?.trainingField?.name || ""
  const gapRow: TableRow = { cells: [{ value: null, colSpan: 19, border: false }] }

  const dateRow: TableRow = {
    cells: [
      { value: null, colSpan: 8, border: false },
      {
        value: `Hà Nội, ngày ${formatNgayIn(today.date())} tháng ${formatThangIn(today.month() + 1)} năm ${today.year()}`,
        colSpan: 11,
        border: false,
        align: "center",
      },
    ],
  }
  const signatureRows: TableRow[] =
    mau === "p2"
      ? [
          dateRow,
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
      : [dateRow]

  const buffer = await buildFromTemplate(prisma, {
    templatePath:
      mau === "p7"
        ? "/mta/luan-van/BangDiemCaNhan(P7).xlsx"
        : "/mta/template/BangDiemCaNhan(P2).xlsx",
    fileName: `BDCN-${maSV}-${fullname}.xlsx`,
    sheets: [
      {
        sheet: "BaoCaoDiem",
        data: {
          fullname,
          dateOfBirth: student.userProfile?.dateOfBirth
            ? formatDateVn(student.userProfile.dateOfBirth)
            : "",
          htdt: course?.trainingObjectType?.name ?? "",
          maSV,
          nganh,
          lop: student.fixedClass?.name ?? "",
        },
        tableStartCell: { row: 14, col: 1 },
        rows: [
          ...tableRows,
          gapRow,
          gapRow,
          {
            cells: [{ value: `Tổng tín chỉ tích luỹ: ${tongtinchi}`, colSpan: 19, border: false }],
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
          { cells: [{ value: `Xếp loại: ${xeploai}`, colSpan: 19, border: false }] },
          ...signatureRows,
        ],
        hiddenColumns: ["M", "N", "R", "J", "K", "L"],
      },
    ],
  })

  return { buffer, fileName: `BDCN-${maSV}-${fullname}.xlsx` }
}
