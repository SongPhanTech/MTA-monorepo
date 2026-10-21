import { BAO_LUU_EXCEL_COLOR, isBaoLuuScoreDescription } from "@workspace/libs/bao-luu-diem"
import { HTTPException } from "hono/http-exception"
import { $Enums } from "@workspace/db"
import { formatDateVn, formatNgayIn, formatThangIn, nowVn } from "@workspace/libs/timezone"
import type { TableRow } from "@workspace/libs/template-excel-core"
import { prisma } from ".."
import { buildFromTemplate } from "./build-from-template"

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
    }
  }

  return {
    base4: matched.base4,
    letter: matched.letter,
    classification: matched.classification,
    pass: matched.pass,
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

export async function exportBangDiemQuaTrinhHocVien({ studentId }: { studentId: string }) {
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
      fixedClass: {
        select: {
          curriculumVersionId: true,
          trainingCourse: {
            select: {
              admissionStartDate: true,
              scoreToPassGraduation: true,
              scoreToPassConditional: true,
              scoreToPass: true,
              scoreToTakeExam: true,
              examScoreToPass: true,
              scoreConverts: true,
            },
          },
          curriculumVersion: {
            select: {
              trainingLevel: { select: { name: true } },
              trainingLanguage: { select: { name: true } },
              trainingTime: { select: { name: true } },
              trainingType: { select: { name: true } },
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

  if (!student) {
    throw new HTTPException(404, { message: "Không tìm thấy học viên" })
  }

  const course = student.fixedClass?.trainingCourse
  const curriculumVersion = student.fixedClass?.curriculumVersion
  const curriculum = curriculumVersion?.curriculum
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
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        schoolYear: { select: { name: true } },
        subjectClasses: {
          where: {
            subjectClassStudent: { some: { studentId } },
          },
          orderBy: [{ subject: { name: "asc" } }, { createdAt: "asc" }],
          select: {
            type: true,
            subject: {
              select: {
                id: true,
                name: true,
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
                manualFinalScore: true,
                finalScore: true,
                attendanceScore: true,
                midtermScore: true,
                examScore: true,
              },
            },
          },
        },
      },
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
          select: {
            id: true,
            name: true,
            credit: true,
            trainingBlocks: {
              select: { graduation: true, useForFinalScore: true },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.studentSemesterResult.findMany({
      where: { studentId },
      select: {
        semesterIndexInCourse: true,
        semester: { select: { id: true } },
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
  for (const ssr of semesterResults) {
    ssrByIndex.set(ssr.semesterIndexInCourse, ssr)
  }

  type LatestClass = (typeof semesters)[number]["subjectClasses"][number]
  const latestBySubject = new Map<string, LatestClass>()
  const firstSeenSemesterId = new Map<string, string>()
  for (const semester of semesters) {
    for (const subjectClass of semester.subjectClasses) {
      const subjectId = subjectClass.subject?.id
      if (!subjectId) continue
      if (!firstSeenSemesterId.has(subjectId)) {
        firstSeenSemesterId.set(subjectId, semester.id)
      }
      latestBySubject.set(subjectId, subjectClass)
    }
  }

  type MonHocRow = {
    tenMonHoc: string
    soTC: number | null
    diemhe10: number | null
    diemhe4: number | null
    diemchu: string | null
    pass: boolean | null
    baoLuu: boolean
  }

  const toRow = ({
    tenMonHoc,
    soTC,
    rawScore,
    isGraduation,
    isConditional,
    attendanceScore,
    midtermScore,
    examScore,
    baoLuu = false,
  }: {
    tenMonHoc: string
    soTC: number | null
    rawScore: number | null
    isGraduation: boolean
    isConditional: boolean
    attendanceScore?: number | null
    midtermScore?: number | null
    examScore?: number | null
    baoLuu?: boolean
  }): MonHocRow => {
    const converted =
      rawScore != null
        ? convertScoreWithGraduation({
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
        : null
    return {
      tenMonHoc,
      soTC,
      diemhe10: rawScore,
      diemhe4: converted?.base4 ?? null,
      diemchu: converted?.letter ?? null,
      pass: converted?.pass ?? null,
      baoLuu,
    }
  }

  const classRowsByGroup = new Map<string, MonHocRow[]>()
  for (const [subjectId, subjectClass] of latestBySubject) {
    const groupKey = firstSeenSemesterId.get(subjectId)
    if (!groupKey) continue
    for (const subjectClassStudent of subjectClass.subjectClassStudent) {
      const rawScore =
        toNumber(subjectClassStudent.manualFinalScore) ?? toNumber(subjectClassStudent.finalScore)
      const ctdt = ctdtBySubject.get(subjectId)
      const trainingBlock = subjectClass.subject?.trainingBlocks?.[0]
      const isGraduation = ctdt?.graduation ?? trainingBlock?.graduation === true
      const isConditional = ctdt?.isConditional ?? trainingBlock?.useForFinalScore === false

      let tenMonHoc = subjectClass.subject?.name ?? ""
      if (subjectClass.type === $Enums.SubjectClassType.RETAKE) {
        tenMonHoc += " (Học lại)"
      } else if (subjectClass.type === $Enums.SubjectClassType.REEXAM) {
        tenMonHoc += " (Thi lại)"
      }

      const rows = classRowsByGroup.get(groupKey) ?? []
      rows.push(
        toRow({
          tenMonHoc,
          soTC: toNumber(subjectClass.subject?.credit),
          rawScore,
          isGraduation,
          isConditional,
          attendanceScore: toNumber(subjectClassStudent.attendanceScore),
          midtermScore: toNumber(subjectClassStudent.midtermScore),
          examScore: toNumber(subjectClassStudent.examScore),
        })
      )
      classRowsByGroup.set(groupKey, rows)
    }
  }

  const resolvePhienDiemGroupKey = (score: (typeof phienDiemScores)[number]): string => {
    const ctdtKy = ctdtBySubject.get(score.subjectVersionId)?.semester ?? null
    if (ctdtKy != null) {
      const ssr = ssrByIndex.get(ctdtKy)
      if (ssr) return ssr.semester.id
      return `ctdt-${ctdtKy}`
    }
    if (score.semesterId) return score.semesterId
    return "phien-diem"
  }

  const includedSubjectIds = new Set(latestBySubject.keys())
  const phienRowsByGroup = new Map<string, MonHocRow[]>()
  for (const score of phienDiemScores) {
    const subject = score.subjectVersion
    if (!subject?.id) continue
    if (includedSubjectIds.has(subject.id)) continue

    const rawScore = toNumber(score.manualFinalScore) ?? toNumber(score.finalScore)
    const ctdt = ctdtBySubject.get(subject.id)
    const trainingBlock = subject.trainingBlocks?.[0]
    const groupKey = resolvePhienDiemGroupKey(score)
    const rows = phienRowsByGroup.get(groupKey) ?? []
    rows.push(
      toRow({
        tenMonHoc: subject.name,
        soTC: toNumber(subject.credit),
        rawScore,
        isGraduation: ctdt?.graduation ?? trainingBlock?.graduation === true,
        isConditional: ctdt?.isConditional ?? trainingBlock?.useForFinalScore === false,
        baoLuu: isBaoLuuScoreDescription(score.description),
      })
    )
    phienRowsByGroup.set(groupKey, rows)
    includedSubjectIds.add(subject.id)
  }

  const scoredMonhocs = (rows: MonHocRow[]) =>
    rows.filter(
      (monHoc) => monHoc.diemhe10 != null || monHoc.diemhe4 != null || monHoc.diemchu != null
    )

  const toMonHocTableRows = (monHocs: MonHocRow[], startStt: number) => {
    let stt = startStt
    return monHocs.map((monHoc) => {
      const hasScore = monHoc.diemhe10 != null || monHoc.diemhe4 != null || monHoc.diemchu != null
      const isFail = hasScore && monHoc.pass === false
      const cellStyle = monHoc.baoLuu
        ? { color: BAO_LUU_EXCEL_COLOR }
        : isFail
          ? { bgColor: "FFFFC7CE", color: "FFFF0000" }
          : {}
      return {
        cells: [
          { value: stt++, align: "center" as const, ...cellStyle },
          { value: monHoc.tenMonHoc, colSpan: 6, border: true, ...cellStyle },
          { value: monHoc.soTC, align: "center" as const, ...cellStyle },
          {
            value: roundTo(monHoc.diemhe10, 1),
            align: "right" as const,
            numFmt: "0.0",
            ...cellStyle,
          },
          {
            value: roundTo(monHoc.diemhe4, 1),
            align: "right" as const,
            numFmt: "0.0",
            ...cellStyle,
          },
          { value: monHoc.diemchu, align: "center" as const, ...cellStyle },
        ],
      }
    })
  }

  const tableRows: TableRow[] = []
  const emittedGroups = new Set<string>()
  let stt = 1

  for (const semester of semesters) {
    const monHocs = scoredMonhocs([
      ...(classRowsByGroup.get(semester.id) ?? []),
      ...(phienRowsByGroup.get(semester.id) ?? []),
    ])
    emittedGroups.add(semester.id)
    if (monHocs.length === 0) continue

    const tenHocKi = [semester.code, semester.name, semester.schoolYear?.name]
      .filter(Boolean)
      .join(" - ")
    tableRows.push({
      cells: [
        {
          value: tenHocKi || semester.name || semester.code || "Học kỳ",
          colSpan: 9,
          bold: true,
          align: "left",
          border: true,
        },
      ],
    })
    const rows = toMonHocTableRows(monHocs, stt)
    tableRows.push(...rows)
    stt += rows.length
  }

  for (const [groupKey, rows] of phienRowsByGroup) {
    if (emittedGroups.has(groupKey)) continue
    const monHocs = scoredMonhocs(rows)
    if (monHocs.length === 0) continue

    const tenHocKi =
      groupKey === "phien-diem"
        ? "Phiên điểm"
        : groupKey.startsWith("ctdt-")
          ? `Học kỳ ${groupKey.replace("ctdt-", "")}`
          : groupKey
    tableRows.push({
      cells: [
        {
          value: tenHocKi,
          colSpan: 9,
          bold: true,
          align: "left",
          border: true,
        },
      ],
    })
    const monHocRows = toMonHocTableRows(monHocs, stt)
    tableRows.push(...monHocRows)
    stt += monHocRows.length
  }

  const gapRow: TableRow = { cells: [{ value: null, colSpan: 9, border: false }] }
  const today = nowVn()
  const hoVaTen = student.userProfile?.fullname ?? ""
  const maSinhVien = student.userProfile?.code ?? ""
  const fileName = `BDQT-${maSinhVien}-${hoVaTen}.xlsx`

  const buffer = await buildFromTemplate(prisma, {
    templatePath: "/mta/template/BangDiemQuaTrinh.xlsx",
    fileName,
    sheets: [
      {
        sheet: "BaoCaoDiem",
        data: {
          hoVaTen,
          ngaySinh: student.userProfile?.dateOfBirth
            ? formatDateVn(student.userProfile.dateOfBirth)
            : "",
          maSinhVien,
          ngayNhapHoc: course?.admissionStartDate ? formatDateVn(course.admissionStartDate) : "",
          ngonNguDaoTao: curriculumVersion?.trainingLanguage?.name ?? "",
          thoiGianDaoTao: curriculumVersion?.trainingTime?.name ?? "",
          nganhDaoTao:
            curriculum?.trainingMajor?.trainingField?.name || curriculum?.trainingField?.name || "",
          trinhDoDaoTao: curriculumVersion?.trainingLevel?.name ?? "",
          chuyenNganh:
            curriculum?.trainingMajor?.name ?? curriculum?.trainingMajor?.trainingField?.name ?? "",
          hinhThucDaoTao: curriculumVersion?.trainingType?.name ?? "",
        },
        boldDataKeys: ["hoVaTen"],
        tableStartCell: { row: 14, col: 1 },
        rows: [
          ...tableRows,
          gapRow,
          gapRow,
          {
            cells: [
              { value: null, colSpan: 5, border: false },
              {
                value: `Hà Nội, ngày ${formatNgayIn(today.date())} tháng ${formatThangIn(today.month() + 1)} năm ${today.year()}`,
                colSpan: 6,
                border: false,
                align: "center",
              },
            ],
          },
          {
            cells: [
              { value: null, colSpan: 5, border: false },
              {
                value: "  TL. GIÁM ĐỐC",
                colSpan: 6,
                border: false,
                align: "center",
                bold: true,
              },
            ],
          },
          {
            cells: [
              { value: null, colSpan: 5, border: false },
              {
                value: "  KT. TRƯỞNG PHÒNG ĐÀO TẠO",
                colSpan: 6,
                border: false,
                align: "center",
                bold: true,
              },
            ],
          },
          {
            cells: [
              { value: null, colSpan: 5, border: false },
              {
                value: "  PHÓ TRƯỞNG PHÒNG",
                colSpan: 6,
                border: false,
                align: "center",
                bold: true,
              },
            ],
          },
        ],
      },
    ],
  })

  return { buffer, fileName }
}
