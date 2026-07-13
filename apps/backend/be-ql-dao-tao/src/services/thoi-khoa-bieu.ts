import type { $Enums, Prisma } from "@workspace/db"
import { prisma } from ".."
import { renderXlsxTemplate } from "./render-xlsx-template"

type SubjectClassExport = Prisma.SubjectClassGetPayload<{
  include: {
    subject: {
      select: {
        code: true
        codeTkb: true
        name: true
        credit: true
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

const subjectClassInclude = {
  subject: {
    select: {
      code: true,
      codeTkb: true,
      name: true,
      credit: true,
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

    sheets.push({
      sheetName: sanitizeSheetName(trainingCourse.name),
      data: {
        semesterName: buildSemesterTitle(semester.name, schoolYearLabel),
        courseName: trainingCourse.name.toUpperCase(),
        trainingObjectTypeName: trainingObjectType.name.toUpperCase(),
        data: buildExportRows(subjectClasses),
      },
    })
  }

  if (sheets.length === 0) {
    throw new Error("Không có dữ liệu thời khoá biểu để xuất")
  }

  return renderXlsxTemplate(prisma, {
    templatePath,
    sheets,
    autoPatchTablePlaceholders: true,
  })
}
