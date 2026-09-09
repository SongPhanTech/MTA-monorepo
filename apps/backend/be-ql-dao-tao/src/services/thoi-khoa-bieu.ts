import type { $Enums, Prisma } from "@workspace/db"
import PizZip from "pizzip"
import { prisma } from ".."
import {
  fetchSubjectClassExamDates,
  parseExamDateValue,
  resolveSubjectClassIdFromExamDateDto,
} from "./exam-schedule"
import { renderXlsxTemplate } from "./render-xlsx-template"

type SubjectClassExport = Prisma.SubjectClassGetPayload<{
  include: {
    subject: {
      select: {
        code: true
        codeTkb: true
        name: true
        credit: true
        type: true
      }
    }
    mainLecturer: {
      include: { userProfile: { select: { fullname: true } } }
    }
    extraLecturer: {
      include: { userProfile: { select: { fullname: true } } }
    }
    room: {
      select: {
        name: true
      }
    }
    subjectClassTimes: true
  }
}>

const SCHEDULE_BY_LECTURER_TYPES: Set<string> = new Set(["Internship", "Project"])

const subjectClassInclude = {
  subject: {
    select: {
      code: true,
      codeTkb: true,
      name: true,
      credit: true,
      type: true,
    },
  },
  mainLecturer: {
    include: { userProfile: { select: { fullname: true } } },
  },
  extraLecturer: {
    include: { userProfile: { select: { fullname: true } } },
  },
  room: {
    select: {
      name: true,
    },
  },
  subjectClassTimes: {
    orderBy: [{ dayOfWeek: "asc" }, { startPeriod: "asc" }],
  },
} satisfies Prisma.SubjectClassInclude

function formatWeekday(dayOfWeek?: number | null) {
  if (!dayOfWeek) return ""
  return String(dayOfWeek)
}

function formatPeriod(startPeriod?: number | null, endPeriod?: number | null) {
  if (!startPeriod || !endPeriod) return ""
  return `${startPeriod}-${endPeriod}`
}

function buildExportRows(subjectClasses: SubjectClassExport[]) {
  const groupedBySubject = Object.groupBy(subjectClasses, (sc) => sc.subject.code)

  let rowIndex = 0
  return Object.entries(groupedBySubject).flatMap(([_, classes = []]) => {
    return classes.flatMap((sc) => {
      const isByLecturer = SCHEDULE_BY_LECTURER_TYPES.has(sc.subject.type)

      if (isByLecturer) {
        rowIndex++
        return [
          {
            no: rowIndex,
            subjectCode: sc.subject.codeTkb || sc.subject.code,
            subjectName: sc.subject.name,
            credit: sc.subject.credit,
            classCode: sc.code,
            lecturers: [sc.mainLecturer, sc.extraLecturer]
              .map((lecturer) => lecturer?.userProfile?.fullname)
              .filter(Boolean)
              .join(", "),
            weekday: "Theo KH của GV",
            period: "",
            room: sc.room?.name || "",
            maxStudent: sc.maxStudent,
            mergeWeekdayPeriod: true,
          },
        ]
      }

      const uniqueTimes = [
        ...new Map(
          sc.subjectClassTimes.map((time) => [
            `${time.dayOfWeek}-${time.startPeriod}-${time.endPeriod}`,
            time,
          ])
        ).values(),
      ]

      const timeSlots = uniqueTimes.length > 0 ? uniqueTimes : [null]

      return timeSlots.map((classTime) => {
        rowIndex++
        return {
          no: rowIndex,
          subjectCode: sc.subject.codeTkb || sc.subject.code,
          subjectName: sc.subject.name,
          credit: sc.subject.credit,
          classCode: sc.code,
          lecturers: [sc.mainLecturer, sc.extraLecturer]
            .map((lecturer) => lecturer?.userProfile?.fullname)
            .filter(Boolean)
            .join(", "),
          weekday: formatWeekday(classTime?.dayOfWeek),
          period: formatPeriod(classTime?.startPeriod, classTime?.endPeriod),
          room: sc.room?.name || "",
          maxStudent: sc.maxStudent,
          mergeWeekdayPeriod: false,
        }
      })
    })
  })
}

function buildSchoolYearLabel(schoolYear: { name: string; startDate: Date }) {
  if (schoolYear.name?.trim()) {
    return schoolYear.name.trim()
  }
  const start = new Date(schoolYear.startDate).getFullYear()
  return `${start} - ${start + 1}`
}

function buildSemesterTitle(semesterName: string, schoolYearLabel: string) {
  return `${semesterName.toUpperCase()}, NĂM HỌC ${schoolYearLabel.toUpperCase()}`
}

function sanitizeSheetName(name: string) {
  return name.replace(/[\\/?*:[\]]/g, "_").slice(0, 31) || "Khoa"
}

const DATA_START_ROW = 7

type SheetMergeInfo = { sheetIndex: number; mergeRows: number[] }

function applyWeekdayPeriodMerges(buffer: Buffer, sheetMergeInfos: SheetMergeInfo[]): Buffer {
  if (sheetMergeInfos.every((s) => s.mergeRows.length === 0)) return buffer

  const zip = new PizZip(buffer)

  for (const { sheetIndex, mergeRows } of sheetMergeInfos) {
    if (mergeRows.length === 0) continue

    const sheetPath = `xl/worksheets/sheet${sheetIndex}.xml`
    const sheetFile = zip.file(sheetPath)
    if (!sheetFile) continue

    let xml = sheetFile.asText()
    const newRefs = mergeRows.map((r) => `<mergeCell ref="G${r}:H${r}"/>`).join("")

    if (/<mergeCells\s/.test(xml)) {
      xml = xml.replace(
        /(<mergeCells\s+count=")(\d+)(")/,
        (_, pre, count, post) => `${pre}${Number(count) + mergeRows.length}${post}`
      )
      xml = xml.replace("</mergeCells>", `${newRefs}</mergeCells>`)
    } else {
      xml = xml.replace(
        "</sheetData>",
        `</sheetData><mergeCells count="${mergeRows.length}">${newRefs}</mergeCells>`
      )
    }

    zip.file(sheetPath, xml)
  }

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer
}

export async function exportThoiKhoaBieu({
  semesterId,
  trainingObjectTypeId,
  trainingCourseId,
  type,
}: {
  semesterId: string
  trainingObjectTypeId: string
  trainingCourseId?: string
  type?: $Enums.SubjectClassType
}) {
  const [semester, trainingObjectType] = await Promise.all([
    prisma.semester.findUniqueOrThrow({
      where: { id: semesterId },
      include: {
        schoolYear: true,
      },
    }),
    prisma.trainingObjectType.findUniqueOrThrow({
      where: { id: trainingObjectTypeId },
      select: { name: true },
    }),
  ])

  const schoolYearLabel = buildSchoolYearLabel(semester.schoolYear)

  const subjectClassWhere = {
    semesterId,
    trainingObjectTypeId,
    ...(type ? { type } : {}),
    active: true,
    deletedAt: null,
    cancelled: false,
    status: "OFFICIAL" as const,
  }

  const trainingCourses = trainingCourseId
    ? await prisma.trainingCourse.findMany({
        where: {
          id: trainingCourseId,
          trainingObjectTypeId,
          deletedAt: null,
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : await prisma.trainingCourse.findMany({
        where: {
          trainingObjectTypeId,
          deletedAt: null,
          fixedClass: {
            some: {
              deletedAt: null,
              subjectClasses: {
                some: subjectClassWhere,
              },
            },
          },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })

  if (trainingCourses.length === 0) {
    throw new Error("Không tìm thấy khóa học để xuất tờ trình")
  }

  const templatePath = "MAU2_DanSu_template.xlsx"
  const sheets: { sheetName: string; data: Record<string, unknown> }[] = []
  const sheetMergeInfos: SheetMergeInfo[] = []

  for (const trainingCourse of trainingCourses) {
    const subjectClasses = await prisma.subjectClass.findMany({
      where: {
        ...subjectClassWhere,
        OR: [
          { fixedClasses: { some: { trainingCourseId: trainingCourse.id } } },
          { fixedClasses: { none: {} } },
        ],
      },
      include: subjectClassInclude,
      orderBy: [{ subject: { code: "asc" } }, { code: "asc" }],
    })

    if (subjectClasses.length === 0) {
      continue
    }

    const rows = buildExportRows(subjectClasses)
    const mergeRows = rows
      .map((row, idx) => (row.mergeWeekdayPeriod ? DATA_START_ROW + idx : -1))
      .filter((r) => r > 0)

    sheets.push({
      sheetName: sanitizeSheetName(trainingCourse.name),
      data: {
        semesterName: buildSemesterTitle(semester.name, schoolYearLabel),
        courseName: trainingCourse.name.toUpperCase(),
        trainingObjectTypeName: trainingObjectType.name.toUpperCase(),
        data: rows,
      },
    })

    sheetMergeInfos.push({ sheetIndex: sheets.length, mergeRows })
  }

  if (sheets.length === 0) {
    throw new Error("Không có dữ liệu thời khoá biểu để xuất")
  }

  const buffer = await renderXlsxTemplate(prisma, {
    templatePath,
    sheets,
    autoPatchTablePlaceholders: true,
  })

  return applyWeekdayPeriodMerges(buffer, sheetMergeInfos)
}

export type SyncExamDatesResult = {
  message: string
  totalClasses: number
  matched: number
  updated: number
  unchanged: number
  unmatched: number
  unmatchedIds: string[]
}

/** Lấy lịch thi từ ExamScheduling Public API và cập nhật SubjectClass.examDate. */
export async function syncSubjectClassExamDates({
  semesterId,
  trainingObjectTypeId,
  trainingCourseId,
  fixedClassId,
  type,
}: {
  semesterId: string
  trainingObjectTypeId: string
  trainingCourseId?: string
  fixedClassId?: string
  type?: $Enums.SubjectClassType
}): Promise<SyncExamDatesResult> {
  const subjectClasses = await prisma.subjectClass.findMany({
    where: {
      semesterId,
      trainingObjectTypeId,
      ...(type ? { type } : {}),
      active: true,
      deletedAt: null,
      cancelled: false,
      status: "OFFICIAL",
      ...(trainingCourseId
        ? { fixedClasses: { some: { trainingCourseId, deletedAt: null } } }
        : {}),
      ...(fixedClassId ? { fixedClasses: { some: { id: fixedClassId, deletedAt: null } } } : {}),
    },
    select: { id: true, code: true, examDate: true },
  })

  if (subjectClasses.length === 0) {
    return {
      message: "Không có lớp môn học phù hợp bộ lọc để đồng bộ lịch thi",
      totalClasses: 0,
      matched: 0,
      updated: 0,
      unchanged: 0,
      unmatched: 0,
      unmatchedIds: [],
    }
  }

  const sourceIds = subjectClasses.map((item) => item.id)
  const codeById = new Map(subjectClasses.map((item) => [item.id, item.code]))
  const idByCode = new Map(
    subjectClasses
      .filter((item) => item.code)
      .map((item) => [item.code.trim().toLowerCase(), item.id])
  )
  const examRows = await fetchSubjectClassExamDates(sourceIds)

  // Mỗi LMH có thể có nhiều lớp thi → lấy ngày thi sớm nhất có exam_date
  const examDateBySubjectClassId = new Map<string, Date>()
  for (const row of examRows) {
    const byId = resolveSubjectClassIdFromExamDateDto(row)
    const byCode = row.subject_class_code?.trim().toLowerCase()
    const subjectClassId =
      (byId && codeById.has(byId) ? byId : null) ||
      (byCode ? idByCode.get(byCode) : null) ||
      (byId && sourceIds.includes(byId) ? byId : null)
    const examDate = parseExamDateValue(row.exam_date)
    if (!subjectClassId || !examDate) continue
    const current = examDateBySubjectClassId.get(subjectClassId)
    if (!current || examDate.getTime() < current.getTime()) {
      examDateBySubjectClassId.set(subjectClassId, examDate)
    }
  }

  let updated = 0
  let unchanged = 0
  const unmatchedIds: string[] = []
  const updates: { id: string; examDate: Date }[] = []

  for (const subjectClass of subjectClasses) {
    const nextExamDate = examDateBySubjectClassId.get(subjectClass.id)
    if (!nextExamDate) {
      unmatchedIds.push(subjectClass.id)
      continue
    }

    const prevTime = subjectClass.examDate?.getTime()
    if (prevTime != null && prevTime === nextExamDate.getTime()) {
      unchanged += 1
      continue
    }

    updates.push({ id: subjectClass.id, examDate: nextExamDate })
  }

  const UPDATE_CHUNK = 50
  for (let i = 0; i < updates.length; i += UPDATE_CHUNK) {
    const chunk = updates.slice(i, i + UPDATE_CHUNK)
    await prisma.$transaction(
      chunk.map((item) =>
        prisma.subjectClass.update({
          where: { id: item.id },
          data: { examDate: item.examDate },
        })
      )
    )
    updated += chunk.length
  }

  const matched = examDateBySubjectClassId.size

  return {
    message: `Đồng bộ lịch thi xong: cập nhật ${updated}, giữ nguyên ${unchanged}, chưa có lịch ${unmatchedIds.length}`,
    totalClasses: subjectClasses.length,
    matched,
    updated,
    unchanged,
    unmatched: unmatchedIds.length,
    unmatchedIds: unmatchedIds.slice(0, 50),
  }
}
